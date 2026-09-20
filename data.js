/* ============================================================
 * data.js —— 本地兜底 + Sanity 数据接入 + camera-zoom 滚动
 *
 * 文案：页面 [data-content="路径"] 占位，运行时注入。
 *   1) 同步注入 LOCAL（本地兜底，CMS 挂了也完整显示）
 *   2) 异步拉 Sanity，成功后深合并覆盖注入
 *   请求失败 → 保持 LOCAL，不白屏、不报错。
 *
 * 图片：[data-slot] 按 Sanity works[].slots[].name 精确匹配，
 *   无 name 的旧数据按顺序兜底；本地 src 永远是兜底图。
 *
 * 动画：GSAP ScrollTrigger（CDN），按 data-zoom 段落做
 *   camera-zoom 过渡。CDN 失败 / 减少动态偏好 / <768px /
 *   ?nozoom 时自动跳过 = 纯静态 PDF 还原版。
 *
 * siteSettings 期望字段：
 *   hero{ title, subtitle, description, roleCn, roleEn }
 *   contact{ phone, wechat, email }
 *   about{ jobs[]{ co, role, date, desc } }
 *   works[]{ title, description, year, hide, slots[]{ name, asset, alt, focus } }
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

  /* ---------- 本地兜底文案（与 PDF 逐字一致） ---------- */
  var LOCAL = {
    hero: {
      title: "视觉设计",
      subtitle: "三维/插画/版式",
      description: "As a visual brand designer this past year, I led multiple brand visual system upgrades, with select cases recognized by industry awards. By mastering AI-aided tools and motion design, I enhanced innovation and execution efficiency in brand storytelling",
      roleCn: "视觉设计师",
      roleEn: "Brand Visual designer"
    },
    contact: {
      phone: "18210265989",
      wechat: "a18210265989",
      email: "392027594@qq.com"
    },
    about: {
      jobs: [
        {
          co: "北京甜蜜点礼品有限公司",
          role: "产品视觉设计师",
          date: "2025.06-2025.10",
          desc: "公司作为盒马等大型商超线下鲜花礼品供货渠道，打造鲜花产品，包括但不限于各大节日节气（例如七夕节、情人节、中秋节、圣诞节、新年等）鲜花礼品、鲜花联名品等。"
        },
        {
          co: "央广优选供应链有限公司",
          role: "设计主管",
          date: "2024.04-2025.02",
          desc: "品牌视觉设计，根据公司产品研发，进行产品视觉研发，监督供应商产品生产落地，产品包括但不限于（中秋礼品、端午礼品、酒类）等其他产品。后期监督产落地，并为产品制作一系列推广视觉设计。"
        },
        { co: "东业兴吉（北京）文化传媒有限公司", role: "视觉设计师", date: "2019.08-2024.04", desc: "" },
        { co: "联想（北京）有限公司", role: "视觉设计师", date: "2017.08-2019.03", desc: "" }
      ]
    },
    works: [
      {
        title: "品牌设计",
        description: "As a visual brand designer this past year, I led multiple brand visual system upgrades, with select cases recognized by industry awards. By mastering AI-aided tools and motion design, I enhanced innovation and execution efficiency in brand storytelling.",
        year: "2025"
      }
    ]
  };

  /* ---------- 工具 ---------- */
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  /* 深合并：Sanity 值覆盖本地；空串/undefined 保留本地；数组按下标逐项合并 */
  function merge(base, over) {
    if (over === undefined || over === null || over === "") return base;
    if (Array.isArray(base) && Array.isArray(over)) {
      var n = Math.max(base.length, over.length), out = [];
      for (var i = 0; i < n; i++) out[i] = merge(base[i], over[i]);
      return out;
    }
    if (isObj(base) && isObj(over)) {
      var o = {};
      Object.keys(base).forEach(function (k) { o[k] = merge(base[k], over[k]); });
      Object.keys(over).forEach(function (k) { if (!(k in base)) o[k] = over[k]; });
      return o;
    }
    return over;
  }

  function getPath(obj, path) {
    var cur = obj;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur === undefined || cur === null) return undefined;
      cur = cur[parts[i]];
    }
    return typeof cur === "string" ? cur : undefined;
  }

  function injectText(tree) {
    var els = document.querySelectorAll("[data-content]");
    for (var i = 0; i < els.length; i++) {
      var v = getPath(tree, els[i].getAttribute("data-content"));
      if (v !== undefined) els[i].textContent = v;
    }
  }

  /* ---------- Sanity ---------- */
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

  /* ---------- 先用本地兜底立即渲染（无闪烁） ---------- */
  injectText(LOCAL);

  var QUERY = encodeURIComponent(
    '*[_type=="siteSettings"][0]{' +
    'hero{title,subtitle,description,roleCn,roleEn},' +
    'contact{phone,wechat,email},' +
    'about{jobs[]{co,role,date,desc}},' +
    'works[]{_key,title,description,year,hide,slots[]{_key,name,asset->{path},alt,focus}}}'
  );

  fetch(CDN + "?query=" + QUERY)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var s = data && data.result;
      if (!s) return;
      var tree = merge(LOCAL, s);
      injectText(tree);

      /* 图片槽位：按 name 精确匹配，顺序兜底 */
      var works = (tree.works || []).filter(function (w) { return !w.hide; });
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
      /* 静默失败：本地兜底已渲染 */
    });

  /* ---------- camera-zoom 滚动过渡 ---------- */
  /* 进入段：scale .94→1 / 透明度 .5→1；离开段反向；中段保持 scale 1 = PDF 像素还原。
     降级条件：GSAP 未加载 / 减少动态 / <768px / URL 带 ?nozoom */
  try {
    var noZoom = /[?&]nozoom/.test(location.search);
    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (window.gsap && window.ScrollTrigger && !noZoom && !reduced) {
      gsap.registerPlugin(ScrollTrigger);
      var mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", function () {
        var secs = document.querySelectorAll("[data-zoom]");
        Array.prototype.forEach.call(secs, function (sec) {
          gsap.fromTo(sec,
            { scale: 0.94, opacity: 0.5, transformOrigin: "50% 50%" },
            {
              scale: 1, opacity: 1, ease: "none", immediateRender: false,
              scrollTrigger: { trigger: sec, start: "top bottom", end: "top 15%", scrub: true }
            });
          gsap.fromTo(sec,
            { scale: 1, opacity: 1 },
            {
              scale: 0.94, opacity: 0.5, ease: "none", immediateRender: false,
              scrollTrigger: { trigger: sec, start: "bottom bottom", end: "bottom top", scrub: true }
            });
        });
      });
    }
  } catch (e) { /* 动画失败不影响页面 */ }
})();
