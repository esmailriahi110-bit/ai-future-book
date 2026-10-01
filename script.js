const WORKER_URL = "https://zherf-proxy.esmailriahi110.workers.dev";
let currentSessionId = Date.now().toString();
let attachedFile = null;

// مدیریت باز و بسته شدن سایدبار
function toggleSidebar() GAPGPTMASKTOKENdzimprzkg6dX58X
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

// تنظیم خودکار ارتفاع textarea
function autoResize(textarea) GAPGPTMASKTOKENdzimprzkg6dX59X
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
}

// ارسال با اینتر
function handleKeyDown(event) GAPGPTMASKTOKENdzimprzkg6dX60X
  if (event.key === "Enter" && !event.shiftKey) GAPGPTMASKTOKENdzimprzkg6dX61X
    event.preventDefault();
    sendMessage();
  }
}

// انتخاب و حذف فایل
function handleFileSelect(event) GAPGPTMASKTOKENdzimprzkg6dX62X
  const file = event.target.files[0];
  if (!file) return;
  attachedFile = file;
  document.getElementById("fileName").textContent = file.name;
  document.getElementById("filePreview").style.display = "flex";
}

function removeFile() GAPGPTMASKTOKENdzimprzkg6dX63X
  attachedFile = null;
  document.getElementById("fileInput").value = "";
  const cameraInp = document.getElementById("cameraInput");
  if (cameraInp) cameraInp.value = "";
  document.getElementById("filePreview").style.display = "none";
}

// کپی کردن متن پیام
function copyText(btn) GAPGPTMASKTOKENdzimprzkg6dX64X
  const bubble = btn.closest(".msg-bubble");
  const clone = bubble.cloneNode(true);
  const copyBtn = clone.querySelector(".msg-copy-btn");
  if (copyBtn) copyBtn.remove();
  
  const text = clone.innerText.trim();
  navigator.clipboard.writeText(text).then(() => GAPGPTMASKTOKENdzimprzkg6dX65X
    btn.innerHTML = '<i class="fa fa-check"></i> کپی شد';
    setTimeout(() => GAPGPTMASKTOKENdzimprzkg6dX66X
      btn.innerHTML = '<i class="fa fa-copy"></i> کپی متن';
    }, 2000);
  });
}

