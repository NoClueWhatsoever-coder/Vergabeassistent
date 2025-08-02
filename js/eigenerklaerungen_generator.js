// eigenerklaerungen_generator.js

// Dieses Skript kümmert sich um das Laden und Speichern der optionalen Zusatzangaben
// (Baumaßnahme, Maßnahmenummer, Vergabenummer) auf der Eigenerklärungsseite sowie
// um das Ein‑ und Ausklappen des Formularbereichs.

document.addEventListener('DOMContentLoaded', () => {
  const collapserHead = document.querySelector('.collapsible-head');
  const formContent = document.getElementById('formExtraContent');
  const collapserIcon = document.getElementById('collapser');
  let collapsed = false;

  // Hilfsfunktion zum Ein- und Ausklappen des Formularbereichs
  function setCollapsed(state) {
    collapsed = state;
    if (!formContent || !collapserIcon) return;
    if (collapsed) {
      formContent.classList.add('collapsed');
      collapserIcon.classList.add('rotate');
    } else {
      formContent.classList.remove('collapsed');
      collapserIcon.classList.remove('rotate');
    }
  }

  // Toggle bei Klick auf die Überschrift
  if (collapserHead) {
    collapserHead.addEventListener('click', () => setCollapsed(!collapsed));
  }

  // Lade vorhandene Werte beim Start, falls Eingabefelder vorhanden
  if (document.getElementById('baumaßnahmeInput')) {
    ladeFormularfelder();
  }

  // Speichern der Angaben bei Klick auf den Speichern‑Button
  const saveBtn = document.getElementById('saveFormularFieldsBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const id = getProjektId();
      const baumass = document.getElementById('baumaßnahmeInput')?.value.trim() || '';
      const massnr = document.getElementById('maßnahmeNrInput')?.value.trim() || '';
      const vergabenr = document.getElementById('vergabeNrInput')?.value.trim() || '';
      const { error } = await supabase.from('projekte').update({
        baumaßnahme: baumass,
        maßnahme_nr: massnr,
        vergabe_nr: vergabenr
      }).eq('id', id);
      const stat = document.getElementById('formularSaveStatus');
      if (stat) {
        if (!error) {
          stat.textContent = 'Gespeichert!';
          setTimeout(() => { stat.textContent = ''; }, 1600);
        } else {
          stat.textContent = 'Fehler beim Speichern!';
        }
      }
      // Nach dem Speichern automatisch einklappen
      setTimeout(() => setCollapsed(true), 600);
    });
  }
});

// Lies die Projekt‑ID aus der URL (z.B. ?id=123)
function getProjektId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Lädt die gespeicherten Zusatzangaben aus Supabase und füllt die Felder
async function ladeFormularfelder() {
  const baumaßnahmeElem = document.getElementById('baumaßnahmeInput');
  const maßnahmeNrElem = document.getElementById('maßnahmeNrInput');
  const vergabeNrElem  = document.getElementById('vergabeNrInput');
  if (!baumaßnahmeElem || !maßnahmeNrElem || !vergabeNrElem) return;
  const id = getProjektId();
  if (!id) return;
  try {
    const { data: projekt, error } = await supabase
      .from('projekte')
      .select('baumaßnahme, maßnahme_nr, vergabe_nr')
      .eq('id', id)
      .single();
    if (!error && projekt) {
      baumaßnahmeElem.value = projekt.baumaßnahme || '';
      maßnahmeNrElem.value = projekt.maßnahme_nr || '';
      vergabeNrElem.value  = projekt.vergabe_nr || '';
    }
  } catch (_) {
    // Fehler beim Laden ignorieren
  }
}