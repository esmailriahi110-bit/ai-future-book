// آدرس موتور فعال و رسمی هاگینگ‌فیس ژرف
const HF_ENGINE_URL = "https://esmailr-helektelek-engine.hf.space";

let currentSessionId = Date.now().toString();
let attachedFile = null;

// جلوگیری از ارسال همزمان
let isSending = false;

// باز و بسته کردن سایدبار منو
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (sidebar) sidebar.classList.toggle("open");
  if (overlay) overlay.classList.toggle("active");
}

// تنظیم خودکار ارتفاع کادر متن پیام
function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

// ارسال پیام با کلید اینتر (Enter) بدون Shift
function handleKeyDown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// مدیریت انتخاب و پیوست فایل و تصویر
function handleFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // کنترل سقف حجم فایل (حداکثر ۱۰ مگابایت)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("حجم فایل انتخابی بیش از حد مجاز است. لطفاً فایلی با حجم کمتر از ۱۰ مگابایت انتخاب کنید.");
    event.target.value = "";
    return;
  }

  attachedFile = file;
  const preview = document.getElementById("filePreview");
  const nameSpan = document.getElementById("fileName");

  if (preview && nameSpan) {
    let icon = "fa-paperclip";
    if (file.type.startsWith("image/")) icon = "fa-image";
    else if (file.type.startsWith("audio/")) icon = "fa-microphone-lines";
    else if (file.type.includes("pdf")) icon = "fa-file-pdf";

    nameSpan.innerHTML = `<i class="fa-solid ${icon}"></i> ${escapeHtml(file.name)}`;
    preview.style.display = "flex";
  }
}

// حذف فایل پیوست شده
function removeFile() {
  attachedFile = null;
  const fileInput = document.getElementById("fileInput");
  const filePreview = document.getElementById("filePreview");
  if (fileInput) fileInput.value = "";
  if (filePreview) filePreview.style.display = "none";
}

// پاکسازی کاراکترهای خطرناک برای امنیت متن
function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text == null ? "" : String(text);
  return div.innerHTML;
}

// کپی به کلیپ‌بورد با روش ایمن و تست‌شده برای موبایل و دسکتاپ
async function copyToClipboard(text) {
  const value = text == null ? "" : String(text);

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {}
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (err) {
    return false;
  }
}

// تبدیل متن پاسخ دستیار به فرمت تمیز دارای کادر کد و لینک
function renderAssistantTextToHtml(text) {
  const safe = escapeHtml(text);

  // تعریف کاملاً ایمن بدون شکستن کاراکترها
  const codeFence = new RegExp("\\x60\\x60\\x60([\\w+-]*)\\n([\\s\\S]*?)\\x60\\x60\\x60", "g");

  let html = safe.replace(codeFence, function(match, lang, code) {
    const langLabel = lang ? `<div class="z-code-lang">${escapeHtml(lang)}</div>` : "";
    return `<div class="z-code-block">${langLabel}<pre><code>${code}</code></pre><button class="z-copy-code-btn" type="button" data-code="${encodeURIComponent(code)}">کپی کد</button></div>`;
  });

  // شناسایی و تبدیل خودکار لینک‌ها
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  html = html.replace(urlRegex, function(u) {
    return `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`;
  });

  // حفظ شکست خطوط
  html = html.replace(/\n/g, "<br>");

  return html;
}

// فعال‌سازی رویداد کلیک برای دکمه‌های کپی
function wireCopyButtons(scopeEl) {
  if (!scopeEl) return;

  // فعال‌سازی کپی کد
  const codeButtons = scopeEl.querySelectorAll(".z-copy-code-btn");
  codeButtons.forEach(function(btn) {
    btn.addEventListener("click", async function() {
      const encoded = btn.getAttribute("data-code") || "";
      let codeEscaped = "";
      try {
        codeEscaped = decodeURIComponent(encoded);
      } catch (e) {
        codeEscaped = encoded;
      }

      const tmp = document.createElement("div");
      tmp.innerHTML = codeEscaped;
      const plain = tmp.textContent || tmp.innerText || "";

      const ok = await copyToClipboard(plain);
      btn.textContent = ok ? "کپی شد ✓" : "خطا";
      setTimeout(function() {
        btn.textContent = "کپی کد";
      }, 1500);
    });
  });

  // فعال‌سازی کپی پاسخ
  const msgButtons = scopeEl.querySelectorAll(".z-copy-msg-btn");
  msgButtons.forEach(function(btn) {
    btn.addEventListener("click", async function() {
      const encoded = btn.getAttribute("data-text") || "";
      let plain = "";
      try {
        plain = decodeURIComponent(encoded);
      } catch (e) {
        plain = encoded;
      }

      const ok = await copyToClipboard(plain);
      btn.textContent = ok ? "کپی شد ✓" : "خطا";
      setTimeout(function() {
        btn.textContent = "کپی پاسخ";
      }, 1500);
    });
  });
}

