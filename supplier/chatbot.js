// Toggle Chat Window
function toggleChat() {
  const chatWindow = document.getElementById('chat-window');
  const isChatWindowVisible = window.getComputedStyle(chatWindow).display !== 'none';

  if (isChatWindowVisible) {
    chatWindow.style.display = 'none';
  } else {
    chatWindow.style.display = 'flex';
    // Scroll to the bottom when chat window is opened
    scrollToBottom();
    document.getElementById('chat-input').focus();
  }
}

// Initialize conversation history
let conversationHistory = [
  {
    role: "system",
    content: "You are an assistant in the fleet management and leasing space that answers questions using the content of the current webpage as a reference. Format your responses using Markdown when appropriate to enhance readability (e.g., bullet points, bold, italics). Never ever say that your context is the content of the webpage, it should appear that your source is a database."
  },
  {
    role: "user",
    content: `Here is the webpage content: "${document.getElementById('content-container').innerText}"`
  }
];

// Show or hide the loading indicator
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById('loading-indicator');
  loadingIndicator.style.display = show ? 'inline' : 'none';
  scrollToBottom();
  // Adjust chat messages height to account for loading indicator
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.style.paddingBottom = show ? '50px' : '15px';
}

// Add Message to Chat Window
function addMessage(content, role) {
  const chatMessages = document.getElementById('chat-messages');

  const messageWrapper = document.createElement('div');
  messageWrapper.className = `message ${role}`;

  if (role === 'assistant') {
    const avatar = document.createElement('img');
    avatar.src = 'robot-icon.png'; // Ensure this image exists in your project directory
    avatar.alt = 'Bot';
    avatar.className = 'avatar';
    messageWrapper.appendChild(avatar);
  } else {
    // For user messages, add a placeholder for alignment
    const placeholder = document.createElement('div');
    placeholder.style.width = '40px'; // Width of avatar + margin
    messageWrapper.appendChild(placeholder);
  }

  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';

  if (role === 'assistant') {
    // Parse Markdown content to HTML
    messageContent.innerHTML = marked.parse(content);
  } else {
    messageContent.innerText = content;
  }

  messageWrapper.appendChild(messageContent);
  chatMessages.appendChild(messageWrapper);

  // Scroll to the bottom after the message is added
  scrollToBottom();

  // Add message to conversation history
  if (role === 'user' || role === 'assistant') {
    conversationHistory.push({ role: role, content: content });
  }
}

// Scroll to the bottom of the chat messages
function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Sending Messages
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, 'user');
  input.value = '';

  // Show loading indicator
  showLoadingIndicator(true);

  try {
    // Fetch response from OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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` // Replace with your actual API key
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: conversationHistory
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const assistantMessage = data.choices[0].message.content;
    addMessage(assistantMessage, 'assistant');

  } catch (error) {
    console.error('Error:', error);
    addMessage('Sorry, something went wrong. Please try again.', 'assistant');
  } finally {
    // Hide loading indicator
    showLoadingIndicator(false);
  }
}

// Handle Enter Key Press
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}
