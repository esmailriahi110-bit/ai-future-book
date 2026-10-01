const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
const STORAGE_KEY = "zherf_chat_history";

let attachedFile = null;
let currentChatId = null;

// تغییر خودکار و هوشمند ارتفاع textarea
function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 150) + "px";
}

// کنترل سایدبار سمت راست
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

// گفتگوی تازه
function startNewChat() {
  currentChatId = Date.now().toString();
  const chatArea = document.getElementById("chatArea");
  if (chatArea) {
    chatArea.innerHTML = `<div class="msg msg-ai"><button class="copy-btn" onclick="copyText(this)">کپی</button><strong>ژِرف :</strong> سلام.</div>`;
  }
  removeSelectedFile();
  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.classList.contains("active")) toggleSidebar();
}

// انتخاب فایل
function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  attachedFile = file;
  const preview = document.getElementById("filePreview");
  const nameSpan = document.getElementById("fileName");
  if (preview && nameSpan) {
    nameSpan.textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    preview.style.display = "flex";
  }
}

// حذف فایل انتخابی
function removeSelectedFile() {
  attachedFile = null;
  const preview = document.getElementById("filePreview");
  const fileInput = document.getElementById("fileInput");
  if (preview) preview.style.display = "none";
  if (fileInput) fileInput.value = "";
}

// کپی کردن متن پیام
function copyText(btn) {
  const msgDiv = btn.parentElement;
  const clone = msgDiv.cloneNode(true);
  const btnInClone = clone.querySelector(".copy-btn");
  if (btnInClone) btnInClone.remove();
  const text = clone.innerText.replace(/^ژِرف\s*:\s*/, "").trim();
  
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.textContent;
    btn.textContent = "کپی شد!";
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  });
}

// ارسال پیام
async function sendMessage() {
  const input = document.getElementById("userInput");
  const chatArea = document.getElementById("chatArea");

  if (!input || (!input.value.trim() && !attachedFile)) return;

  const userText = input.value.trim();
  let userDisplayHtml = userText.replace(/\n/g, "<br>");
  if (attachedFile) {
    userDisplayHtml += `<br><small style="color: #ffd166;">📎 [پیوست: ${attachedFile.name}]</small>`;
  }

  chatArea.innerHTML += `<div class="msg msg-user">${userDisplayHtml}</div>`;
  const fileNameToSend = attachedFile ? attachedFile.name : null;
  
  input.value = "";
  input.style.height = "auto";
  removeSelectedFile();
  
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg msg-ai";
  loadingDiv.innerHTML = "<em>در حال پردازش...</em>";
  chatArea.appendChild(loadingDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: userText,
        fileName: fileNameToSend
      })
    });

    if (!response.ok) throw new Error(`کد ${response.status}`);

    const data = await response.json();
    const reply = data.reply || data.result || data.choices?.[0]?.message?.content || "پاسخی دریافت نشد.";
    
    loadingDiv.innerHTML = `<button class="copy-btn" onclick="copyText(this)">کپی</button><strong>ژِرف :</strong><br>${reply.replace(/\n/g, "<br>")}`;
    saveToHistory(userText);
  } catch (err) {
    loadingDiv.innerHTML = `<span style="color:#f87171;">متأسفانه ارتباط با سرور برقرار نشد. لطفاً چند لحظه دیگر امتحان کنید.</span>`;
  }
  chatArea.scrollTop = chatArea.scrollHeight;
}

// مدیریت کلید Enter برای ارسال و Shift+Enter برای رفتن به خط بعد
document.addEventListener("DOMContentLoaded", () => {
  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  loadHistory();
});

// ذخیره و بارگذاری تاریخچه
function saveToHistory(summary) {
  if (!summary) return;
  let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  history.unshift({ id: Date.now(), text: summary.substring(0, 30) + "..." });
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  loadHistory();
}

function loadHistory() {
  const list = document.getElementById("chatHistoryList");
  if (!list) return;
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (history.length === 0) {
    list.innerHTML = `<div style="color: #64748b; font-size: 0.8rem; text-align: center;">هنوز گفتگویی ثبت نشده است.</div>`;
    return;
  }
  list.innerHTML = history.map(item => `<div class="history-item">${item.text}</div>`).join("");
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  loadHistory();
}