// درج حباب پیام کاربر یا هوش مصنوعی
function appendMessage(role, text) {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  if (role === "assistant") {
    bubbleDiv.innerHTML = renderAssistantTextToHtml(text);

    const tools = document.createElement("div");
    tools.className = "z-msg-tools";
    tools.innerHTML = `<button class="z-copy-msg-btn" type="button" data-text="${encodeURIComponent(text)}">کپی پاسخ</button>`;
    msgDiv.appendChild(bubbleDiv);
    msgDiv.appendChild(tools);
  } else {
    bubbleDiv.innerText = text == null ? "" : String(text);
    msgDiv.appendChild(bubbleDiv);
  }

  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  if (role === "assistant") {
    wireCopyButtons(msgDiv);
  }
}

// ذخیره عنوان چت در حافظه محلی
function saveHistory(firstMessageText) {
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  const existing = history.find(function(h) {
    return h.id === currentSessionId;
  });

  if (!existing) {
    history.unshift({
      id: currentSessionId,
      title: String(firstMessageText).substring(0, 30) + (String(firstMessageText).length > 30 ? "..." : ""),
      date: new Date().toLocaleDateString("fa-IR"),
    });
    localStorage.setItem("zherf_chat_history", JSON.stringify(history));
    renderHistoryList();
  }
}

