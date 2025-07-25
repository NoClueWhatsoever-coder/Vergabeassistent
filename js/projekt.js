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

// Hilfsfunktion: Sicheres Anzeigen (verträgt null/undefined/"" und verschiedene Feldnamen)
function zeigeFeld(val) {
  if (val === undefined || val === null || val === "") return "-";
  return val;
}

async function ladeProjekt() {
  const id = getProjektId();
  if (!id) {
    alert('Keine Projekt-ID in URL gefunden!');
    return;
  }
  const { data: projekt, error } = await supabase
    .from('projekte')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !projekt) {
    alert('Projekt nicht gefunden!');
    return;
  }
  document.getElementById('projektTitel').textContent = zeigeFeld(projekt.titel);
  document.getElementById('projektArt').textContent = zeigeFeld(projekt.art);
  document.getElementById('projektFrist').textContent = zeigeFeld(projekt.frist);
  // Schätzwert: kann als Zahl oder String oder null kommen
  const schätzwert = projekt.schaetzwert !== undefined ? projekt.schaetzwert : projekt.schaetz_wert;
  document.getElementById('projektSchaetzwert').textContent = schätzwert ? schätzwert + " €" : "-";
  // CPV: manchmal cpv, manchmal cpv_code (je nach Insert!)
  document.getElementById('projektCPV').textContent = zeigeFeld(projekt.cpv || projekt.cpv_code);
  document.getElementById('abschliessenBtn').onclick = async function() {
    const id = getProjektId();
    await supabase.from('projekte')
      .update({ status: 'Abgeschlossen' })
      .eq('id', id);
    alert("Projekt wurde als abgeschlossen markiert.");
    ladeProjekt(); // ggf. Infos neu laden!
  };
  document.getElementById('projektStatus').textContent = zeigeFeld(projekt.status);
  const abschliessenBtn = document.getElementById('abschliessenBtn');
  abschliessenBtn.style.display = projekt.status === 'Abgeschlossen' ? 'none' : 'inline-block';
  abschliessenBtn.onclick = async function() {
    await supabase.from('projekte')
      .update({ status: 'Abgeschlossen' })
      .eq('id', id);
    alert("Projekt wurde als abgeschlossen markiert.");
    ladeProjekt();
  };

  // --- HIER Kommt die Status-Logik für Eingabefeld/Send-Button ---
  if (projekt.status === 'Abgeschlossen') {
    document.getElementById('chatInput').disabled = true;
    document.getElementById('sendBtn').disabled = true;
  } else {
    document.getElementById('chatInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
  }
}

// Globale Variable für die aktuelle Chathistorie
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
  setTimeout(() => {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = function() {
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

async function sendeNachricht() {
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = '...';
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) {
    alert('Bitte gib eine Nachricht ein.');
    return;
  sendBtn.disabled = false;
  sendBtn.textContent = 'Senden';
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

  // --- NEU: Status auf „In Bearbeitung“ setzen (wenn noch „Neu angelegt“) ---
  // Projekt laden
  const { data: projekt, error: loadError } = await supabase
    .from('projekte')
    .select('status')
    .eq('id', id)
    .single();
  if (!loadError && projekt && projekt.status === 'Neu angelegt') {
    await supabase.from('projekte')
      .update({ status: 'In Bearbeitung' })
      .eq('id', id);
  }

  await ladeChat();

  // KI-Antwort holen (mit Multi-Turn Verlauf)
  try {
    const kiAntwort = await lvGeneratorRequestWithHistory();
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

  // Drag&Drop für Textdateien
  const chatInput = document.getElementById('chatInput');
  chatInput.addEventListener('dragover', (e) => { e.preventDefault(); chatInput.style.background = '#eef'; });
  chatInput.addEventListener('dragleave', (e) => { chatInput.style.background = ''; });
  chatInput.addEventListener('drop', async (event) => {
    event.preventDefault();
    chatInput.style.background = '';
    const file = event.dataTransfer.files[0];
    if (!file) return;
    handleFile(file);
  });

  // Upload-Button ("+" unter dem Chatfeld)
  document.getElementById('fileUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    // reset input, damit man dieselbe Datei nochmal hochladen kann
    e.target.value = "";
  });
});

async function handleFile(file) {
  const chatInput = document.getElementById('chatInput');
  if (file.type.startsWith('text') || file.type === 'application/json') {
    const text = await file.text();
    chatInput.value = text;
    alert('Dateiinhalt wurde eingefügt. Die Datei wurde NICHT gespeichert!');
  } else if (file.type === 'application/pdf') {
    alert('PDFs können im MVP noch nicht extrahiert werden. Bitte nur reine Textdateien oder kopierten Text einfügen.');
  } else if (file.name.endsWith('.docx')) {
    alert('DOCX-Unterstützung folgt in Kürze. Für den MVP bitte Textdateien verwenden.');
  } else {
    alert('Dateityp nicht unterstützt. Für den Test bitte nur Textdateien, PDF oder DOCX.');
  }
}

// --- KI-API, die den kompletten Verlauf sendet ---
async function lvGeneratorRequestWithHistory() {
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