// projekt.js

// 1. Supabase Setup (anpassen!)
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // gekürzt
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Hole Projekt-ID aus URL
function getProjektId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// 3. Projektdaten laden & anzeigen
async function ladeProjekt() {
  const id = getProjektId();
  if (!id) {
    alert('Keine Projekt-ID in URL gefunden!');
    return;
  }
  // Projekt laden
  const { data: projekt, error } = await supabase
    .from('projekte')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !projekt) {
    alert('Projekt nicht gefunden!');
    return;
  }
  document.getElementById('projektTitel').textContent = projekt.titel;
  document.getElementById('projektArt').textContent = projekt.art || '-';
  document.getElementById('projektFrist').textContent = projekt.frist || '-';
  document.getElementById('projektSchaetzwert').textContent = projekt.schaetzwert ? projekt.schaetzwert + " €" : '-';
  document.getElementById('projektCPV').textContent = projekt.cpv || '-';
}

// 4. Chathistorie laden & anzeigen
let chathistory = [];

async function ladeChat() {
  const id = getProjektId();
  const { data: nachrichten, error } = await supabase
    .from('chats')
    .select('*')
    .eq('projekt_id', id)
    .order('created_at', { ascending: true });
  const chatBox = document.getElementById('chatMessages');
  chatBox.innerHTML = '';
  chathistory = [];
  if (error || !nachrichten || nachrichten.length === 0) {
    chatBox.innerHTML = `<div class="chat-hint">Noch keine Nachrichten. Beschreibe deinen Bedarf oder lade eine Datei hoch.</div>`;
    return;
  }
  nachrichten.forEach((msg, idx) => {
    chathistory.push({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.nachricht || ''
    });
    const div = document.createElement('div');
    div.classList.add('message', msg.sender === 'user' ? 'user' : 'assistant');

    if (msg.sender === 'assistant') {
      // KI-Antwort mit Kopier-Button
      div.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span><b>KI:</b></span>
          <button class="copy-btn" title="Text kopieren" data-msg-idx="${idx}">⧉ Kopieren</button>
        </div>
        <div class="msg-body">${(msg.nachricht || '').replace(/\n/g, "<br>")}</div>
      `;
    } else {
      div.innerHTML = `<b>Du:</b> ${(msg.nachricht || '').replace(/\n/g, "<br>")}`;
    }
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;

  // Kopier-Buttons nach dem Laden aktivieren!
  setTimeout(() => {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = function() {
        // Welcher KI-Text?
        const idx = parseInt(btn.getAttribute('data-msg-idx'));
        const msg = nachrichten[idx];
        if (msg && msg.nachricht) {
          navigator.clipboard.writeText(msg.nachricht)
            .then(() => {
              btn.textContent = "✔️ Kopiert";
              setTimeout(() => btn.textContent = "⧉ Kopieren", 1300);
            });
        }
      }
    });
  }, 100);
}

// 5. Nachricht senden (User → Supabase + KI)
async function sendeNachricht() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) {
    alert('Bitte gib eine Nachricht ein.');
    return;
  }
  const id = getProjektId();

  // User-Nachricht speichern
  let { error } = await supabase.from('chats').insert([{
    projekt_id: id,
    sender: 'user',
    nachricht: text
  }]);
  if (error) {
    alert('Fehler beim Speichern der Nachricht.');
    return;
  }
  input.value = '';
  await ladeChat(); // History neu laden (chathistory wird aktualisiert)

  // --- KI-API: Gesamten Chatverlauf mitschicken! ---
  try {
    const kiAntwort = await lvGeneratorRequestWithHistory();
    // KI-Antwort als neue Nachricht speichern
    await supabase.from('chats').insert([{
      projekt_id: id,
      sender: 'assistant',
      nachricht: kiAntwort
    }]);
    ladeChat();
  } catch (err) {
    alert('Fehler bei der KI-Antwort: ' + err.message);
  }
}

// Datei per Drag&Drop ins Eingabefeld einfügen (ohne Speicherung!)
document.addEventListener('DOMContentLoaded', () => {
  ladeProjekt();
  ladeChat();

  document.getElementById('sendBtn').onclick = sendeNachricht;
  document.getElementById('chatInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendeNachricht();
    }
  });

  const chatInput = document.getElementById('chatInput');
  chatInput.addEventListener('dragover', (e) => { e.preventDefault(); chatInput.style.background = '#eef'; });
  chatInput.addEventListener('dragleave', (e) => { chatInput.style.background = ''; });
  chatInput.addEventListener('drop', async (event) => {
    event.preventDefault();
    chatInput.style.background = '';
    const file = event.dataTransfer.files[0];
    if (!file) return;
    if (file.type.startsWith('text') || file.type === 'application/json') {
      const text = await file.text();
      chatInput.value = text;
      alert('Dateiinhalt wurde eingefügt. Die Datei wurde NICHT gespeichert!');
    } else {
      alert('Für den Test lade bitte nur reine Textdateien hoch.');
    }
  });
});

// --- Die neue KI-API, die den kompletten Verlauf sendet ---
async function lvGeneratorRequestWithHistory() {
  // Gesamte Chathistorie (array aus {role, content}) an Backend schicken!
  const res = await fetch("http://localhost:8000/api/lv-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chathistory })
  });
  const data = await res.json();
  if (data.result) {
    return data.result;
  } else {
    throw new Error(data.error || "Unbekannter Fehler bei LV-Generator");
  }
}