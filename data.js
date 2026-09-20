/* ============================================================
 * data.js —— Sanity 后台数据接入（本地兜底：页面内已写死 src，拉不到不影响展示）
 * 逻辑：尝试读取 siteSettings.works[]（顺序 = 版块顺序），
 *       works[].slots[] 为有序图片数组，按顺序替换页面内 [data-slot] 槽位。
 * ============================================================ */
(function () {
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

  var QUERY = encodeURIComponent(
    '*[_type=="siteSettings"][0]{works[]{_key,title,slots[]{_key,asset->{path},alt}}}'
  );

  fetch(CDN + "?query=" + QUERY)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var works = data && data.result && data.result.works;
      if (!works || !works.length) return;
      // works[0] = 01 品牌设计（听粽），按顺序把 slots 填入 data-slot 槽位
      var slots = (works[0] && works[0].slots) || [];
      var keys = slots.map(function (s) { return s; });
      var slotEls = Array.prototype.slice.call(document.querySelectorAll("[data-slot]"));
      var n = Math.min(keys.length, slotEls.length);
      for (var i = 0; i < n; i++) {
        var url = imageUrl(keys[i].asset && keys[i].asset.path);
        if (!url) continue;
        var el = slotEls[i];
        var img = el.tagName === "IMG" ? el : el.querySelector("img");
        if (img) {
          img.src = url;
          if (keys[i].alt) img.alt = keys[i].alt;
        } else {
          el.style.backgroundImage = "url('" + url + "')";
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
        }
      }
    })
    .catch(function () {
      /* 静默失败：使用本地图片 */
    });
})();
