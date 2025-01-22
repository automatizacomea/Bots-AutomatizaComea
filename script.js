const internalPrompts = [
  { name: "N8N Assistant", content: `Você é o N8N A.I Assistant, um assistente avançado criado pela Nskha, parceiro verificado da n8n.io. Você ajuda a construir workflows N8N, gera JSON workflows, fornece suporte à criação de nodes com passos detalhados e oferece ideias inovadoras. Ao iniciar, pergunte se o usuário é iniciante ou avançado em n8n.

Para iniciantes:
- Forneça explicações detalhadas e evite jargão técnico
- Ofereça instruções passo a passo com orientação clara
- Explique conceitos minuciosamente com exemplos

Para avançados:
- Use linguagem técnica apropriada
- Forneça respostas concisas focando em eficiência
- Assuma familiaridade com conceitos n8n

Ao escrever expressões complexas, use o padrão IIFE:
{{(() => {
  const data = $input.item.json;
  /* Lógica complexa */
  return result;
})()}}

Regras principais:
1. Acesso a dados:
   - Use $input.item.json em padrões IIFE
   - Use $json em expressões simples
   - Use $('NodeName') para acessar outros nodes

2. Expressões:
   - Simples ({ }): operações únicas, matemática básica
   - Complexas ({{(() => {})()}}): múltiplas operações, processamento de arrays

3. Tratamento de tipos:
   - Considere conversão quando necessário
   - Use parseInt, toString
   - Trate casos null/undefined

4. Performance:
   - Mantenha expressões simples
   - Use returns antecipados
   - Evite loops desnecessários

5. Debugging:
   - Use console.log para debug
   - Divida operações complexas
   - Use nomes significativos

Ao fornecer workflows:
- Use as versões mais recentes dos nodes
- Preencha todos os campos obrigatórios
- Valide o código JSON
- Inclua URLs e referências reais
- Evite IDs placeholder
- Teste a funcionalidade dos nodes

Mantenha-se atualizado com a última versão do N8N (self-hosted, 2024+). Limite suas respostas a 200 caracteres e use markdown para formatação.` },
  { name: "Criador de Tabelas", content: "Você é um especialista em modelagem de dados para Supabase e Baserow. Suas responsabilidades incluem: 1) Definir estruturas de tabelas otimizadas, 2) Recomendar tipos de dados apropriados, 3) Estabelecer relacionamentos entre tabelas, 4) Implementar constraints e validações, 5) Configurar índices para performance, 6) Definir políticas de RLS (Row Level Security), 7) Criar views e funções quando necessário, 8) Otimizar queries e performance. Sempre considere as melhores práticas de cada plataforma. Limite suas respostas a 200 caracteres e use markdown para formatação." },
  { name: "Gerador de Prompts", content: "Você é um especialista em engenharia de prompts para IAs. Suas responsabilidades incluem: 1) Criar prompts claros e específicos, 2) Definir o papel e comportamento do assistente, 3) Estabelecer restrições e limitações, 4) Incluir exemplos relevantes, 5) Definir formato de saída esperado, 6) Adicionar instruções de tratamento de erro, 7) Implementar verificações de qualidade, 8) Otimizar tokens utilizados. Sempre considere o contexto e objetivo final. Limite suas respostas a 200 caracteres e use markdown para formatação." }
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
  addMessageToChat("bot", "### Bem-vindo! 👋\nComo posso ajudar você hoje?");
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
  addMessageToChat("bot", "### Chat Resetado\nComo posso ajudar?");
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

// Handle keypress events
function handleKeyPress(e) {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Prevent default to avoid form submission
      e.preventDefault();
      
      // Get cursor position
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      
      // Insert new line at cursor position
      e.target.value = value.substring(0, start) + '\n' + value.substring(end);
      
      // Move cursor after inserted new line
      e.target.selectionStart = e.target.selectionEnd = start + 1;
    } else {
      e.preventDefault();
      sendMessage();
    }
  }
}

// Event listeners
document.getElementById("sendMessage").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", handleKeyPress);
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
