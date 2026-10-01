/**
 * موتور مرکزی تبلیغات ژرف AI (Zherf Ads Engine)
 * طراحی سبک، واکنش‌گرا و سئو شده با تگ‌های مجاز
 */

const ZHERF_ADS = [
  {
    id: "ad_book",
    badge: "کتاب رسمی",
    title: "AI؛ نقشه‌ای برای آینده",
    desc: "مطالعه نسخه رسمی اثر اسماعیل ریاحی در طاقچه",
    url: "https://taaghche.com/book/296988",
    rel: "sponsored noopener",
    target: "_blank"
  },
  {
    id: "ad_hosting",
    badge: "پیشنهاد سرور",
    title: "هاست و سرور ابری میهن‌وب‌هاست",
    desc: "بهترین انتخاب برای میزبانی وب و پردازش‌های هوش مصنوعی",
    url: "https://mihanwebhost.com/my/referrers_confirm.php?code=mwh-8b7c8",
    rel: "sponsored noopener",
    target: "_blank"
  },
  {
    id: "ad_reserve_1",
    badge: "محل تبلیغ شما",
    title: "جایگاه اختصاصی تبلیغات کسب‌وکار",
    desc: "جهت رزرو و معرفی محصولات خود کلیک کنید",
    url: "contact.html",
    rel: "nofollow",
    target: "_self"
  },
  {
    id: "ad_reserve_2",
    badge: "اسپانسرینگ",
    title: "فرصت همکاری و تبلیغ محصول",
    desc: "ارتباط با مدیریت و ثبت تبلیغ در صفحات پربازدید",
    url: "contact.html",
    rel: "nofollow",
    target: "_self"
  }
];

function renderZherfAds(containerId = "ads-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "promo-grid";

  ZHERF_ADS.forEach((ad) => {
    const card = document.createElement("a");
    card.href = ad.url;
    card.target = ad.target;
    card.rel = ad.rel;
    card.className = "promo-card" + (ad.url.includes("contact.html") ? " reserved" : "");
    card.innerHTML = `
      <span class="promo-badge">${ad.badge}</span>
      <span class="promo-title">${ad.title}</span>
      <span class="promo-desc">${ad.desc}</span>
    `;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

document.addEventListener("DOMContentLoaded", () => {
  renderZherfAds("ads-container");
});