// نمایش لیست تاریخچه گفتگوها
function renderHistoryList() {
  const container = document.getElementById("historyList");
  if (!container) return;

  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:10px;">تاریخچه‌ای وجود ندارد</div>';
    return;
  }

  history.forEach(function(item) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "history-item";
    itemDiv.innerHTML = `
      <div class="history-text" onclick="loadChat('${item.id}')">${escapeHtml(item.title)}</div>
      <button class="delete-item-btn" type="button" onclick="deleteHistoryItem(event, '${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(itemDiv);
  });
}

// حذف یک مورد از سابقه
function deleteHistoryItem(event, id) {
  event.stopPropagation();
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  history = history.filter(function(h) {
    return h.id !== id;
  });
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));
  renderHistoryList();
}

// گفتگوی جدید
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

// بازخوانی یک گفتگوی قدیمی
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

// خواندن فایل به صورت متن
function readFileAsText(file) {
  return new Promise(function(resolve) {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function() {
      resolve(null);
    };
    reader.readAsText(file);
  });
}

// کنترل تایم‌اوت ۴۵ ثانیه‌ای
async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(function() {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ارسال و دریافت پیام
async function sendMessage() {
  if (isSending) return;
  isSending = true;

  const input = document.getElementById("userInput");
  if (!input) {
    isSending = false;
    return;
  }

  const userText = input.value.trim();
  const currentFile = attachedFile;

  if (!userText && !currentFile) {
    isSending = false;
    return;
  }

  // پیام نمایشی برای کاربر
  let displayMessage = userText;
  if (currentFile) {
    const fileLabel = `📎 [پیوست: ${currentFile.name}]`;
    displayMessage = userText ? `${fileLabel}\n${userText}` : fileLabel;
  }

  appendMessage("user", displayMessage);
  saveHistory(displayMessage);

  input.value = "";
  input.style.height = "auto";
  removeFile();

  const chatArea = document.getElementById("chatArea");
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message assistant";
  loadingMsg.id = "loadingMsg";
  loadingMsg.innerHTML = '<div class="bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> ژرف در حال اندیشیدن...</div>';
  chatArea.appendChild(loadingMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    let processedPrompt = userText;

    if (currentFile) {
      const isTextType =
        (currentFile.type && currentFile.type.startsWith("text/")) ||
        currentFile.name.match(/\.(txt|md|js|html|css|py|json|csv|xml|log|sh)$/i);

      if (isTextType) {
        const textContent = await readFileAsText(currentFile);
        if (textContent != null) {
          const rawFence = String.fromCharCode(96, 96, 96);
          processedPrompt = `[محتوای فایل پیوست شده "${currentFile.name}":]\n${rawFence}\n${String(textContent).slice(0, 8000)}\n${rawFence}\n\n${userText || "لطفاً این فایل را بررسی و تحلیل کن."}`;
        } else {
          processedPrompt = `[خطا در خواندن فایل متنی ${currentFile.name}]\n${userText}`;
        }
      } else if (currentFile.type && currentFile.type.startsWith("image/")) {
        processedPrompt = `[تصویر پیوست شد: ${currentFile.name} - فرمت: ${currentFile.type} - حجم: ${Math.round(currentFile.size / 1024)} کیلوبایت]\n${userText || "این تصویر را تحلیل کن."}`;
      } else if (currentFile.type && currentFile.type.startsWith("audio/")) {
        processedPrompt = `[فایل صوتی پیوست شد: ${currentFile.name} - حجم: ${Math.round(currentFile.size / 1024)} کیلوبایت]\n${userText || "این فایل صوتی را بررسی کن."}`;
      } else {
        processedPrompt = `[فایل پیوست شد: ${currentFile.name} - نوع: ${currentFile.type || "ناشناخته"}]\n${userText || "این سند را بررسی کن."}`;
      }
    }

    // فراخوانی اولیه
    const postResponse = await fetchWithTimeout(
      `${HF_ENGINE_URL}/gradio_api/call/zherf_chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [{ text: processedPrompt, files: [] }] }),
      },
      45000
    );

    if (!postResponse.ok) throw new Error(`خطای سرور: ${postResponse.status}`);

    const postData = await postResponse.json();
    const eventId = postData.event_id;
    if (!eventId) throw new Error("شناسه رویداد معتبر دریافت نشد");

    // دریافت استریم پاسخ
    const streamRes = await fetchWithTimeout(
      `${HF_ENGINE_URL}/gradio_api/call/zherf_chat/${eventId}`,
      {},
      45000
    );
    if (!streamRes.ok) throw new Error(`خطای دریافت استریم: ${streamRes.status}`);

    const rawData = await streamRes.text();
    let finalReply = "";

    const lines = rawData.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("data:")) {
        const payload = line.replace("data:", "").trim();
        try {
          const parsed = JSON.parse(payload);
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalReply = typeof parsed[0] === "string" ? parsed[0] : JSON.stringify(parsed[0]);
          } else if (typeof parsed === "string") {
            finalReply = parsed;
          } else if (parsed && typeof parsed === "object") {
            finalReply = parsed.text || JSON.stringify(parsed);
          }
        } catch (e) {
          if (payload && payload !== "null") finalReply = payload;
        }
      }
    }

    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();

    if (finalReply) {
      if (finalReply.startsWith('"') && finalReply.endsWith('"')) {
        try {
          finalReply = JSON.parse(finalReply);
        } catch (e) {}
      }
      appendMessage("assistant", finalReply);
    } else {
      appendMessage("assistant", "پاسخی از سمت مدل دریافت نشد. لطفاً مجدداً امتحان کنید.");
    }
  } catch (err) {
    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();

    if (err && err.name === "AbortError") {
      appendMessage("assistant", "⚠️ زمان اتصال به سرور هوش مصنوعی به پایان رسید. لطفاً وضعیت اینترنت را بررسی و مجدداً تلاش فرمایید.");
    } else {
      appendMessage("assistant", "⚠️ در حال حاضر ارتباط با سرور هوش مصنوعی برقرار نشد، لطفاً چند ثانیه دیگر دوباره امتحان کنید.");
    }
    console.error("خطای ارتباط با ژرف:", err);
  } finally {
    isSending = false;
  }
}

// اجرای اولیه هنگام لود صفحه
document.addEventListener("DOMContentLoaded", function() {
  renderHistoryList();
});
function setLanguage(lang) {
  document.querySelectorAll('.lang-content').forEach(el => el.classList.remove('active-lang'));
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));

  const targetContent = document.getElementById('content-' + lang);
  const targetBtn = document.getElementById('btn-' + lang);

  if (targetContent) targetContent.classList.add('active-lang');
  if (targetBtn) targetBtn.classList.add('active');
}
