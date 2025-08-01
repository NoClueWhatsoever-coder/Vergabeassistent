// projekt.js

// 1. Supabase Setup 
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM'; // gekürzt
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Globale Variable: Dateien für aktuelle Nachricht
let hochgeladeneDateien = [];
const MAX_FILES = 3;
const MAX_FILESIZE = 10 * 1024 * 1024; // 10 MB



// Snackbar
function showSnackbar(msg, color='#184e8b') {
  let sb = document.getElementById('snackbar');
  if (!sb) {
    sb = document.createElement('div');
    sb.id = 'snackbar';
    document.body.appendChild(sb);
    Object.assign(sb.style, {
      position: 'fixed', top: '16px', left: '50%',
      transform: 'translateX(-50%)', background: color, color: '#fff',
      padding: '0.9em 2.5em', borderRadius: '14px', fontSize: '1.08em',
      fontWeight: '600', zIndex: 9999, boxShadow: '0 4px 24px #003c7b27',
      transition: 'opacity 0.2s', opacity: '0.96', display: 'block'
    });
  } else {
    sb.style.background = color;
    sb.style.display = 'block';
  }
  sb.textContent = msg;
  setTimeout(() => { sb.style.display = 'none'; }, 2100);
}

// Datei-Bubbles wie ChatGPT
function renderFileBubbles() {
  const filesRow = document.getElementById('fileBubbleRow');
  filesRow.innerHTML = '';
  hochgeladeneDateien.forEach((file, idx) => {
    const div = document.createElement('div');
    div.className = 'file-bubble';
    div.innerHTML = `
      <span class="file-icon">${getFileIcon(file.name)}</span>
      <span class="file-name">${file.name}</span>
      <span class="file-type">${getFileTypeLabel(file.name)}</span>
      <button class="file-remove" title="Entfernen" data-idx="${idx}">×</button>
    `;
    filesRow.appendChild(div);
  });
  document.querySelectorAll('.file-remove').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(btn.getAttribute('data-idx'));
      hochgeladeneDateien.splice(idx, 1);
      renderFileBubbles();
    }
  });
}

function getFileIcon(filename) {
  if (/\.pdf$/i.test(filename)) return '📄';
  if (/\.docx$/i.test(filename)) return '📝';
  if (/\.xlsx$/i.test(filename)) return '📊';
  if (/\.csv$/i.test(filename)) return '🗒️';
  if (/\.json$/i.test(filename)) return '🔣';
  if (/\.(xml|x83)$/i.test(filename)) return '🗂️';
  return '📎';
}
function getFileTypeLabel(filename) {
  if (/\.pdf$/i.test(filename)) return 'PDF';
  if (/\.docx$/i.test(filename)) return 'DOCX';
  if (/\.xlsx$/i.test(filename)) return 'Excel';
  if (/\.csv$/i.test(filename)) return 'CSV';
  if (/\.json$/i.test(filename)) return 'JSON';
  if (/\.(xml|x83)$/i.test(filename)) return 'GAEB';
  return '';
}

// Drag & Drop über das ganze Fenster
(function(){
  // Overlay erzeugen (nur einmal)
  let dropOverlay = document.createElement('div');
  dropOverlay.id = 'dropOverlay';
  dropOverlay.innerHTML = `
    <div class="drop-inner">
      <div class="file-icon">📎</div>
      <div style="font-size:1.18em;font-weight:600;margin:0.6em 0 0.2em 0;color:#0077b6;">Datei(en) hierher ziehen</div>
      <div style="font-size:1em;color:#495b7b;">Bis zu 3 Dateien, max. 10 MB pro Datei.</div>
    </div>`;
  dropOverlay.className = '';
  document.body.appendChild(dropOverlay);

  // Events auf das ganze Fenster:
  let dragCounter = 0;
  window.addEventListener('dragenter', e => {
    e.preventDefault();
    dragCounter++;
    dropOverlay.classList.add('show');
  });
  window.addEventListener('dragover', e => {
    e.preventDefault();
    dropOverlay.classList.add('show');
  });
  window.addEventListener('dragleave', e => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dropOverlay.classList.remove('show');
      dragCounter = 0;
    }
  });
  window.addEventListener('drop', e => {
    e.preventDefault();
    dropOverlay.classList.remove('show');
    dragCounter = 0;
    // Check if Files exist
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  });

  // Blockiere auch Drag&Drops auf das Dokument (sonst "Datei öffnen"!)
  ['dragover', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, function(e) {
      e.preventDefault();
    });
  });
})();


