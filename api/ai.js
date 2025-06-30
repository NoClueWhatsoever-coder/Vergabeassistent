export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }
  const { prompt, model, systemPrompt } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  const payload = {
    model: model || "openai/gpt-3.5-turbo",
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
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

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || null;
  res.status(200).json({ result: content });
}
