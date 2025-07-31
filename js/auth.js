// auth.js

const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqa3V2dXl3YndudnNncGJxbHdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDU3MjMsImV4cCI6MjA2Njg4MTcyM30.BeMfBKtYECSy8Sx_yH6Qh1Pwgd7KhNIA3jiBliE2DMM';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// --- Hilfsfunktionen
function istGueltigeEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// UX: Erfolgs-Overlay
function showSuccessOverlay(msg, cb) {
  document.getElementById('successMsg').textContent = msg;
  document.getElementById('successOverlay').style.display = 'flex';
  setTimeout(() => {
    document.getElementById('successOverlay').style.display = 'none';
    if (typeof cb === "function") cb();
    else showHomepage();
  }, 3200);
}

// --- Registrierung (Schnellregistrierung: Modal öffnen & E-Mail vorfüllen)
window.gotoRegistration = function() {
  const email = document.getElementById('heroRegEmail')?.value?.trim();
  if (!email) { showFieldError('heroRegEmail', "Bitte geben Sie Ihre dienstliche E-Mail-Adresse ein."); return; }
  if (!istGueltigeEmail(email)) { showFieldError('heroRegEmail', "Bitte geben Sie eine gültige E-Mail-Adresse ein."); return; }
  openAuthModal('register');
  setTimeout(() => {
    const regEmailField = document.getElementById('regEmail');
    if (regEmailField) regEmailField.value = email;
    regEmailField?.focus();
  }, 100);
}

// --- Registrierung MODAL
async function register() {
  // Felder holen
  const anrede = document.getElementById('regAnrede').value;
  const vorname = document.getElementById('regVorname').value;
  const nachname = document.getElementById('regNachname').value;
  const organisation = document.getElementById('regOrganisation').value;
  const bundesland = document.getElementById('regBundesland').value || null;
  const telefon = document.getElementById('regTelefon').value || null;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  // Validierung
  let valid = true;
  valid &= showFieldError('regAnrede', anrede ? "" : "Bitte wählen Sie eine Anrede.");
  valid &= showFieldError('regVorname', vorname ? "" : "Vorname fehlt.");
  valid &= showFieldError('regNachname', nachname ? "" : "Nachname fehlt.");
  valid &= showFieldError('regOrganisation', organisation ? "" : "Organisation/Behörde fehlt.");
  valid &= showFieldError('regEmail', email ? "" : "E-Mail fehlt.");
  if (email && !istGueltigeEmail(email)) { valid = false; showFieldError('regEmail', "Bitte geben Sie eine gültige E-Mail-Adresse ein."); }
  // Passwortpolicy
  const pwPolicy = { minLength: 10, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/ };
  if (!password) { valid = false; showFieldError('regPassword', "Passwort fehlt."); }
  else if (password.length < pwPolicy.minLength) { valid = false; showFieldError('regPassword', "Das Passwort muss mindestens 10 Zeichen lang sein."); }
  else if (!pwPolicy.pattern.test(password)) {
    valid = false;
    let fehlermeldung = "Fehlt: ";
    if (!/[a-z]/.test(password)) fehlermeldung += "Kleinbuchstabe, ";
    if (!/[A-Z]/.test(password)) fehlermeldung += "Großbuchstabe, ";
    if (!/\d/.test(password)) fehlermeldung += "Zahl, ";
    if (!/[^a-zA-Z0-9]/.test(password)) fehlermeldung += "Sonderzeichen, ";
    showFieldError('regPassword', fehlermeldung.replace(/, $/, ''));
  } else { showFieldError('regPassword', ""); }
  if (!valid) return;

  // Nutzungsbedingungen/Datenschutz/AVV-Checkbox prüfen:
  const agreeTOS = document.getElementById('regAgreeTOS').checked;
  let tosValid = true;
  if (!agreeTOS) {
    tosValid = false;
    showFieldError('agreetos', "Bitte akzeptieren Sie die Bedingungen.");
  } else {
    showFieldError('agreetos', "");
  }
  if (!tosValid || !valid) return;

  // Supabase Signup
  let signUpRes;
  try {
    signUpRes = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { anrede, vorname, nachname, organisation, bundesland, telefon },
        emailRedirectTo: window.location.origin + "/?registered=1"
      }
    });
  } catch (err) {
    showFieldError('regEmail', "Serverfehler: " + (err.message || err));
    return;
  }

  const { data, error } = signUpRes;
  // Debugging
  console.log("Supabase signUp response:", { data, error });

  if (error) {
    showFieldError('regEmail', error.message.includes('already registered')
      ? 'E-Mail ist bereits registriert.' : ('Fehler: ' + error.message));
    return;
  }

  // Profil schreiben – auch bei Magic Link/Confirm!
  let userId = (data && data.user && data.user.id) ? data.user.id : null;
  if (!userId && data && data.session && data.session.user && data.session.user.id) {
    userId = data.session.user.id;
  }
  // Workaround: Fallback auf Supabase getUser()
  if (!userId) {
    const { data: authData } = await supabase.auth.getUser();
    userId = authData?.user?.id || null;
  }
  // E-Mail immer mit speichern!
  if (userId) {
    try {
      await supabase.from('profiles').upsert([{
        user_id: userId,
        email,
        anrede, vorname, nachname, organisation, bundesland, telefon
      }]);
    } catch (err) {
      // Ignorieren – Profil kann im ersten Login nachgeholt werden
      console.log("Fehler beim Profile-Upsert:", err);
    }
  }

  showSuccessOverlay(
    "Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox.",
    () => {
      closeAuthModal();
      showHomepage();
    }
  );
  // Optionales Reset
  const form = document.getElementById('registerForm');
  if (form) form.reset();
}

