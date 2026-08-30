export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "Server API key is not configured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const temperature = typeof body.temperature === "number" ? body.temperature : 0.8;
    const model = body.model || "openrouter/auto";

    if (!messages.length) {
      return res.status(400).json({ ok: false, error: "messages is required" });
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://x.com",
        "X-Title": "Crypto Copilot"
      },
      body: JSON.stringify({ model, temperature, messages })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || data?.error) {
      return res.status(upstream.status || 502).json({
        ok: false,
        error: data?.error?.message || `OpenRouter error (${upstream.status})`
      });
    }

    return res.status(200).json({
      ok: true,
      text: data?.choices?.[0]?.message?.content?.trim() || ""
    });
  } catch (error) {
    console.error("Crypto Copilot backend error", error);
    return res.status(500).json({ ok: false, error: error?.message || "Backend request failed" });
  }
}