function escapeHtml(text) GAPGPTMASKTOKENdzimprzkg6dX67X
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// درج پیام در چت
function appendMessage(role, text) GAPGPTMASKTOKENdzimprzkg6dX68X
  const chatArea = document.getElementById("chatArea");
  const isUser = role === "user";
  const row = document.createElement("div");
  row.className = `msg-row ${isUser ? "user" : "assistant"}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML = isUser ? '<i class="fa fa-user"></i>' : "ژ";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");

  if (!isUser) GAPGPTMASKTOKENdzimprzkg6dX69X
    const copyBtn = document.createElement("button");
    copyBtn.className = "msg-copy-btn";
    copyBtn.innerHTML = '<i class="fa fa-copy"></i> کپی متن';
    copyBtn.onclick = function () GAPGPTMASKTOKENdzimprzkg6dX70X
      copyText(this);
    };
    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(copyBtn);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatArea.appendChild(row);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ذخیره تاریخچه در حافظه مرورگر
function saveCurrentChat() GAPGPTMASKTOKENdzimprzkg6dX71X
  const chatArea = document.getElementById("chatArea");
  const firstUserMsg = chatArea.querySelector(".msg-row.user .msg-bubble");
  if (!firstUserMsg) return;

  const rawTitle = firstUserMsg.innerText.replace(/📎 \[.*?\]/g, "").trim();
  const title = rawTitle ? rawTitle.substring(0, 26) : "گفتگوی ژرف";
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");

  const existingIndex = history.findIndex(item => item.id === currentSessionId);
  const sessionData = GAPGPTMASKTOKENdzimprzkg6dX72X
    id: currentSessionId,
    title: title,
    html: chatArea.innerHTML,
    date: new Date().toLocaleDateString("fa-IR")
  };

  if (existingIndex > -1) GAPGPTMASKTOKENdzimprzkg6dX73X
    history[existingIndex] = sessionData;
  } else GAPGPTMASKTOKENdzimprzkg6dX74X
    history.unshift(sessionData);
  }

  if (history.length > 30) history.pop();
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));
  renderHistoryList();
}

// بازسازی لیست سایدبار
function renderHistoryList() GAPGPTMASKTOKENdzimprzkg6dX75X
  const historyList = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  historyList.innerHTML = "";

  if (history.length === 0) GAPGPTMASKTOKENdzimprzkg6dX76X
    historyList.innerHTML = '<div style="color:var(--text-muted);font-size:12px;text-align:center;padding:16px 0;">گفتگویی یافت نشد.</div>';
    return;
  }

  history.forEach(item => GAPGPTMASKTOKENdzimprzkg6dX77X
    const div = document.createElement("div");
    div.className = `history-item ${item.id === currentSessionId ? "active" : ""}`;
    div.innerHTML = `
      <div class="history-item-text" onclick="loadChat('${item.id}')">${escapeHtml(item.title)}</div>
      <button class="history-del-btn" onclick="deleteHistoryItem(event, '${item.id}')" title="حذف"><i class="fa fa-trash"></i></button>
    `;
    historyList.appendChild(div);
  });
}

// حذف یک مورد از سایدبار
function deleteHistoryItem(event, id) GAPGPTMASKTOKENdzimprzkg6dX78X
  event.stopPropagation();
  let history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  history = history.filter(item => item.id !== id);
  localStorage.setItem("zherf_chat_history", JSON.stringify(history));

  if (currentSessionId === id) GAPGPTMASKTOKENdzimprzkg6dX79X
    startNewChat();
  } else GAPGPTMASKTOKENdzimprzkg6dX80X
    renderHistoryList();
  }
}

// گفتگوی جدید
function startNewChat() GAPGPTMASKTOKENdzimprzkg6dX81X
  currentSessionId = Date.now().toString();
  removeFile();
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = `
    <div class="ads-container" id="adsContainer">
      <a href="https://taaghche.com/book/296988/AI%D8%9B-%D9%86%D9%82%D8%B4%D9%87-%D8%A7%DB%8C-%D8%A8%D8%B1%D8%A7%DB%8C-%D8%A2%DB%8C%D9%86%D8%AF%D9%87" target="_blank" class="ad-card highlight">
        <i class="fa-solid fa-book-open"></i>
        <span>کتاب در طاقچه</span>
      </a>
      <a href="https://mihanwebhost.com/my/referrers_confirm.php?code=mwh-8b7c8" target="_blank" class="ad-card highlight">
        <i class="fa-solid fa-server"></i>
        <span>میهن وب‌هاست</span>
      </a>
      <a href="contact.html" class="ad-card">
        <i class="fa-solid fa-bullhorn"></i>
        <span>جایگاه تبلیغاتی</span>
      </a>
      <a href="contact.html" class="ad-card">
        <i class="fa-solid fa-handshake"></i>
        <span>اسپانسرینگ</span>
      </a>
    </div>
    <div class="msg-row assistant">
      <div class="msg-avatar">ژ</div>
      <div class="msg-bubble">
        سلام! من ژرف AI هستم؛ دستیار هوشمند شما. چطور می‌توانم کمکتان کنم؟
      </div>
    </div>
  `;
  renderHistoryList();
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) toggleSidebar();
}

// بارگذاری گفتگوی انتخاب شده
function loadChat(id) GAPGPTMASKTOKENdzimprzkg6dX82X
  const history = JSON.parse(localStorage.getItem("zherf_chat_history") || "[]");
  const session = history.find(item => item.id === id);
  if (!session) return;

  currentSessionId = session.id;
  document.getElementById("chatArea").innerHTML = session.html;
  renderHistoryList();
  toggleSidebar();
}

// ارسال پیام به کلودفلر ورکر
async function sendMessage() GAPGPTMASKTOKENdzimprzkg6dX83X
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text && !attachedFile) return;

  let displayMsg = text;
  if (attachedFile) GAPGPTMASKTOKENdzimprzkg6dX84X
    displayMsg += `\n📎 [پیوست: ${attachedFile.name}]`;
  }

  appendMessage("user", displayMsg);
  input.value = "";
  input.style.height = "auto";

  const tempFile = attachedFile;
  removeFile();

  // حذف بنر تبلیغات جهت تمرکز بر چت
  const ads = document.getElementById("adsContainer");
  if (ads) ads.style.display = "none";

  // پیام بارگذاری
  const chatArea = document.getElementById("chatArea");
  const loadingRow = document.createElement("div");
  loadingRow.className = "msg-row assistant";
  loadingRow.id = "tempLoading";
  loadingRow.innerHTML = `
    <div class="msg-avatar">ژ</div>
    <div class="msg-bubble"><i class="fa fa-spinner fa-spin"></i> در حال پردازش و پاسخ...</div>
  `;
  chatArea.appendChild(loadingRow);
  chatArea.scrollTop = chatArea.scrollHeight;

  try GAPGPTMASKTOKENdzimprzkg6dX85X
    const response = await fetch(WORKER_URL, GAPGPTMASKTOKENdzimprzkg6dX86X
      method: "POST",
      headers: GAPGPTMASKTOKENdzimprzkg6dX87X "Content-Type": "application/json" },
      body: JSON.stringify(GAPGPTMASKTOKENdzimprzkg6dX88X
        prompt: text,
        fileName: tempFile ? tempFile.name : null
      })
    });

    const data = await response.json();
    loadingRow.remove();

    const reply = data.reply || (data.choices && data.choices[0].message.content) || data.result || "پاسخی از سرور دریافت نشد.";
    appendMessage("assistant", reply);
    saveCurrentChat();
  } catch (err) GAPGPTMASKTOKENdzimprzkg6dX89X
    loadingRow.remove();
    appendMessage("assistant", "خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کرده و مجدداً تلاش کنید.");
  }
}

// اجرای اولیه بعد از لود کامل صفحه
document.addEventListener("DOMContentLoaded", () => GAPGPTMASKTOKENdzimprzkg6dX90X
  renderHistoryList();
});
