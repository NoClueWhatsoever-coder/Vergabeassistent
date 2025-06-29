// dashboard.js

function showDashboard() {
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userCredits').textContent = userCredits;
}

function logout() {
  currentUser = null;
  tempEmail = '';
  showHomepage();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('startEmail').value = '';
}

function neueBeschaffung() {
  const titel = prompt('Titel der Beschaffung:');
  if (titel) {
    const wert = prompt('Geschätzter Auftragswert (€):');
    if (wert) {
      const liste = document.getElementById('beschaffungenListe');
      const newCard = document.createElement('div');
      newCard.className = 'beschaffung-card';
      newCard.innerHTML = `
        <h4>${titel}</h4>
        <p><strong>Status:</strong> Neu angelegt</p>
        <p><strong>Geschätzter Auftragswert:</strong> ${parseInt(wert).toLocaleString('de-DE')} €</p>
        <p><strong>Erstellt:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
        <div class="beschaffung-actions">
          <button class="action-btn" onclick="useCredits(5, 'Markterkundung für ${titel}')">Markterkundung durchführen</button>
          <button class="action-btn" onclick="useCredits(3, 'Unterlagen für ${titel}')">Unterlagen vorbereiten</button>
          <button class="action-btn" onclick="useCredits(2, 'Vergabe für ${titel}')">Vergabe durchführen</button>
          <button class="action-btn" onclick="openModal('chatModal')">Fragen stellen</button>
          <button class="action-btn" onclick="useCredits(1, 'Rechtliche Hinweise für ${titel}')">Rechtliche Hinweise</button>
        </div>
      `;
      liste.appendChild(newCard);
    }
  }
}
