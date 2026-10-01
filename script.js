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
  if (!file) return;
  attachedFile = file;
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("filePreview").style.display = "flex";
}

function removeFile() {
  attachedFile = null;
  document.getElementById("fileInput").value = "";
  document.getElementById("filePreview").style.display = "none";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function appendMessage(role, text) {
  const chatArea = document.getElementById("chatArea");
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  const headerDiv = document.createElement("div");
  headerDiv.className = "message-header";
  headerDiv.innerHTML = `<span>${role === "user" ? "شما" : "ژرف AI"}</span>`;

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "کپی";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text);
    copyBtn.textContent = "کپی شد!";
    setTimeout(() => (copyBtn.textContent = "کپی"), 2000);
  };
  headerDiv.appendChild(copyBtn);

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";
  contentDiv.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");

  msgDiv.appendChild(headerDiv);
  msgDiv.appendChild(contentDiv);
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  return msgDiv;
}

function saveHistory(firstMessageText) {
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  const existingIndex = history.findIndex((h) => h.id === currentSessionId);
  const title = firstMessageText.substring(0, 28) + (firstMessageText.length > 28 ? "..." : "");

  const chatArea = document.getElementById("chatArea");
  const chatHtml = chatArea.innerHTML;

  if (existingIndex > -1) {
    history[existingIndex].html = chatHtml;
  } else {
    history.unshift({
      id: currentSessionId,
      title: title,
      date: new Date().toLocaleDateString("fa-IR"),
      html: chatHtml
    });
  }

  localStorage.setItem("zherf_chat_history", JSON.stringify(history.slice(0, 30)));
  renderHistoryList();
}

function renderHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");

  historyList.innerHTML = "";
  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty-history">گفتگویی یافت نشد.</li>';
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item" + (item.id === currentSessionId ? " active" : "");
    li.innerHTML = `
      <span class="history-title" onclick="loadChat('${item.id}')">${escapeHtml(item.title)}</span>
      <button class="delete-history-btn" onclick="deleteHistoryItem(event, '${item.id}')" title="حذف">×</button>
    `;
    historyList.appendChild(li);
  });
}

function deleteHistoryItem(event, id) {
  event.stopPropagation();
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  history = history.filter((h) => h.id !== id);
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));

  if (id === currentSessionId) {
    startNewChat();
  } else {
    renderHistoryList();
  }
}

function startNewChat() {
  currentSessionId = Date.now().toString();
  removeFile();
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = `
    <div class="message assistant">
      <div class="message-header"><span>ژرف AI</span></div>
      <div class="message-content">سلام! چطور می‌تونم کمکتون کنم؟</div>
    </div>
    <div class="promo-grid">
      <a href="https://taaghche.com/book/296988" target="_blank" rel="noopener" class="promo-card">
        <span class="promo-badge">کتاب رسمی</span>
        <span class="promo-title">کتاب AI؛ نقشه‌ای برای آینده</span>
        <span class="promo-desc">مطالعه نسخه رسمی در اپلیکیشن طاقچه</span>
      </a>
      <a href="https://mihanwebhost.com/my/referrers_confirm.php?code=mwh-8b7c8" target="_blank" rel="noopener" class="promo-card">
        <span class="promo-badge">پیشنهاد ویژه</span>
        <span class="promo-title">هاست و سرور ابری میهن‌وب‌هاست</span>
        <span class="promo-desc">راه‌اندازی سایت و سرور هوش مصنوعی</span>
      </a>
      <a href="contact.html" class="promo-card reserved">
        <span class="promo-badge">تبلیغات شما</span>
        <span class="promo-title">محل تبلیغ و معرفی کسب‌وکار</span>
        <span class="promo-desc">کلیک برای رزرو و سفارش جایگاه</span>
      </a>
      <a href="contact.html" class="promo-card reserved">
        <span class="promo-badge">اسپانسرینگ</span>
        <span class="promo-title">محل تبلیغ و معرفی محصول</span>
        <span class="promo-desc">کلیک برای همکاری و رزرو تبلیغ</span>
      </a>
    </div>
  `;
  renderHistoryList();
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) toggleSidebar();
}

function loadChat(id) {
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  const target = history.find((h) => h.id === id);
  if (target && target.html) {
    currentSessionId = target.id;
    document.getElementById("chatArea").innerHTML = target.html;
    renderHistoryList();
    if (window.innerWidth <= 768) toggleSidebar();
  }
}

async function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text && !attachedFile) return;

  const isFirstMessage = document.querySelectorAll(".message.user").length === 0;

  let displayMsg = text;
  if (attachedFile) {
    displayMsg += `\n📎 [پیوست: ${attachedFile.name}]`;
  }

  appendMessage("user", displayMsg);
  input.value = "";
  input.style.height = "auto";

  const promoGrid = document.querySelector(".promo-grid");
  if (promoGrid) promoGrid.remove();

  const loadingMsg = appendMessage("assistant", "در حال پردازش و پاسخ...");

  try {
    const payload = {
      prompt: text,
      fileName: attachedFile ? attachedFile.name : null
    };

    removeFile();

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`خطای سرور: ${response.status}`);

    const data = await response.json();
    let replyText = "";

    if (data.reply) {
      replyText = data.reply;
    } else if (data.choices && data.choices[0] && data.choices[0].message) {
      replyText = data.choices[0].message.content;
    } else if (data.result) {
      replyText = data.result;
    } else {
      replyText = "پاسخی از سرور دریافت نشد.";
    }

    loadingMsg.querySelector(".message-content").innerHTML = escapeHtml(replyText).replace(/\n/g, "<br>");
    loadingMsg.querySelector(".copy-btn").onclick = () => {
      navigator.clipboard.writeText(replyText);
    };

    saveHistory(text || "گفتگوی فایل");
  } catch (err) {
    loadingMsg.querySelector(".message-content").innerHTML = `<span style="color: #ff6b6b;">خطا در برقراری ارتباط: ${err.message}. لطفاً اتصال را بررسی کنید.</span>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHistoryList();
});
