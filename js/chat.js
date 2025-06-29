// chat.js

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;

  if (!pruefeCredits(2)) return;

  const messagesContainer = document.getElementById('chatMessages');

  // User-Message anzeigen
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
    const response = await callAI(
      message,
      "openai/gpt-3.5-turbo", // kostenloses Modell bei OpenRouter
      "Du bist ein rechtlicher Assistent für deutsches Vergaberecht. Antworte sachlich, juristisch fundiert und möglichst aktuell unter Berücksichtigung der Rechtsprechung und Entscheidungen von Vergabekammern und Oberlandesgerichten."
    );
    aiMsg.innerHTML = `<strong>VergabeAssist KI:</strong> ${response}`;
    verwendeCredits(2);
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

/**
 * Ruft die eigene API-Routine für OpenRouter/OpenAI-Chat ab.
 * Der API-Key bleibt im Backend!
 */
async function callAI(prompt, model, systemPrompt) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, systemPrompt })
  });
  if (!res.ok) throw new Error('KI-Service nicht erreichbar');
  const data = await res.json();
  if (!data.text) throw new Error('Keine Antwort erhalten');
  return data.text;
}
