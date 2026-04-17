const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const speakAgainBtn = document.getElementById("speakAgainBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const userText = document.getElementById("userText");
const botText = document.getElementById("botText");
const correctionText = document.getElementById("correctionText");
const explanationText = document.getElementById("explanationText");
const pronunciationTip = document.getElementById("pronunciationTip");
const nextQuestion = document.getElementById("nextQuestion");
const expectedPhrase = document.getElementById("expectedPhrase");
const spokenPhrase = document.getElementById("spokenPhrase");
const similarityScore = document.getElementById("similarityScore");
const wordScore = document.getElementById("wordScore");
const pronunciationFeedback = document.getElementById("pronunciationFeedback");
const historyList = document.getElementById("historyList");
const statusText = document.getElementById("statusText");

const levelSelect = document.getElementById("level");
const modeSelect = document.getElementById("mode");
const voiceRateSelect = document.getElementById("voiceRate");
const topicInput = document.getElementById("topic");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let lastResponseText = "Hello! Press “Falar” and start speaking in English.";
let currentExpected = "";
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;
} else {
  statusText.textContent = "Seu navegador não suporta reconhecimento de voz. Use Chrome no desktop.";
}

function getHistory() {
  return JSON.parse(localStorage.getItem("english_voice_history") || "[]");
}

function saveHistory(entry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem("english_voice_history", JSON.stringify(history.slice(0, 20)));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (!history.length) {
    historyList.innerHTML = "<p class='muted'>Nenhuma conversa salva ainda.</p>";
    return;
  }

  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <small>${new Date(item.createdAt).toLocaleString("pt-BR")}</small>
      <strong>You:</strong> ${escapeHtml(item.user)}<br/>
      <strong>AI:</strong> ${escapeHtml(item.reply)}
      ${item.correction ? `<br/><strong>Correção:</strong> ${escapeHtml(item.correction)}` : ""}
    </div>
  `).join("");
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function speak(text) {
  if (!text) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = Number(voiceRateSelect.value || 1);
  utterance.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.toLowerCase().startsWith("en"));
  if (preferred) utterance.voice = preferred;
  speechSynthesis.speak(utterance);
}

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function comparePronunciation(expected, spoken) {
  const expectedNorm = normalizeText(expected);
  const spokenNorm = normalizeText(spoken);

  if (!expectedNorm || !spokenNorm) {
    return {
      similarity: 0,
      correctWords: 0,
      totalWords: expectedNorm ? expectedNorm.split(" ").length : 0,
      feedback: "Fale a frase corrigida para comparar."
    };
  }

  const expectedWords = expectedNorm.split(" ");
  const spokenWords = spokenNorm.split(" ");

  let correctWords = 0;
  expectedWords.forEach((word, index) => {
    if (spokenWords[index] === word || spokenWords.includes(word)) {
      correctWords++;
    }
  });

  const maxLen = Math.max(expectedNorm.length, spokenNorm.length);
  const dist = levenshtein(expectedNorm, spokenNorm);
  const similarity = Math.max(0, Math.round((1 - dist / maxLen) * 100));

  let feedback = "Boa tentativa. Repita focando no ritmo e nas palavras que faltaram.";
  if (similarity >= 90) feedback = "Excelente. Sua frase ficou muito próxima da esperada.";
  else if (similarity >= 75) feedback = "Muito bom. Ajuste só algumas palavras e a fluidez.";
  else if (similarity >= 55) feedback = "Está no caminho. Tente repetir mais devagar.";
  else feedback = "Repita em partes curtas. Primeiro metade da frase, depois a frase completa.";

  return {
    similarity,
    correctWords,
    totalWords: expectedWords.length,
    feedback
  };
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

async function sendToAI(text) {
  statusText.textContent = "Enviando para a IA...";
  const body = {
    message: text,
    level: levelSelect.value,
    mode: modeSelect.value,
    topic: topicInput.value || "general conversation",
    history: getHistory().slice(0, 6).map(item => ({
      user: item.user,
      assistant: item.reply
    }))
  };

  async function sendToAI(text) {
  statusText.textContent = "Enviando para a IA...";

  const body = {
    message: text,
    level: levelSelect.value,
    mode: modeSelect.value,
    topic: topicInput.value || "general conversation",
    history: getHistory().slice(0, 6).map(item => ({
      user: item.user,
      assistant: item.reply
    }))
  };

  const API_BASE =
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://talktogab.onrender.com";

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao conversar com a IA.");
  }

  return data;
}

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao conversar com a IA.");
  }

  return data;
}

async function processUserSpeech(transcript) {
  userText.textContent = transcript;
  spokenPhrase.textContent = transcript;

  const localAnalysis = comparePronunciation(currentExpected || correctionText.textContent, transcript);
  similarityScore.textContent = `${localAnalysis.similarity}%`;
  wordScore.textContent = `${localAnalysis.correctWords}/${localAnalysis.totalWords}`;
  pronunciationFeedback.textContent = localAnalysis.feedback;

  try {
    const data = await sendToAI(transcript);

    const reply = data.reply || "Can you tell me a little more?";
    const correction = data.correction || "";
    const explanation = data.explanation_pt || "";
    const tip = data.pronunciation_tip || "";
    const followUp = data.next_question || "";

    lastResponseText = [reply, followUp].filter(Boolean).join(" ");
    botText.textContent = reply;
    correctionText.textContent = correction || "Sua frase já parece boa.";
    explanationText.textContent = explanation || "Sem explicação extra desta vez.";
    pronunciationTip.textContent = tip || "Dica não disponível.";
    nextQuestion.textContent = followUp || "Please continue.";
    currentExpected = correction || reply;
    expectedPhrase.textContent = currentExpected;

    const finalAnalysis = comparePronunciation(currentExpected, transcript);
    similarityScore.textContent = `${finalAnalysis.similarity}%`;
    wordScore.textContent = `${finalAnalysis.correctWords}/${finalAnalysis.totalWords}`;
    pronunciationFeedback.textContent = finalAnalysis.feedback;

    saveHistory({
      user: transcript,
      reply,
      correction,
      explanation,
      pronunciationTip: tip,
      nextQuestion: followUp,
      createdAt: Date.now()
    });

    statusText.textContent = "Resposta recebida. Falando em voz alta...";
    speak(lastResponseText);
  } catch (error) {
    statusText.textContent = `Erro: ${error.message}`;
    botText.textContent = "I couldn't reach the AI right now. Please check your server and API key.";
  }
}

if (recognition) {
  recognition.onstart = () => {
    isListening = true;
    statusText.textContent = "Ouvindo...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    processUserSpeech(transcript);
  };

  recognition.onerror = (event) => {
    statusText.textContent = `Erro no microfone: ${event.error}`;
  };

  recognition.onend = () => {
    isListening = false;
    if (statusText.textContent === "Ouvindo...") {
      statusText.textContent = "Reconhecimento finalizado.";
    }
  };
}

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  if (isListening) recognition.stop();
  recognition.lang = "en-US";
  recognition.start();
});

stopBtn.addEventListener("click", () => {
  if (recognition && isListening) recognition.stop();
  speechSynthesis.cancel();
  statusText.textContent = "Parado.";
});

speakAgainBtn.addEventListener("click", () => speak(lastResponseText));

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("english_voice_history");
  renderHistory();
  statusText.textContent = "Histórico local apagado.";
});

window.speechSynthesis.onvoiceschanged = () => {};

renderHistory();
