// rechtsprechung.js

async function searchRechtsprechung() {
  const suchbegriff = document.getElementById('rechtsprechungSuche').value.trim();
  if (!suchbegriff) {
    alert('Bitte geben Sie einen Suchbegriff ein.');
    return;
  }
  if (!pruefeCredits(3)) return;

  const resultsDiv = document.getElementById('rechtsprechungResults');
  resultsDiv.innerHTML = "<em>Suche läuft ...</em>";

  // Systemprompt für die KI:
  const systemPrompt = `
    Du bist Experte für deutsches Vergaberecht.
    Suche zu dem angegebenen Stichwort (z.B. "Zuschlagskriterien") relevante aktuelle Rechtsprechung
    und Vergabekammer-Entscheidungen. Fasse die Leitsätze und Kernaussagen zusammen.
    Füge, wenn möglich, Aktenzeichen oder Fundstellen hinzu.
    Antworte immer in klar gegliederter HTML-Struktur (<h4>, <ul>, <li>, <strong>, etc.).
    Keine Einleitung, nur die Ergebnisse.
  `;

  const prompt = `Fasse die aktuellste relevante Rechtsprechung im Vergaberecht zu folgendem Begriff/Problem zusammen: "${suchbegriff}".
  Bitte mit Fundstellen, Leitsätzen und – falls möglich – Link/Quelle angeben.`;

  try {
    const response = await callAI(prompt, "openai/gpt-3.5-turbo", systemPrompt);
    resultsDiv.innerHTML = response;
    verwendeCredits(3);
    alert(`Suche abgeschlossen. 3 Credits verwendet.`);
  } catch (err) {
    resultsDiv.innerHTML = `<span style="color:red">Fehler: ${err.message}</span>`;
  }
}
