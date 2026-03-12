document.addEventListener('DOMContentLoaded', () => {
    // Inject Chatbot HTML
    const chatbotHTML = `
    <!-- Floating Button -->
    <div class="chat-widget-btn" id="chatBtn">
      <i class="fa-solid fa-message"></i>
    </div>

    <!-- Chat Window -->
    <div class="chat-window" id="chatWindow">
      <div class="chat-header">
        <h3><i class="fa-solid fa-robot" style="color: var(--primary);"></i> Campus Assistant</h3>
        <button class="close-chat" id="closeChatBtn"><i class="fa-solid fa-times"></i></button>
      </div>
      
      <div class="chat-messages" id="chatMessages">
        <div class="message bot">
          Hi! I'm the Campus Assistant AI. How can I help you today?
        </div>
      </div>

      <div class="quick-replies" id="quickReplies">
        <button class="qr-btn">How to submit complaint?</button>
        <button class="qr-btn">Complaint categories</button>
        <button class="qr-btn">Track complaint status</button>
        <button class="qr-btn">Contact campus office</button>
      </div>

      <div class="chat-input-area">
        <input type="text" id="chatInput" class="chat-input" placeholder="Type a message...">
        <button class="chat-send" id="chatSendBtn"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>
  `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Logic
    const chatBtn = document.getElementById('chatBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeChatBtn = document.getElementById('closeChatBtn');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const qrBtns = document.querySelectorAll('.qr-btn');

    // Toggle Window
    chatBtn.addEventListener('click', () => {
        chatWindow.classList.add('active');
        // Hide notification badge if any
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    // Handle Sending Messages
    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showTyping = () => {
        const typingMsg = document.createElement('div');
        typingMsg.className = 'typing-indicator';
        typingMsg.id = 'typingIndicator';
        typingMsg.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingMsg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const removeTyping = () => {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    };

    const processBotReply = (userText) => {
        showTyping();
        const lText = userText.toLowerCase();

        setTimeout(() => {
            removeTyping();
            let reply = "I'm sorry, I don't understand that yet. Could you rephrase your question?";

            if (lText.includes('how to submit') || lText.includes('create complaint')) {
                reply = "You can submit a complaint by clicking on 'Submit Complaint' in the left sidebar, filling out the title, selecting a category, and providing a description.";
            } else if (lText.includes('categories') || lText.includes('category')) {
                reply = "We currently have categories for Hostel, Canteen, Bus, Classroom, and Other.";
            } else if (lText.includes('track') || lText.includes('status')) {
                reply = "Go to 'View Complaints' from the sidebar to see the current status (Pending, In Progress, Solved) of your submissions.";
            } else if (lText.includes('contact') || lText.includes('office')) {
                reply = "You can reach the main campus admin office at admin@smartcampus.edu or call +1 234 567 8900.";
            } else if (lText.includes('hello') || lText.includes('hi')) {
                reply = "Hello there! How can I assist you with the portal today?";
            }

            appendMessage(reply, 'bot');
        }, 1000 + Math.random() * 800);
    };

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        // Optional: Hide quick replies once conversation starts to save space
        document.getElementById('quickReplies').style.display = 'none';

        processBotReply(text);
    };

    chatSendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    qrBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent;
            appendMessage(text, 'user');
            document.getElementById('quickReplies').style.display = 'none';
            processBotReply(text);
        });
    });

});
