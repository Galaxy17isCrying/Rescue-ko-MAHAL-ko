const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const allowedTopics = /health|hospital|clinic|pharmacy|emergency|disaster|typhoon|rain|weather|flood|pagasa|evacuat|relief|incident|report|website|account|assistance|first aid|earthquake|preparedness|safety|warning/i;
const systemInstruction = "You are ResQ AI for a Philippine community healthcare and disaster assistance platform. Only answer health information, healthcare facilities, emergencies, disaster preparedness, PAGASA safety, evacuation centers, relief, incident reporting, and website navigation. Do not diagnose or prescribe. For serious symptoms advise professional care. For life-threatening emergencies say call 911 in the Philippines now. Never invent facility locations, phone numbers, live warnings, or API data. Say when you cannot verify current information. Ask permission before using location; you cannot access it unless user provides it. Keep answers concise and practical. Never claim to predict earthquakes.";

router.post("/", limiter, async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message || message.length > 2000) return res.status(400).json({ message: "Enter a message up to 2,000 characters." });
  if (!allowedTopics.test(message)) return res.json({ reply: "I can help with healthcare information, emergencies, disaster preparedness, weather safety, evacuation, relief, incident reporting, and using this website. Please ask me something related to those topics." });
  
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiKey) return res.status(503).json({ message: "ResQ AI is not configured in the running server. Add a newly rotated GEMINI_API_KEY to backend/.env, then restart the backend." });
  if (geminiKey.length < 20 || /[\s"']/.test(geminiKey)) return res.status(503).json({ message: "The configured Gemini credential looks malformed. Make sure GEMINI_API_KEY in backend/.env has no quotes or spaces, then restart the backend." });

  try {
    const candidateModels = Array.from(new Set([
      (process.env.GEMINI_MODEL || "").trim(),
      "gemini-1.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro"
    ].filter(Boolean)));
    if (!candidateModels.length) candidateModels.push("gemini-1.5-flash");

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: { temperature: 0.2 }
      })
    };

    let response;
    let data;

    for (let m = 0; m < candidateModels.length; m++) {
      const model = candidateModels[m];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

      for (let attempt = 0; attempt < 2; attempt++) {
        response = await fetch(url, { ...requestOptions, signal: AbortSignal.timeout(20000) });
        if (![500, 502, 503, 504].includes(response.status) || attempt === 1) break;
        await response.body?.cancel();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      data = await response.json().catch(() => ({}));

      // If the model is 404 and we have a fallback model, retry with the next one
      if (response.status === 404 && m < candidateModels.length - 1) {
        console.warn(`ResQ AI: model "${model}" returned 404. Falling back to next candidate model...`);
        continue;
      }
      break;
    }

    if (!response.ok) {
      const providerCode = data?.error?.status || "unknown";
      console.error(`ResQ AI provider error: provider=gemini http=${response.status} code=${providerCode}`);
      let publicMessage = "The AI service could not respond. Check the backend API configuration.";
      if ([400, 401, 403].includes(response.status)) publicMessage = "Gemini rejected the API key or request. Use an active Google AI Studio API key and check that Gemini API access is enabled.";
      else if (response.status === 404) publicMessage = "The configured Gemini model is unavailable. Check GEMINI_MODEL in backend/.env.";
      else if (response.status === 429) publicMessage = "The AI provider quota or rate limit was reached. Try again later or check the provider account.";
      else if (response.status >= 500) publicMessage = "Gemini is temporarily unavailable. Try again shortly.";
      else publicMessage = `Gemini returned HTTP ${response.status}. Check the backend model configuration and server logs.`;
      return res.status(502).json({ message: publicMessage });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("");
    res.json({ reply: reply || "I couldn't prepare an answer. Please try again." });
  } catch (e) {
    if (e.name === "TimeoutError" || e.name === "AbortError") return res.status(504).json({ message: "Gemini took too long to respond. Try again shortly." });
    console.error("ResQ AI:", e);
    res.status(502).json({ message: "Unable to reach ResQ AI right now." });
  }
});

module.exports = router;
