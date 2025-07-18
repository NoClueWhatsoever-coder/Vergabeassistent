// auth.js

const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
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
  const password = Math.random().toString(36).slice(-10) + "!A1";
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/?registered=1" }
    });
    if (error) { alert("Fehler bei der Registrierung: " + error.message); return; }
    alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
    document.getElementById('heroRegEmail').value = '';
    showLogin('register', email);
  } catch (err) {
    alert("Fehler bei der Registrierung: " + err.message);
  }
};

// Registrierung im Dialog
async function register() {
  const anrede = document.getElementById('regAnrede')?.value;
  const vorname = document.getElementById('regVorname')?.value;
  const nachname = document.getElementById('regNachname')?.value;
  const organisation = document.getElementById('regOrganisation')?.value;
  const email = document.getElementById('regEmail')?.value;
  const password = document.getElementById('regPassword')?.value;
  const bundesland = document.getElementById('regBundesland')?.value;
  if (!anrede || !vorname || !nachname || !organisation || !email || !password || !bundesland) {
    alert("Bitte alle Felder ausfüllen."); return;
  }
  if (password.length < 8) { alert("Das Passwort muss mindestens 8 Zeichen lang sein."); return; }
  if (!istGueltigeEmail(email)) { alert("Bitte geben Sie eine gültige E-Mail-Adresse ein."); return; }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { anrede, vorname, nachname, organisation, bundesland },
      emailRedirectTo: window.location.origin + "/?registered=1"
    }
  });
  if (error) { alert("Fehler bei der Registrierung: " + error.message); return; }
  alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
  showHomepage();
}

// LOGIN
async function login() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;
  if (!email || !password) { alert("Bitte geben Sie E-Mail und Passwort ein."); return; }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { alert("Login fehlgeschlagen: " + error.message); return; }
  // Daten holen
  const user = data.user;
  let profile = null;
  let pError = null;
  try {
    const { data: pData, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    profile = pData;
    pError = profileErr;
  } catch (err) { pError = err; }
  if (pError || !profile) {
    alert("Profil konnte nicht geladen werden. Bitte wenden Sie sich an den Support."); return;
  }
  window.currentUser = {
    email: user.email,
    name: `${profile.anrede || ''} ${profile.vorname || ''} ${profile.nachname || ''}`.trim(),
    organisation: profile.organisation,
    bundesland: profile.bundesland
  };
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
  const email = prompt("Bitte geben Sie Ihre E-Mail-Adresse an. Sie erhalten dann einen Link zum Zurücksetzen Ihres Passworts.");
  if (!email || !istGueltigeEmail(email)) {
    alert("Bitte geben Sie eine gültige E-Mail-Adresse ein."); return;
  }
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?reset=1'
  }).then(({ error }) => {
    if (error) {
      alert("Fehler beim Senden der E-Mail: " + error.message);
    } else {
      alert("Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.");
    }
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

// Für HTML-Events global sichtbar machen
window.register = register;
window.login = login;
window.logout = logout;
window.showHomepage = showHomepage;
window.showLogin = showLogin;
window.switchTab = switchTab;
