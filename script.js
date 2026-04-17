const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const userText = document.getElementById("userText");
const botText = document.getElementById("botText");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert("Seu navegador não suporta reconhecimento de voz.");
}

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = false;

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

function generateReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes("hello")) {
    return "Hello! How are you today?";
  }

  if (lower.includes("how are you")) {
    return "I am great! I am here to help you practice English.";
  }

  if (lower.includes("my name is")) {
    return "Nice to meet you! Tell me more about yourself.";
  }

  if (lower.includes("i want to practice english")) {
    return "Great! Let's practice together. What did you do today?";
  }

  if (lower.includes("bye")) {
    return "Goodbye! See you next time.";
  }

  return "That's interesting. Can you tell me more in English?";
}

startBtn.addEventListener("click", () => {
  recognition.start();
  botText.textContent = "Listening...";
});

stopBtn.addEventListener("click", () => {
  recognition.stop();
  speechSynthesis.cancel();
});

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  userText.textContent = transcript;

  const reply = generateReply(transcript);
  botText.textContent = reply;
  speak(reply);
};

recognition.onerror = (event) => {
  botText.textContent = "Error: " + event.error;
};

recognition.onend = () => {
  console.log("Recognition ended.");
};