function handleUploadFiles(fileList) {
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (hochgeladeneDateien.length >= MAX_FILES) {
      showSnackbar('Maximal 3 Dateien pro Nachricht erlaubt!', '#b53a1b');
      break;
    }
    if (file.size > MAX_FILESIZE) {
      showSnackbar('Datei übersteigt das maximale Volumen von 10 MB!', '#b53a1b');
      continue;
    }
    if (!/\.(pdf|docx|xlsx|csv|json|xml|x83)$/i.test(file.name)) {
      showSnackbar('Nicht unterstütztes Dateiformat!', '#b53a1b');
      continue;
    }
    hochgeladeneDateien.push(file);
    showSnackbar('Datei hinzugefügt!', '#207c37');
  }
  renderFileBubbles();
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  ladeProjekt();
  ladeChat();
  ladeFormularfelder(); // <-- NEU: Formular-Felder laden

  // Datei-Bubble Row, falls noch nicht vorhanden
  if (!document.getElementById('fileBubbleRow')) {
    const filesRow = document.createElement('div');
    filesRow.id = 'fileBubbleRow';
    filesRow.style.display = 'flex';
    filesRow.style.flexWrap = 'wrap';
    filesRow.style.gap = '1em';
    filesRow.style.margin = '1em 0 0.4em 0';
    document.querySelector('.chat-container').insertBefore(filesRow, document.querySelector('.chat-input-area'));
  }
  // Datei-Upload (Button)
  document.getElementById('fileUpload').addEventListener('change', function(e) {
    handleUploadFiles(e.target.files);
    e.target.value = '';
  });

  // Senden
  document.getElementById('sendBtn').onclick = sendeNachricht;
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); sendeNachricht();
    }
  });

  // Speichern der Formularfelder (NEU)
  document.getElementById('saveFormularFieldsBtn').onclick = async function() {
    const id = getProjektId();
    const baumaßnahme = document.getElementById('baumaßnahmeInput').value.trim();
    const maßnahme_nr = document.getElementById('maßnahmeNrInput').value.trim();
    const vergabe_nr = document.getElementById('vergabeNrInput').value.trim();
    const { error } = await supabase.from('projekte').update({
      baumaßnahme, maßnahme_nr, vergabe_nr
    }).eq('id', id);
    const stat = document.getElementById('formularSaveStatus');
    if (!error) {
      stat.textContent = "Gespeichert!";
      setTimeout(() => stat.textContent = "", 1600);
    } else {
      stat.textContent = "Fehler beim Speichern!";
    }
  };

  // Hilfsfunktion zum Ermitteln der Projekt-ID aus der URL
  function getProjektId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // Buttons abfragen
  const btnLV = document.getElementById('btnVergabeUnterlagen');
  const btnMarkt = document.getElementById('btnMarkterkundung');
  const btnRecht = document.getElementById('btnRechtsfragen');

  // Prüfen, ob die Buttons existieren (Seite könnte auch ohne sie geladen werden)
  if (btnLV) {
    btnLV.onclick = function() {
      const pid = getProjektId();
      // Leitet weiter und gibt die Projekt-ID mit – so können alle Unterlagen projektbezogen geladen werden
      window.location.href = `vergabeunterlagen.html?id=${encodeURIComponent(pid)}`;
    };
  }
  if (btnMarkt) {
    btnMarkt.onclick = function() {
      alert("Die Markterkundung wird in einer späteren Version verfügbar sein.");
    };
  }
  if (btnRecht) {
    btnRecht.onclick = function() {
      alert("Der Rechtsfragen-Chat wird bald freigeschaltet.");
      // Optional: window.location.href = "rechtschat.html?id=...";
    };
  }
});

// NEU: Formularfelder laden
async function ladeFormularfelder() {
  const id = getProjektId();
  const { data: projekt, error } = await supabase
    .from('projekte')
    .select('baumaßnahme, maßnahme_nr, vergabe_nr')
    .eq('id', id)
    .single();
  if (!error && projekt) {
    document.getElementById('baumaßnahmeInput').value = projekt.baumaßnahme || '';
    document.getElementById('maßnahmeNrInput').value = projekt.maßnahme_nr || '';
    document.getElementById('vergabeNrInput').value = projekt.vergabe_nr || '';
  }
}

