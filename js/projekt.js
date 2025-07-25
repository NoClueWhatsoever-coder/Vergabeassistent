// projekt.js

// 1. Supabase Setup 
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM'; // gekürzt
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Hole Projekt-ID aus URL
function getProjektId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}
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
  // Setze die Projektinfos im UI (100% korrekt, keine Fallbacks mehr nötig)
  document.getElementById('projektTitel').textContent = zeigeFeld(projekt.titel);
  document.getElementById('projektArt').textContent = zeigeFeld(projekt.art);
  document.getElementById('projektFrist').textContent = zeigeFeld(projekt.frist);
  document.getElementById('projektSchaetzwert').textContent = 
      projekt.schaetzwert !== null && projekt.schaetzwert !== undefined && projekt.schaetzwert !== ""
        ? projekt.schaetzwert + " €"
        : "-";
  document.getElementById('projektCPV').textContent = zeigeFeld(projekt.cpv);
  document.getElementById('projektStatus').textContent = zeigeFeld(projekt.status);

  // Abschließen-Button zentriert und nur sichtbar, wenn nicht abgeschlossen
  const abschliessenBtn = document.getElementById('abschliessenBtn');
  abschliessenBtn.style.display = projekt.status === 'Abgeschlossen' ? 'none' : 'inline-block';
  abschliessenBtn.onclick = async function() {
    await supabase.from('projekte')
      .update({ status: 'Abgeschlossen' })
      .eq('id', id);
    alert("Projekt wurde als abgeschlossen markiert.");
    ladeProjekt();
  };

  // Chat-Eingabe und Senden-Button sperren, wenn abgeschlossen
  document.getElementById('chatInput').disabled = projekt.status === 'Abgeschlossen';
  document.getElementById('sendBtn').disabled = projekt.status === 'Abgeschlossen';
}

// Chathistorie global
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

// Senden-Button + KI-Antwort
async function sendeNachricht() {
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = '...';
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) {
    alert('Bitte gib eine Nachricht ein.');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Senden';
    return;
  }
  const id = getProjektId();

  let { error } = await supabase.from('chats').insert([{
    projekt_id: id,
    sender: 'user',
    nachricht: text
  }]);
  if (error) {
    alert('Fehler beim Speichern der Nachricht.');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Senden';
    return;
  }
  input.value = '';

  // Status setzen auf "In Bearbeitung"
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
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Senden';
  }
}

// Datei-Upload/Parsing
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

  // Drag&Drop für Textdateien, PDFs, DOCX, GAEB
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

  // Upload-Button ("Datei auswählen")
  document.getElementById('fileUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = "";
  });
});

async function handleFile(file) {
  const chatInput = document.getElementById('chatInput');
  // TEXT & JSON
  if (file.type.startsWith('text') || file.type === 'application/json') {
    const text = await file.text();
    chatInput.value = text;
    alert('Dateiinhalt wurde eingefügt. Die Datei wurde NICHT gespeichert!');
    return;
  }
  // PDF (nutzt pdf.js via CDN)
  if (file.type === 'application/pdf') {
    if (!window.pdfjsLib) {
      alert('PDF.js wird geladen...');
      await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
      const typedarray = new Uint8Array(e.target.result);
      const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise;
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        allText += strings.join(' ') + '\n';
      }
      chatInput.value = allText.trim();
      alert('PDF-Text eingefügt! Die Datei wurde NICHT gespeichert!');
    };
    reader.readAsArrayBuffer(file);
    return;
  }
  // DOCX (nutzt mammoth.js via CDN)
  if (file.name.endsWith('.docx')) {
    if (!window.mammoth) {
      alert('Lade DOCX-Parser...');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.0/mammoth.browser.min.js');
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
      window.mammoth.convertToHtml({ arrayBuffer: e.target.result })
        .then(function(resultObject) {
          // Entferne alle Tags für reinen Text
          const parser = new DOMParser();
          const doc = parser.parseFromString(resultObject.value, "text/html");
          chatInput.value = doc.body.textContent.trim();
          alert('DOCX-Text eingefügt! Die Datei wurde NICHT gespeichert!');
        });
    };
    reader.readAsArrayBuffer(file);
    return;
  }
  // GAEB (einfach als Text, später echte GAEB-Parsing-Logik)
  if (file.name.toLowerCase().endsWith('.xml') || file.name.toLowerCase().endsWith('.x83')) {
    const text = await file.text();
    chatInput.value = text;
    alert('GAEB-XML eingefügt! Die Datei wurde NICHT gespeichert!');
    return;
  }
  alert('Dateityp nicht unterstützt. Für den Test bitte Text, PDF, DOCX oder GAEB.');
}

// Helper zum Nachladen von JS-Libs
function loadScript(src) {
  return new Promise(function(resolve, reject) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// KI-Request wie gehabt
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