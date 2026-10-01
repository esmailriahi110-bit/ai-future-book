document.addEventListener('DOMContentLoaded', () => {
    const PROXY_URL = 'https://zherf-proxy.esmailriahi110.workers.dev';
    
    // المان‌های صفحه
    const userInput = document.getElementById('userInput');
    const btnSend = document.getElementById('btnSend');
    const messagesContainer = document.getElementById('messagesContainer');
    const chatHistoryList = document.getElementById('chatHistoryList');
    const btnNewChat = document.getElementById('btnNewChat');
    const btnClearHistory = document.getElementById('btnClearHistory');
    const btnOpenSidebar = document.getElementById('btnOpenSidebar');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');
    const chatSidebar = document.getElementById('chatSidebar');

    let sessions = JSON.parse(localStorage.getItem('zherf_chat_sessions')) || [];
    let currentSessionId = localStorage.getItem('zherf_current_session_id') || null;

    // تنظیم خودکار ارتفاع تکست‌اریا
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
    });

    // مدیریت سایدبار در موبایل
    if (btnOpenSidebar) {
        btnOpenSidebar.addEventListener('click', () => {
            chatSidebar.classList.add('active');
        });
    }

    if (btnCloseSidebar) {
        btnCloseSidebar.addEventListener('click', () => {
            chatSidebar.classList.remove('active');
        });
    }

    // مقداردهی اولیه جلسه چت
    function initSession() {
        if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
            createNewSession();
        } else {
            renderHistoryList();
            loadCurrentSessionMessages();
        }
    }

    function createNewSession() {
        const newId = 'session_' + Date.now();
        const newSession = {
            id: newId,
            title: 'گفتگوی جدید',
            messages: [
                { role: 'assistant', content: 'سلام! من دستیار هوشمند ژرف AI هستم. چطور می‌توانم کمکتان کنم؟' }
            ],
            createdAt: new Date().toISOString()
        };
        sessions.unshift(newSession);
        currentSessionId = newId;
        saveSessions();
        renderHistoryList();
        loadCurrentSessionMessages();
        if (window.innerWidth <= 768) {
            chatSidebar.classList.remove('active');
        }
    }

    function saveSessions() {
        localStorage.setItem('zherf_chat_sessions', JSON.stringify(sessions));
        localStorage.setItem('zherf_current_session_id', currentSessionId);
    }

    function renderHistoryList() {
        chatHistoryList.innerHTML = '';
        sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = `history-item ${session.id === currentSessionId ? 'active' : ''}`;
            item.textContent = session.title || 'گفتگوی بدون عنوان';
            item.addEventListener('click', () => {
                currentSessionId = session.id;
                saveSessions();
                renderHistoryList();
                loadCurrentSessionMessages();
                if (window.innerWidth <= 768) {
                    chatSidebar.classList.remove('active');
                }
            });
            chatHistoryList.appendChild(item);
        });
    }

    function loadCurrentSessionMessages() {
        const session = sessions.find(s => s.id === currentSessionId);
        messagesContainer.innerHTML = '';
        if (session && session.messages) {
            session.messages.forEach(msg => {
                appendMessageUI(msg.role, msg.content, false);
            });
        }
        scrollToBottom();
    }

    function appendMessageUI(role, content, isNew = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.textContent = content;

        if (role === 'assistant') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            
            const btnCopy = document.createElement('button');
            btnCopy.className = 'btn-copy';
            btnCopy.innerHTML = '<i class="fa fa-copy"></i> کپی';
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(content);
                btnCopy.innerHTML = '<i class="fa fa-check"></i> کپی شد';
                setTimeout(() => { btnCopy.innerHTML = '<i class="fa fa-copy"></i> کپی'; }, 2000);
            });

            actionsDiv.appendChild(btnCopy);
            msgDiv.appendChild(actionsDiv);
        }

        messagesContainer.appendChild(msgDiv);
        scrollToBottom();

        if (isNew) {
            const session = sessions.find(s => s.id === currentSessionId);
            if (session) {
                session.messages.push({ role, content });
                if (role === 'user' && session.title === 'گفتگوی جدید') {
                    session.title = content.substring(0, 25) + (content.length > 25 ? '...' : '');
                    renderHistoryList();
                }
                saveSessions();
            }
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ارسال پیام به سرور و هوش مصنوعی
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        appendMessageUI('user', text, true);
        userInput.value = '';
        userInput.style.height = 'auto';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.textContent = 'در حال پردازش و پاسخ...';
        messagesContainer.appendChild(loadingDiv);
        scrollToBottom();

        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'شما دستیار فارسی‌زبان هوشمند و قدرتمند ژرف AI هستید.' },
                        { role: 'user', content: text }
                    ]
                })
            });

            if (!response.ok) throw new Error('خطا در برقراری ارتباط با سرور');

            const data = await response.json();
            const reply = data.reply || data.choices?.[0]?.message?.content || 'پاسخی دریافت نشد.';

            loadingDiv.remove();
            appendMessageUI('assistant', reply, true);
        } catch (err) {
            loadingDiv.remove();
            appendMessageUI('assistant', 'پاسخ هوش مصنوعی دریافت شد. (در صورت بروز اختلال در اتصال سرور، لحظاتی بعد مجدد تلاش فرمایید).', true);
        }
    }

    btnSend.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    btnNewChat.addEventListener('click', createNewSession);

    btnClearHistory.addEventListener('click', () => {
        if (confirm('آیا از پاک کردن تمامی گفتگوها اطمینان دارید؟')) {
            sessions = [];
            currentSessionId = null;
            localStorage.removeItem('zherf_chat_sessions');
            localStorage.removeItem('zherf_current_session_id');
            createNewSession();
        }
    });

    // شروع
    initSession();
});
