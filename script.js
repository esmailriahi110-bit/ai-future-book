// آدرس موتور فعال و رسمی هاگینگ‌فیس ژرف
const HF_ENGINE_URL = "https://esmailr-helektelek-engine.hf.space";
let currentSessionId = Date.now().toString();
let attachedFile = null;

// جلوگیری از ارسال همزمان (برای کاهش لگ و دوباره‌کاری)
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
  const file = event.target.files[0];
  if (file) {
    // کنترل سقف حجم فایل در فرانت‌اند (حداکثر ۱۰ مگابایت برای حفظ سرعت)
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
  div.innerText = text;
  return div.innerHTML;
}

// کپی به کلیپ‌بورد (با fallback برای موبایل/مرورگرهای قدیمی)
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}

  // fallback
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_) {
    return false;
  }
}

// ---------- Markdown سبک + کدباکس + کپی کد ----------
// هدف: بدون کتابخانه سنگین، فقط:
// 1)
```code```
// 2) لینک‌ها
// 3) خط جدید
function renderAssistantTextToHtml(text) {
  // ابتدا کل متن را escape می‌کنیم (امن)
  const safe = escapeHtml(text);

  // کدهای سه‌بک‌تیک
  const codeFence = /
```([\w+-]*)\n([\s\S]*?)
```/g;
  let html = safe.replace(codeFence, (m, lang, code) => {
    const langLabel = lang ? `<div class="z-code-lang">${escapeHtml(lang)}</div>` : "";
    // code اینجا escape شده است (چون از safe آمده)
    // برای کپی: نسخه raw لازم داریم -> از code escaped به متن برمی‌گردانیم با decode ساده در زمان کلیک
    return `
      <div class="z-code-block">
        ${langLabel}
        <pre><code>${code}</code></pre>
        <button class="z-copy-code-btn" type="button" data-code="${encodeURIComponent(code)}">کپی کد</button>
      </div>
    `;
  });

  // لینک‌ها (روی html موجود)
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  html = html.replace(urlRegex, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

  // خط جدید
  html = html.replace(/\n/g, "<br>");

  return html;
}

function wireCopyButtons(scopeEl) {
  if (!scopeEl) return;

  // کپی کد
  const codeBtns = scopeEl.querySelectorAll(".z-copy-code-btn");
  codeBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const encoded = btn.getAttribute("data-code") || "";
      let code = "";
      try { code = decodeURIComponent(encoded); } catch (_) { code = encoded; }

      // code الان escape شده نیست؟ این code از safe آمده و escaped است.
      // تبدیل escape HTML به متن واقعی برای کپی:
      const tmp = document.createElement("div");
      tmp.innerHTML = code.replace(/<br>/g, "\n");
      const plain = tmp.textContent || tmp.innerText || "";

      const ok = await copyToClipboard(plain);
      btn.textContent = ok ? "کپی شد" : "خطا";
      setTimeout(() => (btn.textContent = "کپی کد"), 1200);
    });
  });

  // کپی کل پاسخ
  const msgBtns = scopeEl.querySelectorAll(".z-copy-msg-btn");
  msgBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-text") || "";
      let plain = "";
      try { plain = decodeURIComponent(text); } catch(_) { plain = text; }
      const ok = await copyToClipboard(plain);
      btn.textContent = ok ? "کپی شد" : "خطا";
      setTimeout(() => (btn.textContent = "کپی پاسخ"), 1200);
    });
  });
}

// ---------- درج پیام ----------
// تغییر کلیدی: برای assistant از innerHTML امن استفاده می‌کنیم تا کدباکس/Markdown فعال شود.
// برای user همچنان innerText می‌ماند.
function appendMessage(role, text) {
  const chatArea = document.getElementById("chatArea");
  if (!chatArea) return;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "bubble";

  if (role === "assistant") {
    bubbleDiv.innerHTML = renderAssistantTextToHtml(text);

    // نوار ابزار (کپی پاسخ)
    const tools = document.createElement("div");
    tools.className = "z-msg-tools";
    tools.innerHTML = `
      <button class="z-copy-msg-btn" type="button" data-text="${encodeURIComponent(text)}">کپی پاسخ</button>
    `;

    msgDiv.appendChild(tools);
  } else {
    bubbleDiv.innerText = text; // امنیت کامل برای متن کاربر
  }

  msgDiv.appendChild(bubbleDiv);
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  // فعال‌سازی دکمه‌های کپی داخل همین پیام
  if (role === "assistant") wireCopyButtons(msgDiv);
}

// ذخیره عنوان چت در حافظه محلی مرورگر
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

// نمایش لیست تاریخچه گفتگوها در سایدبار
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

// حذف یک مورد از سابقه گفتگوها
function deleteHistoryItem(event, id) {
  event.stopPropagation();
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  history = history.filter(h => h.id !== id);
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));
  renderHistoryList();
}

// شروع گفتگوی جدید
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

