/**
 * سیستم مدیریت مرکزی تبلیغات ژرف (Zherf Ads Engine)
 * برای تغییر تبلیغات سایت، فقط اطلاعات این فایل را ویرایش کنید.
 */
const ZHERF_ADS = [
  {
    id: "ad_1",
    title: "کتاب AI؛ نقشه‌ای برای آینده",
    desc: "نسخه رسمی در طاقچه",
    badge: "مطالعه فوری",
    badgeClass: "badge-green",
    link: "https://taaghche.com/book/296988/AI%D8%9B-%D9%86%D9%82%D8%B4%D9%87-%D8%A7%DB%8C-%D8%A8%D8%B1%D8%A7%DB%8C-%D8%A2%DB%8C%D9%86%D8%AF%D9%87",
    rel: "sponsored noopener"
  },
  {
    id: "ad_2",
    title: "هاست پایتون و سرور ابری",
    desc: "تخفیف اختصاصی ویژه اعضا",
    badge: "کد تخفیف",
    badgeClass: "badge-blue",
    link: "/contact.html",
    rel: "sponsored noopener"
  },
  {
    id: "ad_3",
    title: "محل تبلیغ شما (رزرو جایگاه)",
    desc: "نمایش هوشمند به هزاران بازدیدکننده",
    badge: "پذیرش آگهی",
    badgeClass: "badge-orange",
    link: "/contact.html",
    rel: "nofollow"
  },
  {
    id: "ad_4",
    title: "محل تبلیغ شما (رزرو جایگاه)",
    desc: "همکاری تجاری و معرفی ابزارها",
    badge: "پذیرش آگهی",
    badgeClass: "badge-orange",
    link: "/contact.html",
    rel: "nofollow"
  }
];

function renderZherfAds(containerId = "ads-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ZHERF_ADS.map(ad => `
    <a href="${ad.link}" target="_blank" rel="${ad.rel}" class="ad-card" id="${ad.id}">
      <div class="ad-badge ${ad.badgeClass}">${ad.badge}</div>
      <div class="ad-content">
        <strong class="ad-title">${ad.title}</strong>
        <span class="ad-desc">${ad.desc}</span>
      </div>
    </a>
  `).join('');
}

document.addEventListener("DOMContentLoaded", () => renderZherfAds());
