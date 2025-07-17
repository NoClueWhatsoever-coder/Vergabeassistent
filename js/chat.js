// chat.js

// Limit-Konstanten
const guestChatLimit = 5;
// localStorage-Keys
const STORAGE_KEY_COUNT = "guestChatCount";
const STORAGE_KEY_DATE = "guestChatDate";

function getGuestChatCount() {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = localStorage.getItem(STORAGE_KEY_DATE);
  if (lastDate !== today) {
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

// System-Prompt bleibt gleich
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

**WICHTIGSTE GRUNDSÄTZE:**
- Antworte **niemals** mit erfundenen, nicht existierenden oder halluzinierten Gesetzesvorschriften, Paragraphen, Richtlinien oder Gerichtsurteilen!
- Wenn du unsicher bist oder es zu einem Thema keine klare, existierende Vorschrift oder Rechtsprechung gibt, schreibe explizit: 
  "Zu diesem Thema kenne ich keine eindeutige gesetzliche Regelung. Bitte wende dich im Zweifel an eine Rechtsberatung oder die zuständige Vergabestelle."
- Gib nur echte, nachprüfbare Gesetze, Verordnungen und Vorschriften an (wie GWB, VgV, VOB/A, UVgO, SektVO, VergStatVO, relevante EU-Richtlinien etc.).
- Niemals Paragraphen erfinden, keine Fantasie-Verordnungen, keine falschen Kurzbezeichnungen!
- Rechtsgrundlagen nur nennen, wenn du dir absolut sicher bist, dass es sie gibt.

**Antwort-Format:**
- Prägnante Zusammenfassung der wichtigsten Punkte.
- Hinweise zu den Gesetzen/Verordnungen/Paragraphen (ggf. mit §-Angabe, aber nur echte!).
- Praxis-Tipp oder nächster Schritt für den Fragesteller.
- Falls Rechtsprechung relevant: Kurzfassung mit Gericht, Beschlussdatum/Aktenzeichen (nur wenn sicher und nachprüfbar).

**NOCH EINMAL:**
- Wenn keine gesicherte, reale Rechtslage vorliegt, verweise explizit auf diesen Umstand und rate ggf. zur Nachfrage bei einer Rechtsberatung.
- **Erfinde niemals Quellen, Paragrafen oder Rechtsprechung!**
`;

// Optional: Markdown-Parser (marked.js via CDN einbinden!)
function parseMarkdown(text) {
  if (window.marked) {
    return marked.parse(text);
  } else {
    // Simple Ersatzformatierung (nur Zeilenumbrüche)
    return text.replace(/\n/g, '<br>');
  }
}

function appendMessage(text, sender = 'ai') {
  const chatMessages = document.getElementById('chatMessages');
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + sender;

  // Avatar-Icon (🤖 für KI, 👤 für User)
  let avatarHtml = '';
  if (sender === 'ai') avatarHtml = '<span class="chat-avatar">🤖</span>';
  if (sender === 'user') avatarHtml = '<span class="chat-avatar">👤</span>';

  // Text als HTML (Markdown falls möglich)
  bubble.innerHTML = avatarHtml + `<span>${parseMarkdown(text)}</span>`;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

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
  if (isLoggedIn() && typeof pruefeCredits === "function" && !pruefeCredits(2)) return;

  // User-Message anzeigen
  appendMessage(message, 'user');
  input.value = '';

  // KI antwortet asynchron
  appendMessage('<span style="opacity:0.7">Antwort wird geladen ...</span>', 'ai');

  try {
    const chatMessages = document.getElementById('chatMessages');
    // callAI aufrufen
    const response = await callAI(
      message,
      "mistralai/mistral-7b-instruct:free",
      systemPrompt
    );
    // Ladeanzeige entfernen
    chatMessages.removeChild(chatMessages.lastChild);
    // KI-Antwort anzeigen (mit Markdown)
    appendMessage(response, 'ai');

    if (!isLoggedIn()) {
      incrementGuestChatCount();
      updateGuestChatCounter();
    } else if (typeof verwendeCredits === "function") {
      verwendeCredits(2);
    }
  } catch (err) {
    // Ladeanzeige entfernen
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.removeChild(chatMessages.lastChild);
    appendMessage(`<strong>Fehler:</strong> ${err.message}`, 'ai');
  }
}

function handleChatEnter(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}

document.addEventListener('DOMContentLoaded', function() {
  updateGuestChatCounter();
});