// --- LOGIN
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  let valid = true;
  showFieldError('loginEmail', "");
  showFieldError('loginPassword', "");
  document.getElementById('login-global-error').textContent = '';
  if (!email) { valid = false; showFieldError('loginEmail', "E-Mail fehlt."); }
  else if (!istGueltigeEmail(email)) { valid = false; showFieldError('loginEmail', "Bitte gültige E-Mail."); }
  if (!password) { valid = false; showFieldError('loginPassword', "Passwort fehlt."); }
  if (!valid) return;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    let message = 'Login fehlgeschlagen. ';
    if (error.message.includes('Invalid login credentials')) message = 'E-Mail oder Passwort falsch.';
    else if (error.message.includes('not confirmed')) message = 'Bitte E-Mail erst bestätigen.';
    else message += error.message;
    document.getElementById('login-global-error').textContent = message;
    showFieldError('loginPassword', message);
    return;
  }
  // Beim ersten Login ggf. Profil anlegen, falls noch nicht vorhanden!
  const userId = data?.user?.id;
  if (userId) {
    const { data: existingProfile } = await supabase.from('profiles').select('user_id').eq('user_id', userId).single();
    if (!existingProfile) {
      await supabase.from('profiles').upsert([{ user_id: userId, email }]);
    }
  }
  window.location.href = "/dashboard.html";
}

// --- LOGOUT
async function logout() {
  await supabase.auth.signOut();
  window.currentUser = null;
  showHomepage();
  localStorage.removeItem("guestChatCount");
  localStorage.removeItem("guestChatDate");
}

// --- Passwort vergessen (UX mit Fehler)
window.showForgotPassword = function() {
  const email = document.getElementById('loginEmail').value;
  if (!email || !istGueltigeEmail(email)) {
    showFieldError('loginEmail', 'Bitte geben Sie Ihre E-Mail-Adresse für den Reset ein.');
    return;
  }
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/?reset=1'
  }).then(({ error }) => {
    document.getElementById('login-global-error').textContent = error ? ('Fehler: '+error.message) : 'E-Mail zum Zurücksetzen wurde gesendet!';
  });
};

// --- SET PASSWORD nach Opt-In-Link
window.setNewPassword = async function() {
  const pw = document.getElementById('newPassword').value;
  if (!pw || pw.length < 10) {
    alert('Bitte ein sicheres Passwort (mind. 10 Zeichen) eingeben!');
    return;
  }
  const { data, error } = await supabase.auth.updateUser({ password: pw });
  if (error) {
    alert('Fehler beim Setzen des Passworts: ' + error.message);
    return;
  }
  alert('Passwort erfolgreich gesetzt! Sie sind jetzt eingeloggt.');
  window.location.href = "/dashboard.html";
};

// --- Feld-Fehler-UX
function showFieldError(id, msg) {
  const inp = document.getElementById(id);
  const errDiv = document.getElementById('error-' + id.replace(/^(reg|login)/, '').toLowerCase());
  if (inp && msg) { inp.classList.add('error'); if (errDiv) errDiv.textContent = msg; return false; }
  if (inp) inp.classList.remove('error');
  if (errDiv) errDiv.textContent = '';
  return true;
}

// --- Modal-Handling
function openAuthModal(tab = "login") {
  document.getElementById('authModalBackdrop').style.display = 'flex';
  switchAuthModal(tab);
  setTimeout(() => {
    if(tab === 'login') document.getElementById('loginEmail').focus();
    else document.getElementById('regAnrede').focus();
  }, 100);
  document.body.classList.add('modal-open');
}
function closeAuthModal() {
  document.getElementById('authModalBackdrop').style.display = 'none';
  document.body.classList.remove('modal-open');
}
function switchAuthModal(tab) {
  document.getElementById('loginTab').style.display = (tab === 'login') ? 'block' : 'none';
  document.getElementById('registerTab').style.display = (tab === 'register') ? 'block' : 'none';
  document.getElementById('login-global-error').textContent = '';
  document.getElementById('register-global-error').textContent = '';
}
// Modal mit Escape schließen
document.addEventListener('keydown', function(e){
  if (e.key === "Escape" && document.getElementById('authModalBackdrop').style.display === 'flex') closeAuthModal();
});
document.getElementById('authModalBackdrop').addEventListener('click', function(e){
  if (e.target === this) closeAuthModal();
});

// --- Weiterleitung abfangen (Opt-In/SetPW/Reset)
function handleRegisteredRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('setpw')) {
    document.getElementById('setPasswordContainer').style.display = 'block';
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    window.scrollTo(0, 180);
    return;
  }
  if (urlParams.has('registered')) {
    openAuthModal('login');
    showSuccessOverlay("Registrierung erfolgreich! Bitte loggen Sie sich jetzt ein.", closeAuthModal);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  if (urlParams.has('reset')) {
    showSuccessOverlay("Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit dem neuen Passwort einloggen.", closeAuthModal);
    openAuthModal('login');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
document.addEventListener('DOMContentLoaded', handleRegisteredRedirect);

// Für globale Verwendung
window.register = register;
window.login = login;
window.logout = logout;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthModal = switchAuthModal;
window.showFieldError = showFieldError;
