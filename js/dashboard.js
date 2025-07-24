// Supabase Setup
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let beschaffungsdaten = [];

async function ladeProjekte() {
  const { data, error } = await supabase
    .from('projekte')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    alert('Fehler beim Laden der Projekte');
    return;
  }
  beschaffungsdaten = data;
  updateBeschaffungstabelle();
}

function updateBeschaffungstabelle() {
  const tbody = document.getElementById('dashboardTableBody');
  tbody.innerHTML = '';
  if(beschaffungsdaten.length === 0) {
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
      <td><a href="projekt.html?id=${projekt.id}" class="projekt-link">Öffnen</a></td>
    `;
    tbody.appendChild(tr);
  });
}

// Modal Logik
const modal = document.getElementById('newProjectModal');
document.getElementById('addProjectBtn').onclick = () => {
  modal.style.display = 'block';
};
document.getElementById('closeModalBtn').onclick = () => {
  modal.style.display = 'none';
};
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};

// Formular absenden
const form = document.getElementById('projectForm');
form.onsubmit = async (e) => {
  e.preventDefault();
  // Werte holen
  const titel = document.getElementById('beschaffungTitel').value.trim();
  const art = document.getElementById('beschaffungArt').value;
  const frist = document.getElementById('beschaffungFrist').value.trim();
  const schaetzwert = document.getElementById('beschaffungSchaetzwert').value.trim();
  const cpv = document.getElementById('beschaffungCPV').value.trim();
  // In Supabase speichern
  const { data, error } = await supabase.from('projekte').insert([{
    titel, art, frist, schaetzwert, cpv,
    status: 'Neu angelegt',
    erstellt_am: new Date().toISOString(),
    aktualisiert_am: new Date().toISOString()
  }]).select().single();
  if(error) {
    alert('Fehler beim Anlegen des Projekts');
    return;
  }
  beschaffungsdaten.unshift(data); // oben einfügen
  updateBeschaffungstabelle();
  modal.style.display = 'none';
};

window.addEventListener('DOMContentLoaded', ladeProjekte);