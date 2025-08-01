export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Only POST allowed' });
      return;
    }

    const { prompt, model, systemPrompt } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    // --- DEBUG: logge Werte ---
    console.log('Prompt:', prompt);
    console.log('Model:', model);
    console.log('SystemPrompt:', systemPrompt);
    console.log('API-Key vorhanden:', !!apiKey);

    if (!apiKey) {
      res.status(500).json({ error: 'API-Key nicht gesetzt.' });
      return;
    }
    if (!prompt) {
      res.status(400).json({ error: 'Kein Prompt angegeben.' });
      return;
    }

    const payload = {
      model: model || "openrouter/horizon-alpha",
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    };

    console.log('Payload:', JSON.stringify(payload));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('OpenRouter status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      res.status(500).json({ error: 'OpenRouter API-Fehler: ' + errorText });
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Keine KI-Antwort:', data);
      res.status(500).json({ error: "Keine Antwort von der KI erhalten." });
    } else {
      res.status(200).json({ result: content });
    }
  } catch (err) {
    console.error('Catch-Error:', err);
    res.status(500).json({ error: "Fehler beim Abruf von OpenRouter: " + err.message });
  }
}