// Senden mit Datei-Parsing im Hintergrund
// Senden mit Datei-Parsing im Hintergrund
async function sendeNachricht() {
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true; sendBtn.textContent = '...';
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text && hochgeladeneDateien.length === 0) {
    showSnackbar('Bitte gib eine Nachricht oder eine Datei ein!', '#b53a1b');
    sendBtn.disabled = false; sendBtn.textContent = 'Senden';
    return;
  }
  const id = getProjektId();

  // Lies alle Dateien asynchron aus (Promise.all)
  const fileContents = await Promise.all(
    hochgeladeneDateien.map(async (file) => {
      if (file.type === 'application/pdf') {
        if (!window.pdfjsLib) {
          await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
        const ab = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          text += strings.join(' ') + '\n';
        }
        return {name: file.name, text: text.trim()};
      }
      if (file.name.endsWith('.docx')) {
        if (!window.mammoth) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.0/mammoth.browser.min.js');
        }
        const ab = await file.arrayBuffer();
        const resultObject = await window.mammoth.convertToHtml({ arrayBuffer: ab });
        const parser = new DOMParser();
        const doc = parser.parseFromString(resultObject.value, "text/html");
        return {name: file.name, text: doc.body.textContent.trim()};
      }
      if (file.name.endsWith('.xml') || file.name.endsWith('.x83')) {
        const text = await file.text();
        return {name: file.name, text: text};
      }
      if (file.type.startsWith('text') || file.type === 'application/json') {
        const text = await file.text();
        return {name: file.name, text: text};
      }
      // Excel, CSV etc: nur Hinweistext
      return {name: file.name, text: '[Datei nicht automatisch extrahiert]'};
    })
  ); 

  const projektMeta = `
Titel: ${document.getElementById('projektTitel').textContent}
Art: ${document.getElementById('projektArt').textContent}
Frist: ${document.getElementById('projektFrist').textContent}
Schätzwert: ${document.getElementById('projektSchaetzwert').textContent}
CPV: ${document.getElementById('projektCPV').textContent}
Baumaßnahme: ${document.getElementById('baumaßnahmeInput').value}
Maßnahmenummer: ${document.getElementById('maßnahmeNrInput').value}
Vergabenummer: ${document.getElementById('vergabeNrInput').value}
`;

  // Nachricht zuerst in Supabase speichern
  // Vor dem Insert: User ermitteln (async!)
const { data: userObj } = await supabase.auth.getUser();

let { error } = await supabase
  .from('chats')
  .insert([{
    projekt_id: id,
    sender: 'user',
    nachricht: text,
    user_id: userObj?.user?.id 
  }]);
if (error) {
  showSnackbar('Fehler beim Speichern der Nachricht (Offline-Modus).', '#b53a1b');
}

  input.value = '';
  hochgeladeneDateien = [];
  renderFileBubbles();

  // Versuche, den Projektstatus zu aktualisieren. Bei Fehlern ignorieren wir diese.
  try {
    const { data: projektStatus, error: statusError } = await supabase
      .from('projekte')
      .select('status')
      .eq('id', id)
      .single();
    if (!statusError && projektStatus && projektStatus.status === 'Neu angelegt') {
      await supabase.from('projekte').update({ status: 'In Bearbeitung' }).eq('id', id);
    }
  } catch (_) {
    // Fehler beim Laden oder Aktualisieren ignorieren
  }

  await ladeChat();

  // KI-Anfrage stellen und Antwort in Supabase speichern
  try {
    const antwort = await requestKIResponse({
      prompt: text,
      chatHistory: chathistory,
      metaFields: projektMeta,
      files: fileContents
    });
    // Antwort im Chat speichern
    await supabase.from('chats').insert([{
      projekt_id: id,
      sender: 'assistant',         // <-- das ist wichtig!
      nachricht: antwort,          // <-- das ist die KI-Antwort
      user_id: userObj?.user?.id   // du kannst auch user_id mitgeben, wenn deine Policy das verlangt
    }]);
    await ladeChat();
  } catch (err) {
    showSnackbar('Fehler bei der KI-Antwort: ' + err.message, '#b53a1b');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Senden';
  }
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

// ===== REST Chat, Status, Projektdetails (wie gehabt) =====

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
  document.getElementById('projektTitel').textContent = zeigeFeld(projekt.titel);
  document.getElementById('projektArt').textContent = zeigeFeld(projekt.art);
  document.getElementById('projektFrist').textContent = zeigeFeld(projekt.frist);
  document.getElementById('projektSchaetzwert').textContent =
    projekt.schaetzwert !== null && projekt.schaetzwert !== undefined && projekt.schaetzwert !== ""
      ? projekt.schaetzwert + " €"
      : "-";
  document.getElementById('projektCPV').textContent = zeigeFeld(projekt.cpv);
  document.getElementById('projektStatus').textContent = zeigeFeld(projekt.status);


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

// KI-Request wie gehabt
async function requestKIResponse({ prompt, chatHistory, metaFields, files }) {
  const res = await fetch("/api/openrouter-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      chatHistory,
      metaFields,
      files
    })
  });
  const data = await res.json();
  if (data.result) {
    return data.result;
  } else {
    throw new Error(data.error || "Unbekannter Fehler bei der KI-Antwort");
  }
}


console.log("Supabase Insert Error:", error);