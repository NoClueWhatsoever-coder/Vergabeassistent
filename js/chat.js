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
      "Du bist ein rechtlicher Assistent für deutsches Vergaberecht. Antworte sachlich, juristisch fundiert und möglichst aktuell unter Berücksichtigung der Rechtsprechung und Entscheidungen von Vergabekammern und Oberlandesgerichten."
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
