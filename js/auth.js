// auth.js

const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Hilfsfunktion für E-Mail-Prüfung
function istGueltigeEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// Registrierung von der Startseite
window.registerFromHero = async function() {
  const email = document.getElementById('heroRegEmail')?.value?.trim();
  if (!email) { alert("Bitte geben Sie Ihre dienstliche E-Mail-Adresse ein."); return; }
  if (!istGueltigeEmail(email)) { alert("Bitte geben Sie eine gültige E-Mail-Adresse ein."); return; }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      options: { emailRedirectTo: window.location.origin + "/?setpw=1" }
    });
    if (error) { alert("Fehler bei der Registrierung: " + error.message); return; }
    alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
    document.getElementById('heroRegEmail').value = '';
    showLogin('login', email); // Login anzeigen, Email vorbelegen
  } catch (err) {
    alert("Fehler bei der Registrierung: " + err.message);
  }
};

function showSuccessOverlay(msg) {
  document.getElementById('successMsg').textContent = msg;
  document.getElementById('successOverlay').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('successOverlay').style.display = 'none';
    showHomepage();
  }, 3600);
}

// Registrierung im Dialog
async function register() {
  const fields = [
    { id: 'regAnrede', label: 'Anrede' },
    { id: 'regVorname', label: 'Vorname' },
    { id: 'regNachname', label: 'Nachname' },
    { id: 'regOrganisation', label: 'Organisation' },
    { id: 'regBundesland', label: 'Bundesland' },
    { id: 'regEmail', label: 'E-Mail' },
    { id: 'regPassword', label: 'Passwort' }
  ];
  let valid = true;
  // Inline Fehler zurücksetzen
  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const errorDiv = document.getElementById('error-' + f.id.replace('reg','').toLowerCase());
    input.classList.remove('error');
    if (errorDiv) errorDiv.textContent = '';
    if (!input.value.trim()) {
      input.classList.add('error');
      if (errorDiv) errorDiv.textContent = f.label + ' fehlt.';
      valid = false;
    }
  });
  // Passwort-Validierung nach Supabase-Policy
  const password = document.getElementById('regPassword').value;
  const pwError = document.getElementById('error-password');
  const pwPolicy = {
    minLength: 10,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/,
  };
  if (password && password.length < pwPolicy.minLength) {
    document.getElementById('regPassword').classList.add('error');
    pwError.textContent = 'Das Passwort muss mindestens 10 Zeichen lang sein.';
    valid = false;
  } else if (password && !pwPolicy.pattern.test(password)) {
    document.getElementById('regPassword').classList.add('error');
    let fehlermeldung = 'Fehlt: ';
    if (!/[a-z]/.test(password)) fehlermeldung += 'Kleinbuchstabe, ';
    if (!/[A-Z]/.test(password)) fehlermeldung += 'Großbuchstabe, ';
    if (!/\d/.test(password)) fehlermeldung += 'Zahl, ';
    if (!/[^a-zA-Z0-9]/.test(password)) fehlermeldung += 'Sonderzeichen, ';
    pwError.textContent = fehlermeldung.replace(/, $/, '');
    valid = false;
  } else {
    document.getElementById('regPassword').classList.remove('error');
    pwError.textContent = '';
  }
  // E-Mail checken
  const email = document.getElementById('regEmail').value;
  const emailError = document.getElementById('error-email');
  if (email && !istGueltigeEmail(email)) {
    document.getElementById('regEmail').classList.add('error');
    emailError.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    valid = false;
  } else if (emailError && !emailError.textContent) {
    document.getElementById('regEmail').classList.remove('error');
    emailError.textContent = '';
  }
  if (!valid) return;
  // Daten sammeln
  const anrede = document.getElementById('regAnrede').value;
  const vorname = document.getElementById('regVorname').value;
  const nachname = document.getElementById('regNachname').value;
  const organisation = document.getElementById('regOrganisation').value;
  const bundesland = document.getElementById('regBundesland').value;
  // Supabase Registration
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { anrede, vorname, nachname, organisation, bundesland },
      emailRedirectTo: window.location.origin + '/?registered=1'
    }
  });
  if (error) {
    document.getElementById('error-email').textContent = error.message.includes('already registered') ? 
      'E-Mail ist bereits registriert.' : ('Fehler: ' + error.message);
    return;
  }
  // UX: Zeige Fortschrittsanzeige (s.u.)
  showSuccessOverlay('Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!');
  document.getElementById('registerForm').reset();
}


