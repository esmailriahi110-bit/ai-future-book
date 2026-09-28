// ads.js - سیستم مدیریت مستقل و متمرکز تبلیغات و بنرهای هوش مصنوعی ژرف
const ZHERF_ADS = {
  topBanner: {
    enabled: true,
    html: `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; text-align: center; margin-bottom: 10px;">
        <span style="color: #facc15; font-weight: bold; font-size: 0.9rem;">⚡ پیشنهاد زیرساخت:</span>
        <span style="color: #e2e8f0; font-size: 0.85rem; margin-right: 5px;">هاست و سرور پایتون و هوش مصنوعی با ۹٪ تخفیف</span>
        <a href="https://mihanwebhost.com/my/referrers_confirm.php?code=mwh-8b7c8" target="_blank" rel="noopener nofollow" style="display: inline-block; background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; margin-top: 4px; margin-right: 8px;">مشاهده و خرید ↗</a>
      </div>
    `
  },
  bottomBanner: {
    enabled: true,
    html: `
      <div style="background: linear-gradient(135deg, #1e1b4b, #0f172a); border: 1px solid #818cf8; border-radius: 8px; padding: 10px; text-align: center; margin-top: 10px;">
        <span style="color: #38bdf8; font-weight: bold; font-size: 0.88rem;">📖 کتاب مرجع:</span>
        <span style="color: #cbd5e1; font-size: 0.85rem;">نسخه رسمی «AI؛ نقشه‌ای برای آینده» اثر اسماعیل ریاحی در طاقچه</span>
        <a href="https://taaghche.com/book/296988" target="_blank" rel="noopener" style="display: inline-block; background: #4f46e5; color: #fff; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 0.8rem; margin-top: 4px; margin-right: 8px;">دریافت از طاقچه 📚</a>
      </div>
    `
  }
};

function renderAds() {
  const top = document.getElementById('ad-slot-top');
  const bottom = document.getElementById('ad-slot-bottom');
  if (top && ZHERF_ADS.topBanner.enabled) top.innerHTML = ZHERF_ADS.topBanner.html;
  if (bottom && ZHERF_ADS.bottomBanner.enabled) bottom.innerHTML = ZHERF_ADS.bottomBanner.html;
}
