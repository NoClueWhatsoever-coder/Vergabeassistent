// chat.js

// Limit-Konstanten
const guestChatLimit = 5;

// localStorage-Keys
const STORAGE_KEY_COUNT = "guestChatCount";
const STORAGE_KEY_DATE = "guestChatDate";

// Beim Laden: Zähler und Tagesdatum prüfen/setzen
function getGuestChatCount() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem(STORAGE_KEY_DATE);
  if (lastDate !== today) {
    // Tag hat gewechselt: zurücksetzen
    localStorage.setItem(STORAGE_KEY_DATE, today);
    localStorage.setItem(STORAGE_KEY_COUNT, "0");
    return 0;
  }
  return parseInt(localStorage.getItem(STORAGE_KEY_COUNT) || "0", 10);
}

function incrementGuestChatCount() {
  let count = getGuestChatCount() + 1;
  localStorage.setItem(STORAGE_KEY_COUNT, count.toString());
}

function updateGuestChatCounter() {
  if (!isLoggedIn()) {
    const count = getGuestChatCount();
    const counter = document.getElementById('guestChatCounter');
    counter.textContent = `Noch ${guestChatLimit - count} von ${guestChatLimit} Fragen heute möglich.`;
  }
}

function isLoggedIn() {
  // Passe das ggf. an, falls du ein echtes Login-Flag verwendest
  return typeof currentUser === "object" && currentUser !== null;
}

// Optimierter System-Prompt (inkl. Bundesland + Verwaltungspraxis)
const systemPrompt = `
Du bist eine hochspezialisierte KI für deutsches und europäisches Vergaberecht.

**Nutzer-Kontext:**
Es fragt ein öffentlicher Auftraggeber oder Fördermittelempfänger aus Deutschland, der an das deutsche und europäische Vergaberecht gebunden ist.

**Deine Aufgabe:**
- Antworte ausschließlich mit Bezug auf das aktuelle deutsche und europäische Vergaberecht.
- Weise in deiner Antwort immer auf die maßgeblichen Paragrafen und Vorschriften hin (z. B. GWB, VgV, VOB/A, UVgO, SektVO, VergStatVO, EU-Richtlinien, sowie relevante landesspezifische Vorgaben).
- Berücksichtige aktuelle Rechtsprechung, insbesondere Entscheidungen von Vergabekammern und Oberlandesgerichten. Zitiere wichtige Beschlüsse oder führe sie beispielhaft an, wenn möglich.
- Gib praktische, umsetzbare Hinweise für die Verwaltungspraxis (z. B. Checklisten oder Formulierungsbeispiele).
- Weise auf typische Fehler oder Risiken hin, die in dem Zusammenhang zu beachten sind.

**Spezialregeln:**
- Wenn der Nutzer einen Bundesland-Hinweis gibt (z. B. „NRW“, „Bayern“, „Hessen“), berücksichtige länderspezifische Vorschriften oder Besonderheiten in deiner Antwort.
- Wenn es keine eindeutige oder klare Rechtsgrundlage gibt, schildere die typische Verwaltungspraxis oder praxiserprobte Handlungsempfehlungen.

**Antwort-Format:**
- Prägnante Zusammenfassung der wichtigsten Punkte.
- Hinweise zu den Gesetzen/Verordnungen/Paragraphen (ggf. mit §-Angabe).
- Praxis-Tipp oder nächster Schritt für den Fragesteller.
- Falls Rechtsprechung relevant: Kurzfassung mit Gericht, Beschlussdatum/Aktenzeichen.

**Wichtig:**  
Antworte verständlich und strukturiert. Erfinde keine Vorschriften oder Gerichtsentscheidungen.
`;

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  // Limit für Gäste prüfen
  if (!isLoggedIn()) {
    const count = getGuestChatCount();
    if (count >= guestChatLimit) {
      alert('Sie haben Ihr Tageslimit für den Demo-Chat erreicht. Bitte registrieren Sie sich, um unbegrenzt weiterzufragen.');
      input.value = '';
      return;
    }
  }

  // Optional: Für eingeloggte Nutzer mit Credits weiterprüfen
  if (isLoggedIn() && typeof pruefeCredits === "function" && !pruefeCredits(2)) return;

  const messagesContainer = document.getElementById('chatMessages');

  // User Message anzeigen
  const userMsg = document.createElement('div');
  userMsg.className = 'message user';
  userMsg.innerHTML = `<strong>Sie:</strong> ${message}`;
  messagesContainer.appendChild(userMsg);

  input.value = '';

  // KI antwortet asynchron
  const aiMsg = document.createElement('div');
  aiMsg.className = 'message ai';
  aiMsg.innerHTML = `<strong>VergabeAssist KI:</strong> <span style="opacity:0.7">Antwort wird geladen ...</span>`;
  messagesContainer.appendChild(aiMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // KI-Aufruf
    const response = await callAI(
      message,
      "mistralai/mistral-7b-instruct:free",
      systemPrompt
    );
    aiMsg.innerHTML = `<strong>VergabeAssist KI:</strong> ${response}`;

    if (!isLoggedIn()) {
      incrementGuestChatCount();
      updateGuestChatCounter();
    } else if (typeof verwendeCredits === "function") {
      verwendeCredits(2);
    }
  } catch (err) {
    aiMsg.innerHTML = `<strong>Fehler:</strong> ${err.message}`;
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleChatEnter(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

// Counter initialisieren beim Laden
document.addEventListener('DOMContentLoaded', function() {
  updateGuestChatCounter();
});
