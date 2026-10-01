// آدرس موتور فعال هاگینگ‌فیس ژرف
const HF_ENGINE_URL = "https://esmailr-helektelek-engine.hf.space";
let currentSessionId = Date.now().toString();
let attachedFile = null;

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.toggle("open");
  if (overlay) overlay.classList.toggle("active");
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
    if (preview && nameSpan) {
      nameSpan.innerHTML = `<i class="fa-solid fa-paperclip"></i> ${escapeHtml(file.name)}`;
      preview.style.display = "flex";
    }
  }
}

function removeFile() {
  attachedFile = null;
  const fileInput = document.getElementById("fileInput");
  const filePreview = document.getElementById("filePreview");
  if (fileInput) fileInput.value = "";
  if (filePreview) filePreview.style.display = "none";
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function appendMessage(role, text) {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return;
  
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
  if (!container) return;
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
  if (chatArea) {
    chatArea.innerHTML = `
      <div class="message assistant">
        <div class="bubble">سلام</div>
      </div>
    `;
  }
  removeFile();
  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.classList.contains("open")) {
    toggleSidebar();
  }
}

function loadChat(id) {
  currentSessionId = id;
  const chatArea = document.getElementById("chatArea");
  if (chatArea) {
    chatArea.innerHTML = `
      <div class="message assistant">
        <div class="bubble">گفتگوی قبلی بازیابی شد. بفرمایید، در خدمتم.</div>
      </div>
    `;
  }
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
  removeFile();

  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message assistant";
  loadingMsg.id = "loadingMsg";
  loadingMsg.innerHTML = '<div class="bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> در حال پردازش...</div>';
  document.getElementById("chatArea").appendChild(loadingMsg);
  document.getElementById("chatArea").scrollTop = document.getElementById("chatArea").scrollHeight;

  try {
    // ۱. ارسال درخواست اولیه به موتور هاگینگ‌فیس و دریافت event_id
    const response = await fetch(`${HF_ENGINE_URL}/call/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [{ text: promptToSend, files: [] }, []]
      })
    });

    if (!response.ok) {
      // حالت پشتیبان برای نسخه‌های تک‌متنی Gradio
      const fallbackResponse = await fetch(`${HF_ENGINE_URL}/call/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [promptToSend, []]
        })
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`خطای سرور: ${response.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const eventId = fallbackData.event_id;
      const streamRes = await fetch(`${HF_ENGINE_URL}/call/predict/${eventId}`);
      const rawText = await streamRes.text();
      
      const lines = rawText.split('\n');
      let finalReply = "";
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const parsed = JSON.parse(line.replace("data:", "").trim());
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalReply = parsed[0];
            } else {
              finalReply = parsed;
            }
          } catch(e) {
            finalReply = line.replace("data:", "").trim();
          }
        }
      }
      
      const loadingElement = document.getElementById("loadingMsg");
      if (loadingElement) loadingElement.remove();
      appendMessage("assistant", finalReply || "پاسخی دریافت نشد.");
      return;
    }

    const data = await response.json();
    const eventId = data.event_id;

    // ۲. دریافت پاسخ پردازش‌شده
    const streamRes = await fetch(`${HF_ENGINE_URL}/call/chat/${eventId}`);
    const rawText = await streamRes.text();

    const lines = rawText.split('\n');
    let finalReply = "";
    for (const line of lines) {
      if (line.startsWith("data:")) {
        try {
          const parsed = JSON.parse(line.replace("data:", "").trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalReply = parsed[0];
          } else {
            finalReply = parsed;
          }
        } catch(e) {
          finalReply = line.replace("data:", "").trim();
        }
      }
    }

    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();
    appendMessage("assistant", finalReply || "پاسخ دریافت شد.");

  } catch (err) {
    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();
    appendMessage("assistant", "خطا در برقراری ارتباط با موتور ژرف. لطفاً وضعیت سرویس یا اینترنت را بررسی فرمایید.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHistoryList();
});
