// @ts-ignore
// auth.js

async function register() {
  const anrede = document.getElementById('regAnrede').value;
  const vorname = document.getElementById('regVorname').value;
  const nachname = document.getElementById('regNachname').value;
  const organisation = document.getElementById('regOrganisation').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const bundesland = document.getElementById('regBundesland').value;

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


  // Supabase Signup (Double Opt-In)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { anrede, vorname, nachname, organisation, bundesland }
    }
  });

  if (error) {
    alert("Fehler bei der Registrierung: " + error.message);
    return;
  }

  alert("Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in Ihrer Mailbox!");
  showHomepage();
}


async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert("Bitte geben Sie E-Mail und Passwort ein.");
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    return;
  }

  if (pError || !profile) {
    alert("Profil konnte nicht geladen werden. Bitte wenden Sie sich an den Support.");
    return;
  }

  currentUser = {
    email: user.email,
    name: `${profile.anrede} ${profile.vorname} ${profile.nachname}`,
    organisation: profile.organisation,
    bundesland: profile.bundesland
  };
  showDashboard();
}

async function logout() {
  await supabase.auth.signOut();
  currentUser = null;
  showHomepage();
  // Demo-Limit für Gäste zurücksetzen:
  localStorage.removeItem("guestChatCount");
  localStorage.removeItem("guestChatDate");
}

function showHomepage() {
  document.getElementById('homepage').style.display = 'block';
  document.getElementById('authContainer').style.display = 'none';
  document.getElementById('dashboard').style.display = 'none';
}

function showLogin() {
  document.getElementById('homepage').style.display = 'none';
  document.getElementById('authContainer').style.display = 'block';
  switchTab('login');
}

function switchTab(tab) {
  // ... wie gehabt
}
