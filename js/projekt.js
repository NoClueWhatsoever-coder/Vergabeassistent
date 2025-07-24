// projekt.js

// 1. Supabase Setup (ANPASSEN!)
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
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
  // Anzeige
  document.getElementById('projektTitel').textContent = projekt.titel;
  document.getElementById('projektArt').textContent = projekt.art || '-';
  document.getElementById('projektFrist').textContent = projekt.frist || '-';
  document.getElementById('projektSchaetzwert').textContent = projekt.schaetzwert ? projekt.schaetzwert + " €" : '-';
  document.getElementById('projektCPV').textContent = projekt.cpv || '-';
}

// 4. Chathistorie laden & anzeigen
async function ladeChat() {
  const id = getProjektId();
  const { data: nachrichten, error } = await supabase
    .from('chats')
    .select('*')
    .eq('projekt_id', id)
    .order('created_at', { ascending: true });
  const chatBox = document.getElementById('chatMessages');
  chatBox.innerHTML = '';
  if (error || !nachrichten || nachrichten.length === 0) {
    chatBox.innerHTML = `<div class="chat-hint">Noch keine Nachrichten. Beschreibe deinen Bedarf oder lade eine Datei hoch.</div>`;
    return;
  }
  nachrichten.forEach(msg => {
    const div = document.createElement('div');
    div.classList.add('message');
    div.classList.add(msg.sender === 'user' ? 'user' : 'assistant');
    if (msg.datei_url) {
      div.innerHTML = `<b>${msg.sender === 'user' ? 'Du' : 'KI'}:</b> <a href="${msg.datei_url}" target="_blank">${msg.dateiname || 'Datei'}</a><br>${msg.nachricht || ''}`;
    } else {
      div.innerHTML = `<b>${msg.sender === 'user' ? 'Du' : 'KI'}:</b> ${msg.nachricht || ''}`;
    }
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 5. Nachricht senden (als Nutzer)
async function sendeNachricht() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) {
    alert('Bitte gib eine Nachricht ein.');
    return;
  }
  const id = getProjektId();
  // In Supabase speichern
  const { error } = await supabase.from('chats').insert([{
    projekt_id: id,
    sender: 'user',
    nachricht: text
  }]);
  if (error) {
    alert('Fehler beim Speichern der Nachricht.');
    return;
  }
  input.value = '';
  ladeChat();
  // (Optional) → Hier könntest du jetzt die KI via Backend antriggern!
}

// 6. Datei per Drag&Drop ins Eingabefeld einfügen (ohne Speicherung!)
document.addEventListener('DOMContentLoaded', () => {
  // Initialisiere Anzeige
  ladeProjekt();
  ladeChat();

  // Sende-Button Logik
  document.getElementById('sendBtn').onclick = sendeNachricht;

  // Datei-Drop aufs Textfeld
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
