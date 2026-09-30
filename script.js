const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const chatArea = document.getElementById('chatArea');
const promptInput = document.getElementById('promptInput');
const historyList = document.getElementById('historyList');
const mediaInput = document.getElementById('mediaInput');
const filePreview = document.getElementById('filePreview');
const fileNameSpan = document.getElementById('fileNameSpan');

let currentSessionId = Date.now().toString();
let attachedFile = null;

// کنترل باز و بسته شدن سایدبار
function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// تنظیم خودکار ارتفاع کادر متن
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// تشخیص کلید اینتر برای ارسال
function checkEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// انتخاب فایل توسط دکمه +
function handleFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;
  attachedFile = file;
  fileNameSpan.textContent = `📎 ${file.name}`;
  filePreview.style.display = 'flex';
}

// حذف فایل پیوست شده
function removeSelectedFile() {
  attachedFile = null;
  mediaInput.value = '';
  filePreview.style.display = 'none';
}

// جلوگیری از باگ کاراکترهای خطرناک
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// اضافه کردن پیام جدید به صفحه
function appendMessage(text, role, metaText) {
  const msg = document.createElement('div');
  msg.className = 'message ' + (role === 'user' ? 'user' : 'bot');
  
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br/>');
  msg.appendChild(bubble);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = metaText || '';
  msg.appendChild(meta);

  const id = 'msg_' + Math.random().toString(36).substring(2, 9);
  msg.id = id;
  
  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
  return id;
}

// ویرایش پیام (مثلاً تبدیل پیام در حال پردازش به جواب نهایی)
function updateMessage(id, text, metaText, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const bubble = el.querySelector('.bubble');
  const meta = el.querySelector('.meta');
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br/>');
  meta.textContent = metaText || '';
  meta.className = 'meta ' + (isError ? 'err' : '');
  chatArea.scrollTop = chatArea.scrollHeight;
}

// نمایش لیست گفتگوهای پیشین
function renderHistory() {
  let chats = JSON.parse(localStorage.getItem('zherf_chats') || '[]');
  historyList.innerHTML = '';
  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <span class="history-title" onclick="loadChat('${chat.id}')">💬 ${escapeHtml(chat.title)}</span>
      <button class="delete-chat-btn" onclick="deleteChat('${chat.id}', event)">✕</button>
    `;
    historyList.appendChild(item);
  });
}

// ذخیره چت در حافظه گوشی
function saveChatToStorage(userPrompt) {
  let chats = JSON.parse(localStorage.getItem('zherf_chats') || '[]');
  let currentChat = chats.find(c => c.id === currentSessionId);
  if (!currentChat) {
    currentChat = {
      id: currentSessionId,
      title: userPrompt.substring(0, 24) + (userPrompt.length > 24 ? '...' : ''),
      messages: []
    };
    chats.unshift(currentChat);
    localStorage.setItem('zherf_chats', JSON.stringify(chats));
    renderHistory();
  }
}

// حذف چت از تاریخچه
function deleteChat(id, e) {
  e.stopPropagation();
  let chats = JSON.parse(localStorage.getItem('zherf_chats') || '[]');
  chats = chats.filter(c => c.id !== id);
  localStorage.setItem('zherf_chats', JSON.stringify(chats));
  renderHistory();
  if (id === currentSessionId) {
    startNewChat();
  }
}

// شروع گفتگوی نو
function startNewChat() {
  currentSessionId = Date.now().toString();
  chatArea.innerHTML = `
    <div class="promo-grid">
      <a href="https://zherfai.ir/book" class="promo-card">
        <strong>📚 کتاب اختصاصی ژرف</strong>
        راهنمای جامع هوش مصنوعی و زندگی آینده
      </a>
      <a href="https://mihanwebhost.com" target="_blank" class="promo-card">
        <strong>🚀 هاست و سرور ابری</strong>
        با تخفیف ویژه کاربران ژرف AI
      </a>
      <a href="contact.html" class="promo-card">
        <strong>📢 جایگاه تبلیغاتی شما</strong>
        نمایش برند شما به هزاران کاربر فعال
      </a>
      <a href="contact.html" class="promo-card">
        <strong>💼 اسپانسری و همکاری</strong>
        رزرو جایگاه بنر و همکاری تجاری
      </a>
    </div>
    <div class="message bot">
      <div class="bubble">گفتگوی جدید آغاز شد. در چه زمینه‌ای می‌توانم کمکتان کنم؟</div>
      <div class="meta">ژرف AI آماده پاسخ‌گویی است</div>
    </div>
  `;
  if (sidebar.classList.contains('open')) {
    toggleSidebar();
  }
}

// بارگذاری یک چت از حافظه
function loadChat(id) {
  alert('این گفتگو قبلاً ثبت شده است. به زودی مرور پیام‌های گذشته فعال می‌شود.');
  toggleSidebar();
}

// تابع اصلی ارسال پیام به ورکر کلودفلر
async function sendMessage() {
  const text = promptInput.value.trim();
  if (!text && !attachedFile) return;

  let sendText = text;
  if (attachedFile) {
    sendText += `\n[فایل پیوست: ${attachedFile.name}]`;
  }

  appendMessage(sendText, 'user', 'ارسال شد');
  saveChatToStorage(text || attachedFile.name);
  
  promptInput.value = '';
  promptInput.style.height = 'auto';
  removeSelectedFile();

  const botMsgId = appendMessage('در حال پردازش و استخراج پاسخ...', 'bot', 'ژرف AI');

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text })
    });

    if (!response.ok) {
      throw new Error(`خطای سرور: ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.reply || 'پاسخی از سرور دریافت نشد.';
    updateMessage(botMsgId, replyText, 'ژرف AI - تکمیل شد');
  } catch (err) {
    updateMessage(botMsgId, 'متأسفانه در اتصال به ورکر خطایی رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.', 'عدم پاسخ‌گویی', true);
  }
}

// اجرای اولیه هنگام لود صفحه
window.addEventListener('DOMContentLoaded', () => {
  renderHistory();
});
