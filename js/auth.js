// auth.js

// Supabase initialisieren (direkt hier, keine Imports)
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Hilfsfunktion für E-Mail-Prüfung
function istGueltigeEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// Registrierung direkt von der Startseite/aus dem Hero-Bereich
window.registerFromHero = async function() {
  const email = document.getElementById('heroRegEmail')?.value?.trim();
  if (!email) {
    alert("Bitte geben Sie Ihre dienstliche E-Mail-Adresse ein.");
    return;
  }
  if (!istGueltigeEmail(email)) {
    alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
    return;
  }
  // Random sicheres Passwort generieren:
  const password = Math.random().toString(36).slice(-10) + "!A1";
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/?registered=1" }
    });
    if (error) {
      alert("Fehler bei der Registrierung: " + error.message);
      return;
    }
    alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
    document.getElementById('heroRegEmail').value = '';
    showLogin('register', email);  // Login/Registrierungsdialog öffnen und E-Mail übernehmen
  } catch (err) {
    alert("Fehler bei der Registrierung: " + err.message);
  }
};

// REGISTRIERUNG (im Dialog)
async function register() {
  const anrede = document.getElementById('regAnrede')?.value;
  const vorname = document.getElementById('regVorname')?.value;
  const nachname = document.getElementById('regNachname')?.value;
  const organisation = document.getElementById('regOrganisation')?.value;
  const email = document.getElementById('regEmail')?.value;
  const password = document.getElementById('regPassword')?.value;
  const bundesland = document.getElementById('regBundesland')?.value;

  if (!anrede || !vorname || !nachname || !organisation || !email || !password || !bundesland) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }
  if (password.length < 8) {
    alert("Das Passwort muss mindestens 8 Zeichen lang sein.");
    return;
  }
  if (!istGueltigeEmail(email)) {
    alert("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
    return;
  }

  // Supabase Signup (Double Opt-In mit Weiterleitung nach Registrierung)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { anrede, vorname, nachname, organisation, bundesland },
      emailRedirectTo: window.location.origin + "/?registered=1"
    }
  });

  if (error) {
    alert("Fehler bei der Registrierung: " + error.message);
    return;
  }

  alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
  showHomepage();
}

// LOGIN
async function login() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    alert("Bitte geben Sie E-Mail und Passwort ein.");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    return;
  }
  // Daten holen
  const user = data.user;

  // Optional: Profil laden
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
  } catch (err) {
    pError = err;
  }

  if (pError || !profile) {
    alert("Profil konnte nicht geladen werden. Bitte wenden Sie sich an den Support.");
    return;
  }

  // User ins globales State
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

  // E-Mail ggf. vorbefüllen
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

// Optional: Weiterleitung abfangen
function handleRegisteredRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('registered')) {
    // Zeige Willkommensdialog oder leite ins Dashboard weiter
    alert("Registrierung erfolgreich! Sie können sich jetzt anmelden und alle Funktionen nutzen.");
    showLogin('login');
    // Optional: Entferne den Parameter aus der URL
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
