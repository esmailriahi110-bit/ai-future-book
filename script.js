const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
const STORAGE_KEY = "zherf_chat_history";

let attachedFile = null;
let currentChatId = null;

// باز و بسته کردن سایدبار
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar && overlay) {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  }
}

// مدیریت پیوست فایل
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  attachedFile = file;
  const tag = document.getElementById("fileTag");
  const nameSpan = document.getElementById("fileName");
  
  if (tag && nameSpan) {
    nameSpan.textContent = `📎 ${file.name}`;
    tag.classList.add("active");
  }
}

function removeAttachedFile() {
  attachedFile = null;
  const tag = document.getElementById("fileTag");
  const input = document.getElementById("fileInput");
  if (tag) tag.classList.remove("active");
  if (input) input.value = "";
}

// شروع گفتگوی تازه
function startNewChat() {
  currentChatId = Date.now().toString();
  const chatArea = document.getElementById("chatArea");
  if (chatArea) {
    chatArea.innerHTML = `
      <div class="msg msg-ai">
        <strong>ژِرف :</strong> سلام.
      </div>
    `;
  }
  removeAttachedFile();
  toggleSidebar();
}

// ذخیره در LocalStorage
function saveChatToStorage() {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return;

  let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const firstUserMsg = chatArea.querySelector(".msg-user");
  const title = firstUserMsg ? firstUserMsg.innerText.slice(0, 30) + "..." : "گفتگوی جدید";

  if (!currentChatId) {
    currentChatId = Date.now().toString();
  }

  const existingIndex = history.findIndex(h => h.id === currentChatId);
  const chatData = {
    id: currentChatId,
    title: title,
    html: chatArea.innerHTML,
    date: new Date().toISOString()
  };

  if (existingIndex > -1) {
    history[existingIndex] = chatData;
  } else {
    history.unshift(chatData);
  }

  if (history.length > 25) history.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById("historyList");
  if (!list) return;
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  list.innerHTML = "";

  history.forEach(item => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.textContent = item.title;
    li.onclick = () => loadChat(item.id);
    list.appendChild(li);
  });
}

function loadChat(id) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const chat = history.find(h => h.id === id);
  if (chat) {
    currentChatId = chat.id;
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.innerHTML = chat.html;
    }
    toggleSidebar();
  }
}

function clearHistory() {
  if (confirm("آیا مایلید کل تاریخچه چت‌ها پاک شود؟")) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistoryList();
    startNewChat();
  }
}

// کپی متن پاسخ
function copyText(btn) {
  const text = btn.parentElement.innerText.replace("کپی", "").trim();
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = "کپی شد ✓";
    setTimeout(() => { btn.textContent = "کپی"; }, 2000);
  });
}

// ارسال پیام
async function sendMessage() {
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatArea = document.getElementById("chatArea");
  
  if (!input || !sendBtn || !chatArea) return;
  
  const userText = input.value.trim();
  if (!userText && !attachedFile) return;

  // اضافه کردن پیام کاربر به صفحه
  const userMsgDiv = document.createElement("div");
  userMsgDiv.className = "msg msg-user";
  userMsgDiv.textContent = userText + (attachedFile ? ` [پیوست: ${attachedFile.name}]` : "");
  chatArea.appendChild(userMsgDiv);

  input.value = "";
  const currentFile = attachedFile;
  removeAttachedFile();
  
  // لودینگ بات
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg msg-ai";
  loadingDiv.innerHTML = "<em>در حال پردازش پاسخ...</em>";
  chatArea.appendChild(loadingDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  sendBtn.disabled = true;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userText,
        fileName: currentFile ? currentFile.name : null
      })
    });

    if (!response.ok) throw new Error("خطا در برقراری ارتباط با سرور هوش مصنوعی.");

    const data = await response.json();
    let reply = "پاسخی دریافت نشد.";

    if (data.reply) reply = data.reply;
    else if (data.choices && data.choices[0]?.message?.content) reply = data.choices[0].message.content;
    else if (data.result) reply = data.result;
    else if (typeof data === "string") reply = data;

    loadingDiv.innerHTML = `
      <button class="copy-btn" onclick="copyText(this)">کپی</button>
      <strong>ژِرف :</strong><br>${reply.replace(/\n/g, "<br>")}
    `;
  } catch (err) {
    loadingDiv.innerHTML = `<span style="color:#ef4444;">متأسفانه ارتباط با سرور برقرار نشد. لطفاً چند لحظه دیگر امتحان کنید.</span>`;
  } finally {
    sendBtn.disabled = false;
    chatArea.scrollTop = chatArea.scrollHeight;
    saveChatToStorage();
  }
}

// ارسال با زدن کلید Enter
document.addEventListener("DOMContentLoaded", () => {
  renderHistoryList();
  currentChatId = Date.now().toString();

  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
