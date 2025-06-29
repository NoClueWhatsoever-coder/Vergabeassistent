// auth.js

let currentUser = null;
let userCredits = 100;
let tempEmail = '';

function showHomepage() {
  document.getElementById('homepage').style.display = 'block';
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
}

function nextStep(event) {
    event.preventDefault();
    const email = document.getElementById('startEmail').value;

    if (!email) {
        alert('Bitte geben Sie Ihre E-Mail-Adresse ein.');
        return;
    }

    if (!istGueltigeEmail(email)) {
        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
    }

  tempEmail = email;
  document.getElementById('regEmailDisplay').textContent = email;
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'block';
  switchTab('register');
}

function showLogin() {
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'block';
  switchTab('login');
}

function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabs = document.querySelectorAll('.auth-tab');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabs[0].classList.add('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabs[1].classList.add('active');
  }
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Bitte füllen Sie alle Felder aus.');
        return;
    }

    if (!istGueltigeEmail(email)) {
        alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
    }

  currentUser = {
    email: email,
    name: 'Max Mustermann',
    organisation: 'Stadt Köln',
    bundesland: 'nw'
  };

  showDashboard();
}

function register() {
  const organisation = document.getElementById('regOrganisation').value;
  const vorname = document.getElementById('regVorname').value;
  const nachname = document.getElementById('regNachname').value;
  const password = document.getElementById('regPassword').value;
  const bundesland = document.getElementById('regBundesland').value;

  if (!organisation || !vorname || !nachname || !password || !bundesland) {
    alert('Bitte füllen Sie alle Felder aus.');
    return;
  }

  if (password.length < 8) {
    alert('Das Passwort muss mindestens 8 Zeichen lang sein.');
    return;
  }

  currentUser = {
    email: tempEmail,
    name: vorname + ' ' + nachname,
    organisation: organisation,
    bundesland: bundesland
  };

  alert('Registrierung erfolgreich! Sie erhalten 100 kostenlose Credits.');
  showDashboard();
}

function logout() {
  currentUser = null;
  tempEmail = '';
  showHomepage();
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('startEmail').value = '';
}
