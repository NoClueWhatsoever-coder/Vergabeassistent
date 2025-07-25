// Supabase Setup
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let beschaffungsdaten = [];

// Projekte laden - nur für eingeloggten User!
async function ladeProjekte() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    alert("Sie sind nicht eingeloggt. Bitte melden Sie sich an.");
    beschaffungsdaten = [];
    updateBeschaffungstabelle();
    return;
  }
  const { data, error } = await supabase
    .from('projekte')
    .select('*')
    .eq('user_id', user.id)
    .order('erstellt_am', { ascending: false });
  if (error) {
    alert('Fehler beim Laden der Projekte: ' + error.message);
    beschaffungsdaten = [];
    updateBeschaffungstabelle();
    return;
  }
  beschaffungsdaten = data;
  updateBeschaffungstabelle();
}

// Tabelle updaten
function updateBeschaffungstabelle() {
  const tbody = document.getElementById('dashboardTableBody');
  tbody.innerHTML = '';
  if (beschaffungsdaten.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding:2.3em 0;text-align:center;color:#777;font-size:1.1em;">Noch keine Beschaffungsvorhaben angelegt.</td></tr>`;
    return;
  }
  beschaffungsdaten.forEach(projekt => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${projekt.titel}</td>
      <td>${projekt.art}</td>
      <td>${projekt.status || '-'}</td>
      <td>${projekt.erstellt_am ? new Date(projekt.erstellt_am).toLocaleDateString('de-DE') : '-'}</td>
      <td>${projekt.aktualisiert_am ? new Date(projekt.aktualisiert_am).toLocaleDateString('de-DE') : '-'}</td>
      <td style="display:flex;gap:0.8em;align-items:center;">
        <a href="projekt.html?id=${projekt.id}" class="projekt-link" style="font-weight:600;">Öffnen</a>
        <button class="delete-btn" title="Beschaffungsvorhaben löschen" style="background:none;border:none;cursor:pointer;padding:0;margin:0;">
          <span class="material-icons" style="font-size:1.5em;color:#d32f2f;">delete</span>
        </button>
      </td>
    `;
    // Lösch-Button Event
    const deleteBtn = tr.querySelector('.delete-btn');
    deleteBtn.onclick = async function () {
      if (confirm("Sind Sie sich sicher, dass Sie dieses Beschaffungsvorhaben und den bisherigen Verlauf sowie die bereitgestellten Dokumente vollständig löschen möchten?")) {
        // Zuerst alle Chats zu diesem Projekt löschen:
        await supabase.from('chats').delete().eq('projekt_id', projekt.id);
        // Dann das Projekt selbst löschen:
        const { error } = await supabase.from('projekte').delete().eq('id', projekt.id);
        if (!error) {
          // Aus dem Array entfernen und Tabelle neu rendern
          beschaffungsdaten = beschaffungsdaten.filter(p => p.id !== projekt.id);
          updateBeschaffungstabelle();
        } else {
          alert("Löschen fehlgeschlagen: " + error.message);
        }
      }
    };
    tbody.appendChild(tr);
  });
}
    

// Modal Logik
const modal = document.getElementById('newProjectModal');
document.getElementById('addProjectBtn').onclick = () => {
  modal.style.display = 'block';
  document.getElementById('projectForm').reset();
};
document.getElementById('closeModalBtn').onclick = () => {
  modal.style.display = 'none';
};
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};

// Formular absenden (mit user_id)
const form = document.getElementById('projectForm');
form.onsubmit = async (e) => {
  e.preventDefault();
  // Werte holen
  const titel = document.getElementById('beschaffungTitel').value.trim();
  const art = document.getElementById('beschaffungArt').value;
  const frist = document.getElementById('beschaffungFrist').value.trim();
  const schaetzwert = document.getElementById('beschaffungSchaetzwert').value.trim();
  const cpv = document.getElementById('beschaffungCPV').value.trim();

  // User holen
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    alert("Sie sind nicht eingeloggt. Bitte melden Sie sich an.");
    return;
  }

  // Projekt speichern (Timestamp-Felder werden automatisch von Supabase gesetzt)
  const { data, error } = await supabase.from('projekte').insert([{
    titel,
    art,
    frist: frist || null,
    schaetzwert: schaetzwert !== "" ? parseFloat(schaetzwert) : null,
    cpv: cpv || null,
    status: 'Neu angelegt',
    user_id: user.id
  }]).select().single();
  if(error) {
    alert('Fehler beim Anlegen des Projekts: ' + error.message);
    return;
  }
  beschaffungsdaten.unshift(data); // oben einfügen
  updateBeschaffungstabelle();
  modal.style.display = 'none';
  form.reset();
};

window.addEventListener('DOMContentLoaded', ladeProjekte);
