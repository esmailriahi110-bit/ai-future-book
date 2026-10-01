/**
 * Zherf AI Engine & Chat Controller
 * نویسنده و توسعه‌دهنده: اسماعیل ریاحی
 */

const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
const SESSIONS_STORAGE_KEY = "zherf_chat_sessions";
const CURRENT_SESSION_KEY = "zherf_current_session_id";

let sessions = [];
let currentSessionId = null;
let selectedFile = null;

// راه‌اندازی اولیه به محض لود شدن صفحه
document.addEventListener("DOMContentLoaded", () => {
    loadSessionsFromStorage();
    if (!sessions || sessions.length === 0) {
        startNewChat(false);
    } else {
        const savedId = localStorage.getItem(CURRENT_SESSION_KEY);
        if (savedId && sessions.some(s => s.id === savedId)) {
            switchSession(savedId);
        } else {
            switchSession(sessions[0].id);
        }
    }
    renderHistoryList();
});

// باز و بسته کردن سایدبار
function openSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.add("active");
    if (overlay) overlay.classList.add("active");
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
}

// بارگذاری و ذخیره جلسات در LocalStorage
function loadSessionsFromStorage() {
    try {
        const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
        sessions = data ? JSON.parse(data) : [];
    } catch (e) {
        sessions = [];
    }
}

function saveSessionsToStorage() {
    try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
        if (currentSessionId) {
            localStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
        }
    } catch (e) {
        console.error("Storage save failed:", e);
    }
}

// ساخت گفتگوی جدید
function startNewChat(shouldSwitch = true) {
    const newSession = {
        id: "session_" + Date.now(),
        title: "گفتگوی جدید",
        messages: [
            {
                role: "assistant",
                content: "سلام. من ژرف AI هستم؛ دستیار هوشمند و پژوهشی شما. چطور می‌توانم کمکتان کنم؟",
                time: new Date().toLocaleTimeString("fa-IR")
            }
        ]
    };
    sessions.unshift(newSession);
    saveSessionsToStorage();
    renderHistoryList();
    if (shouldSwitch) {
        switchSession(newSession.id);
        closeSidebar();
    }
}

// سوییچ بین گفتگوها
function switchSession(sessionId) {
    currentSessionId = sessionId;
    saveSessionsToStorage();
    renderHistoryList();
    renderMessages();
}

// حذف تکی یک گفتگو
function deleteSession(sessionId, event) {
    if (event) event.stopPropagation();
    sessions = sessions.filter(s => s.id !== sessionId);
    if (sessions.length === 0) {
        startNewChat(false);
    } else if (currentSessionId === sessionId) {
        currentSessionId = sessions[0].id;
    }
    saveSessionsToStorage();
    renderHistoryList();
    renderMessages();
}

// پاکسازی تمام گفتگوها
function clearAllHistory() {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام تاریخچه گفتگوها پاک شود؟")) {
        sessions = [];
        localStorage.removeItem(SESSIONS_STORAGE_KEY);
        localStorage.removeItem(CURRENT_SESSION_KEY);
        startNewChat(true);
    }
}

// رندر لیست تاریخچه در سایدبار
function renderHistoryList() {
    const listContainer = document.getElementById("historyList");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    sessions.forEach(session => {
        const item = document.createElement("div");
        item.className = `history-item ${session.id === currentSessionId ? "active" : ""}`;
        item.onclick = () => {
            switchSession(session.id);
            closeSidebar();
        };

        const title = document.createElement("div");
        title.className = "history-title";
        title.textContent = session.title || "گفتگوی بدون نام";

        const delBtn = document.createElement("button");
        delBtn.className = "btn-del-single";
        delBtn.title = "حذف این گفتگو";
        delBtn.innerHTML = '<i class="fa fa-trash-can"></i>';
        delBtn.onclick = (e) => deleteSession(session.id, e);

        item.appendChild(title);
        item.appendChild(delBtn);
        listContainer.appendChild(item);
    });
}

// رندر پیام‌های گفتگوی فعلی در صفحه
function renderMessages() {
    const container = document.getElementById("messagesContainer");
    if (!container) return;
    container.innerHTML = "";

    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (!activeSession) return;

    activeSession.messages.forEach(msg => {
        const bubble = document.createElement("div");
        bubble.className = `msg-bubble ${msg.role === "user" ? "msg-user" : "msg-ai"}`;

        let htmlContent = "";
        if (msg.fileName) {
            htmlContent += `<div class="file-attachment-badge"><i class="fa fa-file"></i> ${escapeHtml(msg.fileName)}</div>`;
        }
        htmlContent += `<p>${formatText(msg.content)}</p>`;
        
        if (msg.role === "assistant") {
            htmlContent += `
                <div class="msg-tools">
                    <button class="btn-copy-msg" onclick="copyMessageText(this)" title="کپی متن">
                        <i class="fa fa-copy"></i>
                    </button>
                </div>
            `;
        }

        bubble.innerHTML = htmlContent;
        container.appendChild(bubble);
    });

    scrollToBottom();
}

// مدیریت انتخاب فایل و دوربین
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        const previewStrip = document.getElementById("filePreviewStrip");
        const nameSpan = document.getElementById("fileNameSpan");
        if (nameSpan) nameSpan.textContent = file.name + " (" + (file.size / 1024).toFixed(1) + " KB)";
        if (previewStrip) previewStrip.classList.add("active");
    }
}

function removeSelectedFile() {
    selectedFile = null;
    const fileInput = document.getElementById("fileInput");
    const cameraInput = document.getElementById("cameraInput");
    const previewStrip = document.getElementById("filePreviewStrip");
    if (fileInput) fileInput.value = "";
    if (cameraInput) cameraInput.value = "";
    if (previewStrip) previewStrip.classList.remove("active");
}

// ارسال پیام به ورکر کلودفلر
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input ? input.value.trim() : "";

    if (!text && !selectedFile) return;

    const activeSession = sessions.find(s => s.id === currentSessionId);
    if (!activeSession) return;

    // ذخیره پیام کاربر
    const userMsg = {
        role: "user",
        content: text,
        fileName: selectedFile ? selectedFile.name : null,
        time: new Date().toLocaleTimeString("fa-IR")
    };
    activeSession.messages.push(userMsg);

    // به‌روزرسانی عنوان گفتگو اگر اولین پیام باشد
    if (activeSession.messages.filter(m => m.role === "user").length === 1) {
        activeSession.title = text.slice(0, 30) || (selectedFile ? selectedFile.name : "گفتگو");
    }

    saveSessionsToStorage();
    renderHistoryList();
    renderMessages();

    // پاکسازی ورودی
    if (input) input.value = "";
    removeSelectedFile();

    // نمایش وضعیت در حال نوشتن (Loading)
    const messagesContainer = document.getElementById("messagesContainer");
    const loadingBubble = document.createElement("div");
    loadingBubble.className = "msg-bubble msg-ai";
    loadingBubble.id = "loadingBubble";
    loadi
