// utils.js

/**
 * Formatiert eine Zahl als Euro-Währungswert (z. B. 12345 => "12.345 €")
 * @param {number|string} amount
 * @returns {string}
 */
function formatEuro(amount) {
  const parsed = parseInt(amount);
  if (isNaN(parsed)) return 'n.a.';
  return parsed.toLocaleString('de-DE') + ' €';
}

/**
 * Gibt das aktuelle Datum im deutschen Format zurück (z. B. "29.06.2025")
 * @returns {string}
 */
function aktuellesDatum() {
  return new Date().toLocaleDateString('de-DE');
}

/**
 * Prüft, ob alle angegebenen Felder einen Wert haben
 * @param {string[]} feldIds
 * @returns {boolean}
 */
function felderAusgefüllt(feldIds) {
  for (let id of feldIds) {
    const value = document.getElementById(id)?.value.trim();
    if (!value) return false;
  }
  return true;
}

/**
 * Zeigt eine modale Warnung bei unzureichenden Credits
 * @param {number} benoetigteCredits
 * @returns {boolean}
 */
function pruefeCredits(benoetigteCredits) {
  if (userCredits < benoetigteCredits) {
    alert(`Nicht genügend Credits verfügbar. Erforderlich: ${benoetigteCredits}, Verfügbar: ${userCredits}.`);
    return false;
  }
  return true;
}

/**
 * Reduziert Credits und aktualisiert die Anzeige
 * @param {number} menge
 */
function verwendeCredits(menge) {
  userCredits -= menge;
  document.getElementById('userCredits').textContent = userCredits;
  if (userCredits < 10) {
    alert('Ihre Credits werden knapp. Bitte kontaktieren Sie uns für ein Upgrade.');
  }
}

/**
 * Validiert eine E-Mail-Adresse
 * @param {string} email
 * @returns {boolean}
 */
function istGueltigeEmail(email) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

/**
 * Universal-Call an OpenRouter KI
 * @param {string} prompt - Benutzerfrage
 * @param {string} model - z.B. "mistralai/mistral-7b-instruct"
 * @param {string|null} systemPrompt - Optionale Systemanweisung
 * @returns {Promise<string>} Antworttext der KI
 */
async function callAI(prompt, model = "mistralai/mistral-7b-instruct", systemPrompt = null) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, systemPrompt }),
  });
  if (!response.ok) throw new Error('Fehler bei der KI-Anfrage');
  const data = await response.json();
  if (!data.result) throw new Error("Keine Antwort erhalten.");
  return data.result;
}