// تابع کمکی برای خواندن فایل به صورت متن (برای اسناد، کدها، لاگ‌ها و ...)
function readFileAsText(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

// تابع کمکی برای خواندن فایل به صورت Base64 (برای تصاویر و صوت)
function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// کنترل تایم‌اوت جداگانه برای POST و STREAM (پایدارتر از یک تایم‌اوت کلی)
async function fetchWithTimeout(url, options = {}, timeoutMs = 45000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// تابع اصلی ارسال و دریافت پیام با پشتیبانی واقعی از فایل و کنترل وقفه
async function sendMessage() {
  if (isSending) return; // جلوگیری از دوبار ارسال
  isSending = true;

  const input = document.getElementById("userInput");
  if (!input) { isSending = false; return; }

  const userText = input.value.trim();
  const currentFile = attachedFile;

  if (!userText && !currentFile) { isSending = false; return; }

  // ۱. ساخت متن پیام برای نمایش در رابط کاربری
  let displayMessage = userText;
  if (currentFile) {
    const fileLabel = `📎 [پیوست: ${currentFile.name}]`;
    displayMessage = userText ? `${fileLabel}\n${userText}` : fileLabel;
  }

  appendMessage("user", displayMessage);
  saveHistory(displayMessage);

  // ریست کادر ورودی
  input.value = "";
  input.style.height = "auto";
  removeFile();

  // افزودن لودینگ با ظاهر هماهنگ
  const chatArea = document.getElementById("chatArea");
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "message assistant";
  loadingMsg.id = "loadingMsg";
  loadingMsg.innerHTML = '<div class="bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> ژرف در حال اندیشیدن...</div>';
  chatArea.appendChild(loadingMsg);
  chatArea.scrollTop = chatArea.scrollHeight;

  try {
    // ۲. استخراج محتوای واقعی فایل بر اساس نوع آن
    let processedPrompt = userText;

    if (currentFile) {
      const isTextType = currentFile.type.startsWith("text/") ||
        currentFile.name.match(/\.(txt|md|js|html|css|py|json|csv|xml|log|sh)$/i);

      if (isTextType) {
        const textContent = await readFileAsText(currentFile);
        if (textContent) {
          processedPrompt =
            `[محتوای فایل پیوست شده "${currentFile.name}":]\n` +
            `\`\`\`\n${String(textContent).slice(0, 8000)}\n\`\`\`\n\n` +
            `${userText || "لطفاً این فایل را بررسی و تحلیل کن."}`;
        } else {
          processedPrompt = `[خطا در خواندن فایل متنی ${currentFile.name}]\n${userText}`;
        }
      } else if (currentFile.type.startsWith("image/")) {
        // فعلاً متادیتا (تا بک‌اند Vision آماده شود)
        processedPrompt =
          `[تصویر پیوست شد: ${currentFile.name} - فرمت: ${currentFile.type} - حجم: ${Math.round(currentFile.size / 1024)} کیلوبایت]\n` +
          `${userText || "این تصویر را تحلیل کن (اگر بک‌اند تصویر فعال نیست، توضیح بده داخل تصویر چیست)."}`
      } else if (currentFile.type.startsWith("audio/")) {
        processedPrompt =
          `[فایل صوتی پیوست شد: ${currentFile.name} - حجم: ${Math.round(currentFile.size / 1024)} کیلوبایت]\n` +
          `${userText || "این فایل صوتی را بررسی کن (اگر STT فعال نیست، متنش را بنویس)."}`
      } else {
        processedPrompt =
          `[فایل پیوست شد: ${currentFile.name} - نوع: ${currentFile.type || "ناشناخته"}]\n` +
          `${userText || "این سند را بررسی کن."}`;
      }
    }

    // ۳. ارسال درخواست شروع فرایند به Gradio API (POST)
    const postResponse = await fetchWithTimeout(
      `${HF_ENGINE_URL}/gradio_api/call/zherf_chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{ text: processedPrompt, files: [] }]
        })
      },
      45000
    );

    if (!postResponse.ok) {
      throw new Error(`خطای سرور: ${postResponse.status}`);
    }

    const postData = await postResponse.json();
    const eventId = postData.event_id;

    if (!eventId) {
      throw new Error("شناسه رویداد معتبر دریافت نشد");
    }

    // ۴. دریافت استریم پاسخ بر اساس Event ID (GET)
    const streamRes = await fetchWithTimeout(
      `${HF_ENGINE_URL}/gradio_api/call/zherf_chat/${eventId}`,
      {},
      45000
    );

    if (!streamRes.ok) {
      throw new Error(`خطای دریافت استریم: ${streamRes.status}`);
    }

    const rawData = await streamRes.text();
    let finalReply = "";

    // تفکیک خطوط data: استریم Gradio
    const lines = rawData.split("\n");
    for (const line of lines) {
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
          if (payload && payload !== "null") {
            finalReply = payload;
          }
        }
      }
    }

    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();

    if (finalReply) {
      if (finalReply.startsWith('"') && finalReply.endsWith('"')) {
        try { finalReply = JSON.parse(finalReply); } catch (_) {}
      }
      appendMessage("assistant", finalReply);
    } else {
      appendMessage("assistant", "پاسخی از سمت مدل دریافت نشد. لطفاً مجدداً امتحان کنید.");
    }

  } catch (err) {
    const loadingElement = document.getElementById("loadingMsg");
    if (loadingElement) loadingElement.remove();

    if (err.name === "AbortError") {
      appendMessage("assistant", "⚠️ زمان اتصال به سرور هوش مصنوعی به پایان رسید. لطفاً وضعیت اینترنت را بررسی و مجدداً تلاش فرمایید.");
    } else {
      appendMessage("assistant", "⚠️ در حال حاضر ارتباط با سرور هوش مصنوعی برقرار نشد، لطفاً چند ثانیه دیگر دوباره امتحان کنید.");
    }
    console.error("خطای ارتباط با ژرف:", err);
  } finally {
    isSending = false;
  }
}

// بارگذاری تاریخچه به محض لود کامل صفحه
document.addEventListener("DOMContentLoaded", () => {
  renderHistoryList();
});
