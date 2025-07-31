// js/account.js

// Supabase-Konfiguration (wie im Projekt, ggf. anpassen)
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // ggf. kürzen

const supabase = window.supabase?.createClient
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : supabase; // Fallback, falls schon global geladen

const form = document.getElementById('accountForm');
const vorname = document.getElementById('vorname');
const nachname = document.getElementById('nachname');
const organisation = document.getElementById('organisation');
const bundesland = document.getElementById('bundesland');
const telefon = document.getElementById('telefon');
const successMsg = document.getElementById('accountSuccess');

// User laden und Felder befüllen
let userId = null;
async function loadUserProfile() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user) userId = data.user.id;
  if (!userId) return;
  // Profile holen (ggf. Tabelle anpassen)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (profile) {
    vorname.value = profile.vorname || "";
    nachname.value = profile.nachname || "";
    organisation.value = profile.organisation || "";
    bundesland.value = profile.bundesland || "";
    telefon.value = profile.telefon || "";
  }
}
loadUserProfile();

// Profil speichern
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!userId) {
    successMsg.textContent = "Nicht eingeloggt!";
    return;
  }
  const update = {
    user_id: userId,
    vorname: vorname.value,
    nachname: nachname.value,
    organisation: organisation.value,
    bundesland: bundesland.value,
    telefon: telefon.value
  };
  const { error } = await supabase
    .from('profiles')
    .upsert([update], { onConflict: ['user_id'] });
  if (!error) {
    successMsg.textContent = "Profil gespeichert!";
    setTimeout(() => successMsg.textContent = "", 2000);
  } else {
    successMsg.textContent = "Fehler beim Speichern!";
  }
});

// Passwort ändern
const pwForm = document.getElementById('pwForm');
const oldPw = document.getElementById('oldPw');
const newPw = document.getElementById('newPw');
const pwSuccess = document.getElementById('pwSuccess');

pwForm.addEventListener('submit', async e => {
  e.preventDefault();
  if (!userId) {
    pwSuccess.textContent = "Nicht eingeloggt!";
    return;
  }
  // (Supabase-Standard: Passwort-Änderung ohne alten Hash – nur mit Session!)
  const { error } = await supabase.auth.updateUser({ password: newPw.value });
  if (!error) {
    pwSuccess.textContent = "Passwort geändert!";
    setTimeout(() => pwSuccess.textContent = "", 2000);
    oldPw.value = ""; newPw.value = "";
  } else {
    pwSuccess.textContent = "Fehler beim Ändern!";
  }
});

// Account löschen
const deleteBtn = document.getElementById('deleteAccountBtn');
const deleteSuccess = document.getElementById('deleteSuccess');

deleteBtn.addEventListener('click', async e => {
  e.preventDefault();
  if (!userId) return;
  if (!confirm("Account und ALLE Daten wirklich unwiderruflich löschen?")) return;
  // Supabase: Account-Löschung mit Service-Key (muss serverseitig erfolgen!)
  // Hier kann nur das Profil gelöscht werden, nicht der Auth-User!
  await supabase.from('profiles').delete().eq('user_id', userId);
  deleteSuccess.textContent = "Account (Profil) gelöscht. Für vollständige Löschung bitte Support kontaktieren.";
  // Optional: Auto-Logout / Weiterleitung
  setTimeout(() => window.location.href = "index.html", 2500);
});
