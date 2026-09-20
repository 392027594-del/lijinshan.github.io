/* ============================================================
 * data.js —— Sanity 后台数据接入 + 页面行为
 * 本地兜底：页面内已写死 src 与文案，CMS 拉不到不影响展示。
 *
 * siteSettings 期望字段（Sanity 后台可编辑）：
 *   heroName / contactPhone / contactWechat / contactEmail
 *   works[]                        作品（顺序 = 页面顺序，hide=true 隐藏）
 *     .title / .hide
 *     .slots[]                     有序图片数组，按顺序填入页面 [data-slot]
 *       .asset -> path   .alt     .focus（object-position，如 "50% 30%"）
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

      /* 作品槽位：works[] 顺序展开，hide=true 跳过 */
      var works = (s.works || []).filter(function (w) { return !w.hide; });
      var slotEls = Array.prototype.slice.call(document.querySelectorAll("[data-slot]"));
      var flat = [];
      works.forEach(function (w) { (w.slots || []).forEach(function (sl) { flat.push(sl); }); });
      var n = Math.min(flat.length, slotEls.length);
      for (var i = 0; i < n; i++) {
        var url = imageUrl(flat[i].asset && flat[i].asset.path);
        if (!url) continue;
        var el = slotEls[i];
        var img = el.tagName === "IMG" ? el : el.querySelector("img");
        if (img) {
          img.src = url;
          if (flat[i].alt) img.alt = flat[i].alt;
          if (flat[i].focus) img.style.objectPosition = flat[i].focus;
        } else {
          el.style.backgroundImage = "url('" + url + "')";
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = flat[i].focus || "center";
        }
      }
    })
    .catch(function () {
      /* 静默失败：使用本地图片与文案 */
    });
})();
