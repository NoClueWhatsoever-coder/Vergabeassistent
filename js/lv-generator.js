// lv-generator.js

async function generateLV() {
  const titel = document.getElementById('lvTitel').value.trim();
  const beschreibung = document.getElementById('lvBeschreibung').value.trim();
  const wert = document.getElementById('lvWert').value.trim();

  if (!titel || !beschreibung) {
    alert('Bitte füllen Sie mindestens Titel und Beschreibung aus.');
    return;
  }
  if (!pruefeCredits(10)) return;

  const resultDiv = document.getElementById('lvResult');
  const contentDiv = document.getElementById('lvContent');
  resultDiv.style.display = 'block';
  contentDiv.innerHTML = "<em>Leistungsverzeichnis wird von der KI erstellt ...</em>";

  // KI Prompt vorbereiten
  const systemPrompt = `
    Du bist ein Assistent für öffentliche Vergabeverfahren in Deutschland.
    Generiere ein rechtssicheres, produktneutrales Leistungsverzeichnis für die öffentliche Hand.
    Gliedere bitte übersichtlich mit Überschriften, Abschnitten und Listen.
    Füge keine Angebotsabgabe oder rechtlichen Hinweise an, die nicht zur Leistung gehören.
    Verwende möglichst DIN- und EU-Normen, wenn relevant.
  `;

  const userPrompt = `Erstelle ein vollständiges, produktneutrales Leistungsverzeichnis für folgende Leistung:
  Titel: ${titel}
  Beschreibung: ${beschreibung}
  Geschätzter Auftragswert: ${wert ? wert + " €" : "unbekannt"}
  Bitte strukturiert, klar, in gut lesbarem HTML (mit <h3>, <ul>, <li> etc.) – KEINE Einleitung, direkt das LV!`;

  try {
    const response = await callAI(userPrompt, "mistralai/mistral-7b-instruct:free", systemPrompt);
    contentDiv.innerHTML = response;
    verwendeCredits(10);
    alert('Leistungsverzeichnis erfolgreich generiert! 10 Credits verwendet.');
  } catch (err) {
    contentDiv.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
  }
}