// LOGIN
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  let valid = true;
  document.getElementById('login-error-email').textContent = '';
  document.getElementById('login-error-password').textContent = '';
  document.getElementById('login-global-error').textContent = '';
  document.getElementById('loginEmail').classList.remove('error');
  document.getElementById('loginPassword').classList.remove('error');
  if (!email) {
    document.getElementById('login-error-email').textContent = 'E-Mail fehlt.';
    document.getElementById('loginEmail').classList.add('error');
    valid = false;
  } else if (!istGueltigeEmail(email)) {
    document.getElementById('login-error-email').textContent = 'Bitte gültige E-Mail.';
    document.getElementById('loginEmail').classList.add('error');
    valid = false;
  }
  if (!password) {
    document.getElementById('login-error-password').textContent = 'Passwort fehlt.';
    document.getElementById('loginPassword').classList.add('error');
    valid = false;
  }
  if (!valid) return;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    let message = 'Login fehlgeschlagen. ';
    if (error.message.includes('Invalid login credentials')) message = 'E-Mail oder Passwort falsch.';
    else if (error.message.includes('not confirmed')) message = 'Bitte E-Mail erst bestätigen.';
    else message += error.message;
    document.getElementById('login-global-error').textContent = message;
    document.getElementById('loginPassword').classList.add('error');
    return;
  }
  // Optional: Lade User-Profile, wie bei dir!
  const user = data.user;
  // ...
  showDashboard();
}


// LOGOUT
async function logout() {
  await supabase.auth.signOut();
  window.currentUser = null;
  showHomepage();
  localStorage.removeItem("guestChatCount");
  localStorage.removeItem("guestChatDate");
}

function updateLoginTopBtn() {
  const btn = document.getElementById('loginTopBtn');
  btn.style.display = window.currentUser ? 'none' : 'inline-block';
}
window.updateLoginTopBtn = updateLoginTopBtn;

window.showForgotPassword = function() {
  const email = document.getElementById('loginEmail').value;
  if (!email || !istGueltigeEmail(email)) {
    document.getElementById('login-error-email').textContent = 'Bitte geben Sie Ihre E-Mail-Adresse für den Reset ein.';
    document.getElementById('loginEmail').classList.add('error');
    return;
  }
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?reset=1'
  }).then(({ error }) => {
    document.getElementById('login-global-error').textContent = error ? ('Fehler: '+error.message) : 'E-Mail zum Zurücksetzen wurde gesendet!';
  });
};


// NAVIGATION
function showHomepage() {
  document.getElementById('homepage').style.display = 'block';
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
}

function showLogin(tab = "login", email = "") {
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'block';
  switchTab(tab);
  if (tab === "register" && email) {
    document.getElementById("regEmail").value = email;
  }
  if (tab === "login" && email) {
    document.getElementById("loginEmail").value = email;
  }
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

// Weiterleitung abfangen: Registrierung oder Passwort-Reset
function handleRegisteredRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('setpw')) {
    // Passwort-Setzen-Formular anzeigen
    document.getElementById('setPasswordContainer').style.display = 'block';
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    window.scrollTo(0, 180);
    return;
  }
  if (urlParams.has('registered')) {
    showLogin('login');
    alert("Registrierung erfolgreich! Bitte loggen Sie sich jetzt ein.");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (urlParams.has('reset')) {
    alert("Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit dem neuen Passwort einloggen.");
    showLogin('login');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
document.addEventListener('DOMContentLoaded', handleRegisteredRedirect);


window.setNewPassword = async function() {
  const pw = document.getElementById('newPassword').value;
  if (!pw || pw.length < 8) {
    alert('Bitte ein sicheres Passwort (mind. 8 Zeichen) eingeben!');
    return;
  }
  const { data, error } = await supabase.auth.updateUser({ password: pw });
  if (error) {
    alert('Fehler beim Setzen des Passworts: ' + error.message);
    return;
  }
  alert('Passwort erfolgreich gesetzt! Sie sind jetzt eingeloggt.');
  // Hier kann jetzt das Dashboard gezeigt werden (oder reload):
  showDashboard();
  window.history.replaceState({}, document.title, window.location.pathname);
};

window.gotoRegistration = function() {
  const email = document.getElementById('heroRegEmail')?.value?.trim();
  if (!email) { alert("Bitte geben Sie Ihre dienstliche E-Mail-Adresse ein."); return; }
  if (!istGueltigeEmail(email)) { alert("Bitte geben Sie eine gültige E-Mail-Adresse ein."); return; }
  // Zeige das Registrierungsformular & übergebe E-Mail
  showLogin('register', email);
  setTimeout(() => {
    const regEmailField = document.getElementById('regEmail');
    if (regEmailField) regEmailField.value = email;
    const regPwField = document.getElementById('regPassword');
    if (regPwField) regPwField.value = '';
    regEmailField?.focus();
  }, 100);
  // Optional: zur Registrierungsmaske scrollen
  setTimeout(() => {
    document.getElementById('authContainer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 120);
};


// Für HTML-Events global sichtbar machen
window.register = register;
window.login = login;
window.logout = logout;
window.showHomepage = showHomepage;
window.showLogin = showLogin;
window.switchTab = switchTab;
