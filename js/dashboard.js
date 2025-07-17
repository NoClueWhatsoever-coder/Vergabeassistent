// dashboard.js

function showDashboard() {
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  if(window.currentUser && document.getElementById('userEmail'))
    document.getElementById('userEmail').textContent = currentUser.email || '';
}

// Beispiel-Daten für die Tabelle
let beschaffungsdaten = [];

window.neueBeschaffung = function() {
  const titel = prompt('Titel der Beschaffung:');
  if (titel) {
    const art = prompt('Art der Leistung:');
    const status = 'Neu angelegt';
    const erstellt = new Date().toLocaleDateString('de-DE');
    const aktualisiert = erstellt;
    beschaffungsdaten.push({ titel, art, status, erstellt, aktualisiert });
    updateBeschaffungstabelle();
  }
};

function updateBeschaffungstabelle() {
  const tbody = document.getElementById('dashboardTableBody');
  tbody.innerHTML = '';
  if(beschaffungsdaten.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding:2.3em 0;text-align:center;color:#777;font-size:1.1em;">Noch keine Beschaffungsvorhaben angelegt.</td></tr>`;
    return;
  }
  beschaffungsdaten.forEach(eintrag => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${eintrag.titel}</td>
      <td>${eintrag.art}</td>
      <td>${eintrag.status}</td>
      <td>${eintrag.erstellt}</td>
      <td>${eintrag.aktualisiert}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Button EventHandler setzen
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('addProjectBtn');
  if(btn) btn.onclick = neueBeschaffung;
  updateBeschaffungstabelle();
});
