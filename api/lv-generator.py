# lv-generator.py
from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer
import requests
import re

app = FastAPI()
model = SentenceTransformer('all-MiniLM-L6-v2')

QDRANT_URL = "http://localhost:6333/collections/leistungsdokumente/points/search"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = "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"  # Deinen Key eintragen!

def anonymize_text(text):
    # Entfernt typische Auftraggeber-/Ort-/Schulnamenmuster, kann bei Bedarf erweitert werden!
    patterns = [
        r"\b(Auftraggeber|Stadt|Landkreis|Gemeinde|Landratsamt|Bundesministerium|Landesamt|Ministerium|Verbandsgemeindeverwaltung|Landesbetrieb|Schule|Grundschule|Therme|Firma|Gymnasium|Mehrzweckhalle)[^\n,.;:]*",
        r"[A-ZÄÖÜ][a-zäöüß]+\s(Schule|Gymnasium|Therme|Klinik|Krankenhaus|Halle|Straße|Weg|Platz)",
        r"\b\d{5}\b",  # Postleitzahlen
        r"\b[A-ZÄÖÜ][a-zäöüß]+straße\b",
    ]
    for pat in patterns:
        text = re.sub(pat, "[ANONYMISIERT]", text, flags=re.I)
    return text

@app.post("/api/lv-generator")
async def lv_generator(req: Request):
    data = await req.json()

    # --- Neu: Multi-Turn/Verlauf aus messages (wie OpenAI) ---
    messages = data.get("messages")
    if messages and isinstance(messages, list):
        # Finde die letzte User-Eingabe für Embedding/Qdrant-Suche
        last_user_msg = None
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content")
                break
        if not last_user_msg:
            return {"error": "Keine Nutzereingabe im Verlauf gefunden."}

        # 1. Embedding auf letzte User-Eingabe
        emb = model.encode([last_user_msg])[0].tolist()

        # 2. Qdrant-Suche
        qdrant_req = {
            "vector": emb,
            "top": 10,
            "with_payload": True
        }
        res = requests.post(QDRANT_URL, json=qdrant_req)
        examples = []
        if res.ok:
            for hit in res.json()["result"]:
                ex = hit["payload"]
                titel = anonymize_text(str(ex.get("titel", "")))
                lvtext = anonymize_text(str(ex.get("lv_plaintext", "")))
                cpv = ex.get("cpv_code", "")
                examples.append({
                    "titel": titel,
                    "cpv_code": cpv,
                    "lv_auszug": lvtext[:5000]
                })
        # 3. Prompt für KI bauen: Komplette Historie + neue Beispiele
        context = "\n".join(
            [f"{i+1}. Titel: {e['titel']}, CPV: {e['cpv_code']}\nAuszug: {e['lv_auszug']}\n" for i, e in enumerate(examples)]
        )
        system_msg = (
            "Du bist ein Assistent zur Erstellung produktneutraler, vergaberechtskonformer Leistungsbeschreibungen für öffentliche Auftraggeber in Deutschland.\n"
            "Entferne immer Auftraggeber, Firmennamen, Orts- oder Schulnamen aus allen Beispielen. Verwende als Auftraggeber nur 'die ausschreibende Stelle' oder eine neutrale Formulierung."
        )
        # KI-Konversation als OpenAI-/OpenRouter-kompatibles Array
        full_messages = [
            {"role": "system", "content": system_msg},
            *messages,
            {"role": "user", "content": (
                "Hier sind einige ähnliche Leistungsbeschreibungen aus anderen Vergaben (nur als Inspiration, NICHT kopieren!):\n\n" + context +
                "\n\nBitte passe dein LV anhand der obigen Rückfragen und Beispiele an oder erstelle eine neue Version. Falls relevante Angaben fehlen, stelle gezielte Rückfragen."
            )}
        ]
        or_req = {
            "model": "openai/gpt-4o",
            "messages": full_messages
        }
    else:
        # --- Single-Prompt (Fallback, MVP) ---
        user_text = data.get("text", "")
        doc_text = data.get("documentText", "")
        full_text = user_text + "\n\n" + doc_text

        # 1. Embedding erzeugen
        emb = model.encode([full_text])[0].tolist()

        # 2. Qdrant-Suche
        qdrant_req = {
            "vector": emb,
            "top": 10,
            "with_payload": True
        }
        res = requests.post(QDRANT_URL, json=qdrant_req)
        examples = []
        if res.ok:
            for hit in res.json()["result"]:
                ex = hit["payload"]
                titel = anonymize_text(str(ex.get("titel", "")))
                lvtext = anonymize_text(str(ex.get("lv_plaintext", "")))
                cpv = ex.get("cpv_code", "")
                examples.append({
                    "titel": titel,
                    "cpv_code": cpv,
                    "lv_auszug": lvtext[:5000]
                })

        # 3. Prompt für KI bauen
        context = "\n".join(
            [f"{i+1}. Titel: {e['titel']}, CPV: {e['cpv_code']}\nAuszug: {e['lv_auszug']}\n" for i, e in enumerate(examples)]
        )
        prompt = f"""
Du bist ein Assistent zur Erstellung produktneutraler, vergaberechtskonformer Leistungsbeschreibungen für öffentliche Auftraggeber in Deutschland.

Entferne immer Auftraggeber, Firmennamen, Orts- oder Schulnamen aus allen Beispielen. Verwende als Auftraggeber nur 'die ausschreibende Stelle' oder eine neutrale Formulierung.

Nutzeranfrage:
{full_text}

Ähnliche Leistungsbeschreibungen:
{context}

Bitte formuliere einen vollständigen, produktneutralen Vorschlag für ein neues LV. Falls relevante Angaben fehlen, stelle gezielte Rückfragen.
"""
        or_req = {
            "model": "openai/gpt-4o",
            "messages": [
                {"role": "system", "content": "Du bist ein Experte für öffentliche Ausschreibungen. Entferne immer Identifizierer von Auftraggebern, Schulen, Orten aus allen Texten!"},
                {"role": "user", "content": prompt}
            ]
        }

    # 4. OpenRouter call (für beide Fälle identisch)
    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}"}
    or_res = requests.post(OPENROUTER_URL, json=or_req, headers=headers)
    result = ""
    if or_res.ok:
        data = or_res.json()
        result = data['choices'][0]['message']['content']

    return {"result": result, "used_examples": examples}