/* ============================================================
 * data.js —— Sanity 后台数据接入 + 页面行为
 * 本地兜底：页面内已写死 src 与文案，CMS 拉不到不影响展示。
 *
 * siteSettings 期望字段（Sanity 后台可编辑）：
 *   heroName / contactPhone / contactWechat / contactEmail
 *   works[]                        作品（顺序 = 页面顺序，hide=true 隐藏）
 *     .title / .hide
 *     .slots[]                     图片槽位（.name = 页面 data-slot 编号，按名匹配）
 *       .name  .asset -> path   .alt     .focus（object-position，如 "50% 30%"）
 * ============================================================ */
(function () {
  /* ---------- 移动端导航折叠 ---------- */
  var burger = document.getElementById("burger");
  var topbar = document.getElementById("topbar");
  if (burger && topbar) {
    burger.addEventListener("click", function () {
      var open = topbar.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    topbar.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && topbar.classList.contains("open")) {
        topbar.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Sanity 数据 ---------- */
  var PROJECT_ID = "4i3qoqt0";
  var DATASET = "production";
  var CDN = "https://" + PROJECT_ID + ".apicdn.sanity.io/v1/data/query/" + DATASET;
  var IMG = "https://cdn.sanity.io/images/" + PROJECT_ID + "/" + DATASET + "/";

  function imageUrl(ref) {
    if (!ref) return null;
    var m = /^image-(.+)-(\d+x\d+)-(\w+)$/.exec(ref);
    if (m) return IMG + m[1] + "-" + m[2] + "." + (m[3] === "png" ? "png" : "webp");
    return IMG + ref.replace(/^image-/, "").replace(/-(png|jpg|jpeg|webp)$/, ".webp");
  }

  function setText(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  var QUERY = encodeURIComponent(
    '*[_type=="siteSettings"][0]{' +
    'heroName,contactPhone,contactWechat,contactEmail,' +
    'works[]{_key,title,hide,slots[]{_key,asset->{path},alt,focus}}}'
  );

  fetch(CDN + "?query=" + QUERY)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var s = data && data.result;
      if (!s) return;

      /* 基础信息：联系区三组（标签按 PDF 原样固定） */
      if (s.contactPhone) setText(".contact .grp:nth-child(1) .val", s.contactPhone);
      if (s.contactWechat) setText(".contact .grp:nth-child(2) .val", s.contactWechat);
      if (s.contactEmail) setText(".contact .grp:nth-child(3) .val", s.contactEmail);

      /* 作品槽位：按槽位编号（name）精确匹配；无 name 的旧数据按顺序兜底 */
      var works = (s.works || []).filter(function (w) { return !w.hide; });
      var slotEls = Array.prototype.slice.call(document.querySelectorAll("[data-slot]"));
      var byName = {};
      var ordered = [];
      works.forEach(function (w) {
        (w.slots || []).forEach(function (sl) {
          ordered.push(sl);
          if (sl && sl.name) byName[sl.name] = sl;
        });
      });
      slotEls.forEach(function (el) {
        var sl = byName[el.getAttribute("data-slot")] || ordered.shift();
        if (!sl) return;
        var url = imageUrl(sl.asset && sl.asset.path);
        if (!url) return;
        var img = el.tagName === "IMG" ? el : el.querySelector("img");
        if (img) {
          img.src = url;
          if (sl.alt) img.alt = sl.alt;
          if (sl.focus) img.style.objectPosition = sl.focus;
        } else {
          el.style.backgroundImage = "url('" + url + "')";
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = sl.focus || "center";
        }
      });
    })
    .catch(function () {
      /* 静默失败：使用本地图片与文案 */
    });
})();
