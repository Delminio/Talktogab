const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/auto";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function buildSystemPrompt(level, mode, topic) {
  const levelInstructions = {
    easy: `
Use very simple English. Keep replies short, friendly, and slow to understand.
Prefer common words and short sentences.
Correct mistakes gently.`,
    normal: `
Use natural everyday English. Keep replies medium length and practical.
Correct clear mistakes, but do not overwhelm the learner.`,
    intermediate: `
Use more varied vocabulary and ask open-ended questions.
Correct grammar and suggest more natural phrasing.`,
    advanced: `
Use fluent, natural English with richer vocabulary.
Challenge the user with follow-up questions, opinions, and nuanced discussion.`,
    teacher: `
Act like a supportive English teacher.
Always provide:
1) brief answer in English,
2) corrected version of the user's sentence,
3) short explanation in Portuguese,
4) one pronunciation tip,
5) one improved natural sentence the learner can repeat.`
  };

  const modeInstructions = {
    free: "Have a free-flowing conversation in English and keep it engaging.",
    opinions: "Give opinions, ask the user's opinion back, and encourage real discussion in English.",
    pronunciation: "Focus on short, repeatable phrases, clarity, and speaking practice.",
    debate: "Politely challenge the user with light debate and ask follow-up questions.",
    interview: "Ask interview-style questions and react to the answers naturally."
  };

  return `
You are an English speaking practice assistant for a Brazilian Portuguese speaker.

Main rules:
- Primary language: English.
- Only use Portuguese when explaining grammar briefly, or if mode/level requires a teaching explanation.
- Be encouraging, direct, and practical.
- Never be rude.
- If the user's English has mistakes, include a corrected version.
- If the user speaks in Portuguese, reply in simple English first, then give a short Portuguese support line.
- Always keep the conversation moving with one follow-up question.
- Topic preference: ${topic || "general daily life"}.

Current level instructions:
${levelInstructions[level] || levelInstructions.normal}

Current conversation mode:
${modeInstructions[mode] || modeInstructions.free}

Output format:
Return valid JSON only with this exact shape:
{
  "reply": "your main reply in English",
  "correction": "corrected version of the user's sentence, or empty string if not needed",
  "explanation_pt": "brief Portuguese explanation, especially for teacher mode, or empty string",
  "pronunciation_tip": "brief pronunciation tip in Portuguese or English",
  "next_question": "one natural follow-up question in English"
}
`.trim();
}

app.post("/api/chat", async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY não configurada no servidor." });
    }

    const { message, level = "normal", mode = "free", topic = "general", history = [] } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Mensagem inválida." });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(level, mode, topic) },
      ...history.slice(-8).flatMap((item) => ([
        { role: "user", content: item.user || "" },
        { role: "assistant", content: item.assistant || "" }
      ])).filter(m => m.content),
      { role: "user", content: message }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": `http://localhost:${PORT}`,
        "X-Title": "English Voice Chat"
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.8
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const err = data?.error?.message || data?.message || "Erro no OpenRouter";
      return res.status(response.status).json({ error: err, raw: data });
    }

    const content = data?.choices?.[0]?.message?.content || "";
    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = {
          reply: content,
          correction: "",
          explanation_pt: "",
          pronunciation_tip: "",
          next_question: ""
        };
      }
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao conversar com a IA.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
