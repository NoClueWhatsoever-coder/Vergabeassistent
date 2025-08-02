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

// Hilfsfunktion, um Listen in Antworten der KI schöner zu rendern
function formatNachricht(text) {
  if (!text) return '';
  let html = text;
  let hasList = false;
  // Ersetze Bullet‑Points („- “ am Zeilenanfang) durch Listenelemente
  html = html.replace(/(?:^|\n)\s*\-\s+(.*)(?=\n|$)/g, function(_, item) {
    hasList = true;
    return `<li>${item.trim()}</li>`;
  });
  if (hasList) {
    html = '<ul>' + html + '</ul>';
  }
  // Normale Zeilenumbrüche
  html = html.replace(/\n/g, '<br>');
  return html;
}

// Neue Anzeige der Nachrichten im Chat: passt zu projekt.html
function appendMessage(text, sender = 'ai') {
  const chatMessages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.classList.add('message', sender === 'user' ? 'user' : 'assistant');
  if (sender === 'ai') {
    // KI-Antwort hübsch formatieren und mit Kopier-Icon versehen
    const formatted = formatNachricht(text);
    div.innerHTML = `
      <div class="msg-header" style="display:flex;align-items:center;justify-content:space-between;">
        <span class="assistant-name" style="font-weight:600;color:#166ca8;">VergabeAssistent</span>
        <button class="copy-btn" title="Antwort kopieren"><span class="material-icons" style="font-size:1.1em;">content_copy</span></button>
      </div>
      <div class="msg-body">${formatted}</div>
    `;
    // Kopier-Button Event
    setTimeout(() => {
      const btn = div.querySelector('.copy-btn');
      if (btn) {
        btn.onclick = function() {
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = '✔️';
            setTimeout(() => {
              btn.innerHTML = '<span class="material-icons" style="font-size:1.1em;">content_copy</span>';
            }, 1300);
          });
        };
      }
    }, 0);
  } else {
    // Benutzer-Nachricht
    const formattedUser = text.replace(/\n/g, '<br>');
    div.innerHTML = `<b>Du:</b> ${formattedUser}`;
  }
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();
  if (!message) return;
  // Referenz auf den Senden-Button (Demo-Chat)
  const sendBtn = document.getElementById('guestSendBtn');
  // Limit für Gäste prüfen
  if (!isLoggedIn()) {
    const count = getGuestChatCount();
    if (count >= guestChatLimit) {
      // Pop-Up Snackbar anzeigen (z.B. #snackbar), kannst du auch mit einem eigenen Toast machen
      zeigeSnackbar("Bitte registrieren Sie sich für einen unbegrenzten Zugang zum VergabeAssistent.");
      
      // Modal öffnen oder auf Registrierung weiterleiten:
      if (typeof openAuthModal === "function") {
        openAuthModal('register');
      } else {
        // Alternativ auf Registrierungsseite weiterleiten
        window.location.href = "registrieren.html";
      }
      return;
    }
  }
  // Wenn eingeloggt: Credits prüfen
  if (isLoggedIn() && typeof pruefeCredits === "function" && !pruefeCredits(2)) return;
  // User-Nachricht anzeigen
  appendMessage(message, 'user');
  input.value = '';
  // Ladeindikator auf dem Button aktivieren
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Analysiere';
    sendBtn.classList.add('loading');
  }
  try {
    // callAI aufrufen und auf Antwort warten
    const response = await callAI(
      message,
      "mistralai/mistral-7b-instruct:free",
      systemPrompt
    );
    // KI-Antwort anzeigen
    appendMessage(response, 'ai');
    // Guest-Limit aktualisieren oder Credits verbrauchen
    if (!isLoggedIn()) {
      incrementGuestChatCount();
      updateGuestChatCounter();
    } else if (typeof verwendeCredits === "function") {
      verwendeCredits(2);
    }
  } catch (err) {
    appendMessage(`<strong>Fehler:</strong> ${err.message}`, 'ai');
  } finally {
    // Ladeindikator zurücksetzen
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.classList.remove('loading');
      sendBtn.textContent = 'Senden';
    }
  }
}

function handleChatEnter(event) {
  if (event.key === 'Enter') {
    sendChatMessage();
  }
}


function zeigeSnackbar(msg) {
  let snackbar = document.getElementById('snackbar');
  if (!snackbar) {
    snackbar = document.createElement('div');
    snackbar.id = 'snackbar';
    snackbar.style.position = 'fixed';
    snackbar.style.left = '50%';
    snackbar.style.bottom = '34px';
    snackbar.style.transform = 'translateX(-50%)';
    snackbar.style.background = '#234f73';
    snackbar.style.color = '#fff';
    snackbar.style.padding = '1em 1.9em';
    snackbar.style.fontSize = '1.07em';
    snackbar.style.borderRadius = '11px';
    snackbar.style.boxShadow = '0 2px 22px #234f7336';
    snackbar.style.zIndex = 2999;
    snackbar.style.opacity = 0;
    snackbar.style.transition = 'opacity 0.26s';
    document.body.appendChild(snackbar);
  }
  snackbar.textContent = msg;
  snackbar.style.opacity = 1;
  setTimeout(() => {
    snackbar.style.opacity = 0;
  }, 3400);
}


document.addEventListener('DOMContentLoaded', function() {
  updateGuestChatCounter();
});
