/**
 * Zherf AI Security & Integrity Shield
 * طراح و صاحب اثر: اسماعیل ریاحی (zherfai.ir)
 * لایه محافظت چندگانه: مسدودسازی دسترسی‌های غیرمجاز و ابزارهای استخراج
 */
(function() {
  'use strict';

  // ۱. غیرفعال‌سازی کلیک راست در سراسر صفحه
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, { capture: true });

  // ۲. مسدودسازی میانبرهای کیبورد متخصصین و مرورگر
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // کلیدهای ترکیبی با Ctrl یا Command در مک
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = (e.key || '').toLowerCase();

    if (isCtrl) {
      // Ctrl + U (مشاهده سورس)
      // Ctrl + S (ذخیره آفلاین)
      // Ctrl + P (پرینت و استخراج)
      if (key === 'u' || key === 's' || key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // کلیدهای ترکیبی با Shift (ابزارهای دولوپر)
      if (e.shiftKey) {
        // Ctrl + Shift + I (Inspect)
        // Ctrl + Shift + J (کنسول جاوااسکریپت)
        // Ctrl + Shift + C (انتخاب المان)
        if (key === 'i' || key === 'j' || key === 'c') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    }
  }, { capture: true });

  // ۳. جلوگیری از درگ کردن تصاویر و متن‌ها (Drag & Drop)
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // ۴. جلوگیری از کپی و برش مستقیم محتوا در صفحات محافظت‌شده
  document.addEventListener('copy', function(e) {
    // در صفحه چت اجازه داده می‌شود تا کاربر پاسخ هوش مصنوعی را کپی کند
    if (window.location.pathname.indexOf('chat.html') !== -1) {
      return true;
    }
  });

  // ۵. پیام آگاهی‌بخش و توحیدی در کنسول برای متخصصان کنجکاو
  try {
    const bannerStyle = 'color: #10b981; font-size: 16px; font-weight: bold; text-shadow: 0 0 8px rgba(16,185,129,0.5);';
    const textStyle = 'color: #94a3b8; font-size: 13px; line-height: 1.8;';
    
    console.clear();
    console.log('%c🔒 اکوسیستم دانش و فناوری ژرف AI', bannerStyle);
    console.log(
      '%cاین بستر ثمره تلاش شبانه‌روزی و قانونمند پژوهشگر اثر «اسماعیل ریاحی» است.\n' +
      'طبق قوانین ثابت آفرینش، ارزش واقعی در خلق و خدمت پایدار است، نه کپی‌برداری سطحی.\n' +
      'از اینکه با درستکاری و رعایت اخلاق حرفه‌ای به این حریم احترام می‌گذارید، سپاسگزاریم.\n' +
      'ارتباط رسمی: https://zherfai.ir/contact.html',
      textStyle
    );
  } catch(err) {}

  // ۶. مکانیزم خسته‌کننده ضد دیباگ برای جلوگیری از وارسی عمیق اسکریپت‌ها
  setInterval(function() {
    // این تابع باعث می‌شود اگر کسی Inspect را باز نگه دارد، اجرای کد متوقف شود
    const startTime = performance.now();
    debugger;
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      // توسعه‌دهنده در حال وارسی است
      console.clear();
    }
  }, 2000);

})();
