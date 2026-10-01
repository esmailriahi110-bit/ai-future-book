const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
let currentSessionId = Date.now().toString();
let attachedFile = null;

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

function handleKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    attachedFile = file;
    const preview = document.getElementById("filePreview");
    const nameSpan = document.getElementById("fileName");
    nameSpan.innerHTML = `<i class="fa-solid fa-paperclip"></i> ${escapeHtml(file.name)}`;
    preview.style.display = "flex";
  }
}

function removeFile() {
  attachedFile = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("filePreview").style.display = "none";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function appendMessage(role, text) {
  const chatArea = document.getElementById("chatArea");
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";
  bubbleDiv.innerText = text;

  msgDiv.appendChild(bubbleDiv);
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function saveHistory(firstMessageText) {
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  const existing = history.find(h => h.id === currentSessionId);
  if (!existing) {
    history.unshift({
      id: currentSessionId,
      title: firstMessageText.substring(0, 30) + (firstMessageText.length > 30 ? "..." : ""),
      date: new Date().toLocaleDateString("fa-IR")
    });
    localStorage.setItem("zherf_chat_history", JSON.stringify(history));
    renderHistoryList();
  }
}

function renderHistoryList() {
  const container = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">تاریخچه‌ای وجود ندارد</div>';
    return;
  }

  history.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item";
    itemDiv.innerHTML = `
      <div class="history-text" onclick="loadChat('${item.id}')">${escapeHtml(item.title)}</div>
      <button class="delete-item-btn" onclick="deleteHistoryItem(event, '${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(itemDiv);
  });
}

function deleteHistoryItem(event, id) {
  event.stopPropagation();
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  history = history.filter(h => h.id !== id);
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));
  renderHistoryList();
}

function startNewChat() {
  currentSessionId = Date.now().toString();
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = `
    <div class="promo-grid">
      <a href="https://taaghche.com/book/296988" target="_blank" rel="noopener" class="promo-card highlight">
        <div class="promo-title"><i class="fa-solid fa-book" style="color:var(--neon-green)"></i> کتاب نقشه ای برای آینده</div>
        <div class="promo-desc">بررسی تحولات هوش مصنوعی اثر اسماعیل ریاحی در طاقچه</div>
      </a>
      <a href="https://mihanwebhost.com/my/referrers_confirm.php?code=mwh-8b7c8" target="_blank" rel="noopener" class="promo-card highlight">
        <div class="promo-title"><i class="fa-solid fa-server" style="color:var(--accent-blue)"></i> هاست و سرور پرسرعت</div>
        <div class="promo-desc">خرید هاست قدرتمند و مطمئن میهن‌وب‌هاست</div>
      </a>
      <a href="contact.html" class="promo-card">
        <div class="promo-title"><i class="fa-solid fa-rectangle-ad"></i> محل تبلیغ شما</div>
        <div class="promo-desc">رزرو جایگاه بنر و معرفی خدمات شما در این بخش</div>
      </a>
      <a href="contact.html" class="promo-card">
        <div class="promo-title"><i class="fa-solid fa-handshake"></i> اسپانسری و همکاری</div>
        <div class="promo-desc">جهت ارتباط مستقیم و رزرو تبلیغات کلیک کنید</div>
      </a>
    </div>
    <div class="message assistant">
      <div class="bubble">سلام</div>
    </div>
  `;
  removeFile();
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) {
    toggleSidebar();
  }
}

function loadChat(id) {
  currentSessionId = id;
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = `
    <div class="message assistant">
      <div class="bubble">گفتگوی قبلی بارگذاری شد. می‌توانید ادامه دهید.</div>
    </div>
  `;
  toggleSidebar();
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text && !attachedFile) return;

  const promptToSend = text || (attachedFile ? `[فایل پیوست: ${attachedFile.name}]` : "");
  appendMessage("user", promptToSend);
  saveHistory(promptToSend);

  input.value = "";
  input.style.height = "auto";

  const payload = {
    prompt: promptToSend,
    fileName: attachedFile ? attachedFile.name : null
  };

  removeFile();

  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message assistant";
  loadingMsg.id = "loadingMsg";
  loadingMsg.innerHTML = '<div class="bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> در حال پردازش...</div>';
  document.getElementById("chatArea").appendChild(loadingMsg);
  document.getElementById("chatArea").scrollTop = document.getElementById("chatArea").scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();

    if (!response.ok) {
      appendMessage("assistant", `خطای سرور: ${response.status}`);
      return;
    }

    const data = await response.json();
    let reply = "پاسخی از سرور دریافت نشد.";
    if (data.reply) reply = data.reply;
    else if (data.response) reply = data.response;
    else if (data.result) reply = data.result;
    else if (typeof data === "string") reply = data;

    appendMessage("assistant", reply);
  } catch (err) {
    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();
    appendMessage("assistant", `خطا در برقراری ارتباط: ${err.message}. لطفاً اتصال اینترنت خود را بررسی کنید.`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHistoryList();
});
