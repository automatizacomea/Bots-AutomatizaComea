const internalPrompts = [
  { name: "Assistente Jurídico Geral", content: "Você é um assistente jurídico geral, pronto para ajudar com questões legais diversas. Limite suas respostas a 200 caracteres e use markdown para formatação." },
  { name: "Especialista em Direito Civil", content: "Você é um especialista em direito civil, focado em questões contratuais, familiares e sucessórias. Limite suas respostas a 200 caracteres e use markdown para formatação." },
  { name: "Consultor Trabalhista", content: "Você é um consultor especializado em direito do trabalho, oferecendo orientações sobre questões trabalhistas. Limite suas respostas a 200 caracteres e use markdown para formatação." },
  { name: "Especialista Tributário", content: "Você é um especialista em direito tributário, auxiliando em questões fiscais e tributárias. Limite suas respostas a 200 caracteres e use markdown para formatação." },
  { name: "Assistente Processual", content: "Você é um assistente especializado em direito processual, ajudando com prazos e procedimentos. Limite suas respostas a 200 caracteres e use markdown para formatação." },
];

let conversationHistory = [];
let selectedPrompt = null;
let isConfigured = false;

// Initialize Lucide icons
lucide.createIcons();

// Load prompts into select element
function loadPrompts() {
  const promptSelect = document.getElementById("promptSelect");
  promptSelect.innerHTML = '<option value="">Selecione um prompt</option>';
  internalPrompts.forEach((prompt, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = prompt.name;
    promptSelect.appendChild(option);
  });
}

// Save selection and activate chat
function saveSelection() {
  const promptSelect = document.getElementById("promptSelect");
  const apiKey = document.getElementById("apiKey").value;

  if (!promptSelect.value || !apiKey) {
    alert("Por favor, selecione um prompt e insira a chave da API antes de continuar.");
    return;
  }

  selectedPrompt = internalPrompts[promptSelect.value];
  isConfigured = true;

  // Enable chat elements
  document.getElementById("userInput").disabled = false;
  document.getElementById("sendMessage").disabled = false;
  document.getElementById("resetChat").disabled = false;
  document.getElementById("changePrompt").disabled = false;

  // Disable only API key input and save button
  document.getElementById("apiKey").disabled = true;
  document.getElementById("saveSelection").disabled = true;

  // Add initial message
  addMessageToChat("bot", "### Bem-vindo! 👋\nComo posso ajudar você hoje com suas questões jurídicas?");
}

// Change prompt function
function changePrompt() {
  const promptSelect = document.getElementById("promptSelect");
  selectedPrompt = internalPrompts[promptSelect.value];
  
  // Reset chat with new prompt
  conversationHistory = [];
  document.getElementById("chatMessages").innerHTML = "";
  addMessageToChat("bot", `### Prompt Alterado\nAgora você está conversando com o *${selectedPrompt.name}*. Como posso ajudar?`);
}

// Reset chat
function resetChat() {
  conversationHistory = [];
  document.getElementById("chatMessages").innerHTML = "";
  addMessageToChat("bot", "### Chat Resetado\nComo posso ajudar com suas questões jurídicas?");
}

// Send message to bot
async function sendMessage() {
  if (!isConfigured) {
    alert("Por favor, configure o prompt e a chave da API primeiro.");
    return;
  }

  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat("user", message);
  userInput.value = "";

  conversationHistory.push({
    role: "user",
    content: message,
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${document.getElementById("apiKey").value}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: selectedPrompt.content,
          },
          ...conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    const botResponse = data.choices[0].message.content;
    conversationHistory.push({
      role: "assistant",
      content: botResponse,
    });
    addMessageToChat("bot", botResponse);
  } catch (error) {
    addMessageToChat("bot", `### Erro ❌\n${error.message}`);
  }
}

// Add message to chat
function addMessageToChat(role, content) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${role}`;
  
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  messageContent.innerHTML = marked.parse(content);
  
  messageDiv.appendChild(messageContent);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Event listeners
document.getElementById("sendMessage").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
document.getElementById("resetChat").addEventListener("click", resetChat);
document.getElementById("saveSelection").addEventListener("click", saveSelection);
document.getElementById("changePrompt").addEventListener("click", changePrompt);
document.getElementById("promptSelect").addEventListener("change", function() {
  if (isConfigured) {
    changePrompt();
  }
});

// Initialize prompts when page loads
document.addEventListener("DOMContentLoaded", loadPrompts);
