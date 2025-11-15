const SUPPORT_API_URL = "https://support-backend-with-rag.onrender.com/api/chat";

const chatButton = document.getElementById("support-chat-button");
const chatWindow = document.getElementById("support-chat-window");
const closeBtn = document.getElementById("sc-close");
const messagesBox = document.getElementById("sc-messages");
const inputField = document.getElementById("sc-input-field");
const sendBtn = document.getElementById("sc-send-btn");

let history = [];

function appendMessage(text, role) {
  const div = document.createElement("div");
  div.classList.add("sc-message", role === "user" ? "user" : "bot");
  div.textContent = text;
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function setLoading(isLoading) {
  sendBtn.disabled = isLoading;
  sendBtn.textContent = isLoading ? "..." : "Send";
}

async function sendMessage() {
  const text = inputField.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  history.push({ role: "user", content: text });
  inputField.value = "";
  setLoading(true);

  try {
    const response = await fetch(SUPPORT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        history: history
      })
    });

    const data = await response.json();
    const answer = data.answer || "Sorry, I could not answer right now.";

    appendMessage(answer, "assistant");
    history.push({ role: "assistant", content: answer });
  } catch (err) {
    console.error(err);
    appendMessage("Error: connection problem.", "assistant");
  } finally {
    setLoading(false);
  }
}

chatButton.addEventListener("click", () => {
  chatWindow.style.display =
    chatWindow.style.display === "flex" ? "none" : "flex";
});

closeBtn.addEventListener("click", () => {
  chatWindow.style.display = "none";
});

sendBtn.addEventListener("click", sendMessage);

inputField.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
