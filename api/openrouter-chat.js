export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Only POST allowed' });
      return;
    }
    const { prompt, chatHistory, metaFields, files } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API-Key fehlt.' });

    // Prompt bauen
    let fullPrompt = `Du bist eine KI für die Analyse von Beschaffungsbedarfen.\n`;
    fullPrompt += `Projektangaben:\n${metaFields}\n`;
    fullPrompt += `Bisherige Unterhaltung:\n`;
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach(msg => {
        fullPrompt += `[${msg.role}]: ${msg.content}\n`;
      });
    }
    if (Array.isArray(files) && files.length > 0) {
      fullPrompt += `Zusätzliche Dokumente:\n`;
      files.forEach(f => { fullPrompt += `Datei: ${f.name}:\n${f.text}\n`; });
    }
    fullPrompt += `\nNeue Nachricht: ${prompt}\n`;
    fullPrompt += `Bitte fasse alle bisherigen Infos prägnant zusammen und stelle 3-5 Rückfragen, um den Bedarf iterativ zu präzisieren.`;

    const payload = {
      model: "openrouter/horizon-alpha",
      messages: [
        { role: "system", content: "Du bist ein Assistent für die Bedarfsanalyse in der öffentlichen Beschaffung." },
        { role: "user", content: fullPrompt }
      ]
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: 'OpenRouter API-Fehler: ' + errorText });
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "Keine Antwort von der KI erhalten." });
    } else {
      res.status(200).json({ result: content });
    }
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Abruf von OpenRouter: " + err.message });
  }
}
