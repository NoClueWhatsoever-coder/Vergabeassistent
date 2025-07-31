// js/vorlagen.js

// Supabase-Konfiguration (aus dem Projekt, ggf. anpassen)
const supabaseUrl = 'https://jjkuvuywbwnvsgpbqlwo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // <- ggf. kürzen im Livebetrieb

const supabase = window.supabase?.createClient
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : supabase; // Fallback, falls schon global geladen

// Formularfelder
const form = document.getElementById('vorlagenForm');
const orgName = document.getElementById('orgName');
const orgAddress = document.getElementById('orgAddress');
const contactPerson = document.getElementById('contactPerson');
const contactEmail = document.getElementById('contactEmail');
const standardText = document.getElementById('standardText');
const successMsg = document.getElementById('vorlagenSuccess');

// User-ID holen (sofern eingeloggt)
let userId = null;
async function loadUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data?.user) userId = data.user.id;
}
loadUser().then(() => loadTemplate());

// Beim Laden: Vorlage aus DB holen
async function loadTemplate() {
  if (!userId) return;
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (data) {
    orgName.value = data.org_name || "";
    orgAddress.value = data.org_address || "";
    contactPerson.value = data.contact_person || "";
    contactEmail.value = data.contact_email || "";
    standardText.value = data.standard_text || "";
  }
}

// Beim Speichern: Vorlage in DB aktualisieren oder anlegen
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!userId) {
    successMsg.textContent = "Nicht eingeloggt!";
    return;
  }
  const payload = {
    user_id: userId,
    org_name: orgName.value,
    org_address: orgAddress.value,
    contact_person: contactPerson.value,
    contact_email: contactEmail.value,
    standard_text: standardText.value
  };
  // Upsert (insert oder update)
  const { error } = await supabase
    .from('templates')
    .upsert([payload], { onConflict: ['user_id'] });
  if (!error) {
    successMsg.textContent = "Vorlage gespeichert!";
    setTimeout(() => successMsg.textContent = "", 1500);
  } else {
    successMsg.textContent = "Fehler beim Speichern!";
  }
});
