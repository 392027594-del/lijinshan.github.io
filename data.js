/* ============================================================
 * data.js —— 本地兜底 + Sanity 全量文案接入 + Zoom v2 场景动画
 *
 * 文案：页面 [data-content="路径"] 占位，运行时注入。
 *   1) 同步注入 LOCAL（本地兜底 = PDF 原文，CMS 挂了也完整显示）
 *   2) 异步拉 Sanity，成功后深合并覆盖注入
 *   请求失败 → 保持 LOCAL，不白屏、不报错。
 * 注入规则：
 *   数组        → Portable Text 渲染（支持加粗/斜体/下划线/链接/列表）
 *   字符串含 \n → 转义后 \n 换 <br>
 *   其余        → textContent（安全注入）
 *
 * 图片：[data-slot] 按 Sanity works[].slots[].name 精确匹配，
 *   无 name 的旧数据按顺序兜底；本地 src 永远是兜底图。
 *
 * 动画 Zoom v2：
 *   段落级（data-zoom）保留 v1 进出场手感；
 *   场景级（data-scene）每个场景独立进出场 + 图文分离——
 *   图片场景（data-imgzoom）内图片额外缓慢缩小（镜头纵深感），
 *   文字不做自身缩放（保证中文始终清晰可读）；
 *   桌面强动效 / 移动端弱动效（仅淡入 + 轻缩放）。
 *   降级条件：GSAP 未加载 / 减少动态偏好 / ?nozoom。
 *
 * siteSettings 期望字段（v3.0）：
 *   navigation{ brand, menu[], top, dir[]{ cn, en, num } }
 *   catalog{ left, right }
 *   hero{ title, subtitle, description, roleCn, roleEn,
 *         decoInitial, decoLine1, decoLine2, please }
 *   contact{ phone, wechat, email, labels[] }
 *   about{ jobs[]{ co, role, date, desc, ptnum[], pt[] } }
 *   works[]{ number, title, subtitle, description, year, yearring, hide,
 *            mininav[]{ cn, en },
 *            blocks[]{ key, title, subtitle, body(富文本), items[] },
 *            slots[]{ name, asset, alt, focus } }
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
    navigation: {
      pageTitle: "李金山 · 视觉设计作品集",
      brand: "LI JINSHAN",
      menu: ["目录", "01 品牌设计", "02 主视觉KV", "03 视觉&版式", "04 字体设计"],
      top: "TOP ↑",
      dir: [
        { cn: "品牌设计", en: "Brand design", num: "01" },
        { cn: "主视觉KV设计", en: "Main visual KV design", num: "02" },
        { cn: "视觉&版式", en: "Visual&Layout", num: "03" },
        { cn: "字体设计", en: "Font Design", num: "04" }
      ]
    },
    catalog: {
      left: "@DESIGN CATALOG",
      right: "Brand&Visual Design"
    },
    hero: {
      title: "视觉设计",
      subtitle: "三维/插画/版式",
      description: "As a visual brand designer this past year, I led multiple brand visual system upgrades, with select cases recognized by industry awards. By mastering AI-aided tools and motion design, I enhanced innovation and execution efficiency in brand storytelling",
      roleCn: "视觉设计师",
      roleEn: "Brand Visual designer",
      decoInitial: "C",
      decoLine1: "ONTACT",
      decoLine2: "INFORMATION",
      please: "Please Enjoy"
    },
    contact: {
      labels: ["Mobile Phone", "Wechat", "Mobile Phone"],
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
          desc: "品牌视觉设计，根据公司产品研发，进行产品视觉研发，监督供应商产品生产落地，产品包括但不限于（中秋礼品、端午礼品、酒类）等其他产品。后期监督产落地，并为产品制作一系列推广视觉设计。",
          ptnum: ["01", "02", "03"],
          pt: [
            "前期对接供应商，现场确认物料产品细节，对产品结果负责，并跟进打样环节，后期确认大货，监督包装生产流程，确保产品无误。",
            "线上线下海报宣传，针对产品进行推广设计，包括但不限于移动端运营位海报设计，产品详情页、折页、其他渠道推广设计等，围绕着产品进行一系列设计工作。",
            "开展公司其他设计工作，包括不限于节日宣发海报，公司门头标志设计，朋友圈海报，微信小程序界面设计等公司其他工作。配合公司工作调整，进行不同种类设计工作。"
          ]
        },
        { co: "东业兴吉（北京）文化传媒有限公司", role: "视觉设计师", date: "2019.08-2024.04", desc: "" },
        { co: "联想（北京）有限公司", role: "视觉设计师", date: "2017.08-2019.03", desc: "" }
      ]
    },
    works: [
      {
        number: "01",
        title: "品牌设计",
        subtitle: "BRAND DESIGN",
        description: "As a visual brand designer this past year, I led multiple brand visual system upgrades, with select cases recognized by industry awards. By mastering AI-aided tools and motion design, I enhanced innovation and execution efficiency in brand storytelling.",
        year: "2025",
        yearring: "2025 2025 2025 2025",
        mininav: [
          { cn: "主视觉KV设计", en: "Main Visual KV Design" },
          { cn: "", en: "" },
          { cn: "视觉&版式", en: "Visual&Layout" },
          { cn: "字体设计", en: "Font Design" }
        ],
        blocks: {
          projectid: { body: "TINGZONG\nBRAND&PACKAGING DESIGN\n听粽品牌&包装设计" },
          tags: { items: ["品牌策划", "标识设计", "视觉设计", "包装设计"] },
          background: {
            title: "项目背景",
            body: "随着消费者对生活和品质与文化的不断追求，粽子市场从单纯的\"节日刚需\"转向\"情感消费+日常零食\"的转型期，近年来，突出高端化（礼盒装市场份额快速攀升，消费者愿为文化附加值买单）年轻化（设计需兼顾传统节庆符号与潮流表达）等等，所以该项目要打造具有文化内涵与年轻化的双重需求，建立长期价值。"
          },
          goal: {
            title: "项目目标",
            body: "解决市场痛点：打破\"传统=陈旧\"\"潮流=浮夸\"，构建传统与现代结合的视觉风格。提升品牌知名度，吸引年轻化客户。"
          },
          summary: {
            title: "总结",
            body: "在竞争加剧与消费升级的双重驱动下，从传统文化入手去挖掘，需通过文化厚度角度进行思考设计，为消费者带来全新的美学与情感体验，本项目将以此为目标，重塑品牌视觉。"
          },
          keywords: { title: "品牌关键词", items: ["年轻化", "传统与现代结合", "国风"] },
          positioning: {
            title: "品牌定位",
            body: "面向 20 到 40 岁的年轻与中年群体，传统文化与现代视觉融合，打造具有视觉冲击力与体现传统文化的产品，设计灵感来源于古画作【清 清院本 十二月令图轴 五月绢本设色】，将元素提炼出来，名称融入与\"听\"相结合的概念，打破常规，表达文化理念，帮助打造传统与现代结合的产品。"
          },
          philosophy: {
            title: "品牌理念",
            body: "解构千年文化中的无声诗画，将古卷中的气韵、留白、笔墨转化为现代视觉语言，让年轻一代在喧嚣中\"听见\"传统文化的呼吸，让中年群体在传承中\"看见\"当代美学的觉醒。做一座横跨时空的文化桥梁，让传统不沉默，让创新不浮夸。"
          },
          visualbrand: { title: "品牌视觉设计", subtitle: "Visual Brand\nDesign" },
          logodesign: {
            title: "标志设计",
            subtitle: "LOGO DESIGN",
            body: "听粽的标志设计，在图形上以中式方形框架为基础，融入粽叶元素，粽叶在视觉上以长条形为主，所以根据粽叶形态，字体设计同样采样修长字体，视觉上突出轻盈与秀丽，风格简约，融入文化内涵与现代审美，传递出和谐的品牌理念。\n字体部分，\"听\"字笔画采取粽叶末端形状，体现品牌特点，选用无衬线体，易于延展与识别，突出品牌特点。"
          },
          auxgraphics: {
            title: "辅助图形&品牌色",
            subtitle: "AUXILIARY GRAPHICS&BRAND COLORS",
            body: "辅助图形提取传统吉祥纹样，包括如意纹、长寿锁纹，事事如意纹，莲花纹，将传统纹样融入品牌当中，体现产品吉祥与美好的寓意，搭配中国古代传统颜色，与纹样遥相呼应。"
          },
          colorspecs: {
            items: [
              "36724A\nCMYK：81 47 84 7\nRGB：54 114 74",
              "B45732\nCMYK：36 77 88 2\nRGB：180 87 50",
              "B37533\nCMYK：37 61 89 0\nRGB：179 117 51",
              "566B30\nCMYK：72 51 100 12\nRGB：86 107 48",
              "ECDBC1\nCMYK：10 16 26 0\nRGB：236 219 193",
              "FFF6ED\nCMYK：0 6 8 0\nRGB：255 246 237"
            ]
          },
          brandvision: { title: "品牌视觉", subtitle: "BRAND VISION" },
          boatpattern: {
            title: "龙舟图案提取",
            subtitle: "LOONG BOAT PATTERN EXTRACTION",
            body: "产品不仅仅是当代年轻人的产品，更是透出人文气息的产品。将传统文化与现代美学相结合，为消费者带来新一代的中式美学。"
          },
          kitepattern: {
            title: "风筝图案提取",
            subtitle: "KITE PATTERN",
            body: "结合传统风筝纹样，端午节正值风筝季节。彩鸾云里剪飞絮，双双风鹤舞初春。"
          },
          textextraction: {
            title: "文案提取",
            subtitle: "TEXT EXTRACTION",
            body: "根据品牌特点，结合品\"声\"的寓意，进行品牌广告语提炼，提取古代诗词句式，进行归纳，在不失传统文化的调性下，进行创作。"
          },
          poems: {
            items: [
              "听风裹叶绿\u2003叶底江河涌",
              "粽声沸\u2003乡音归", "粽叶轻启",
              "叩古韵\u2003品新声", "叶间藏音",
              "叶簌语\u2003香润耳", "声沸唐宋",
              "传情响\u2003听团圆", "慢嚼古韵"
            ]
          },
          showcase: { items: ["物料设计展示", "物料设计展示", "物料设计展示", "物料设计展示", "物料设计展示"] },
          epilogue: {
            body: "Listen as the wind swathes the leaves in lush green, beneath which rivers of memory surge; the vibrant echoes of zongzi resound, familiar hometown voices returns—tapping into ancient rhythms while savoring new melodies. Leaves whisper their secrets, scent caresses the ear, feelings resonate in melody—hear the call of reunion."
          }
        }
      }
    ]
  };

  /* ---------- 工具 ---------- */
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Portable Text（ES5）渲染器：段落/标题/列表 + 加粗/斜体/下划线/链接 */
  function renderPT(blocks) {
    function span(c, markDefs) {
      var t = escHtml(c.text || "");
      var marks = c.marks || [];
      for (var k = 0; k < marks.length; k++) {
        var mk = marks[k];
        if (mk === "strong") t = "<strong>" + t + "</strong>";
        else if (mk === "em") t = "<em>" + t + "</em>";
        else if (mk === "underline") t = "<u>" + t + "</u>";
        else if (markDefs && markDefs[mk]) {
          var d = markDefs[mk];
          if (d && d._type === "link" && d.href) {
            t = '<a href="' + escHtml(d.href) + '" target="_blank" rel="noopener">' + t + "</a>";
          }
        }
      }
      return t;
    }
    var out = "", listTag = null;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!b || b._type !== "block" || !b.children) continue;
      var md = {};
      if (b.markDefs) {
        for (var m = 0; m < b.markDefs.length; m++) md[b.markDefs[m]._key] = b.markDefs[m];
      }
      var kids = "";
      for (var j = 0; j < b.children.length; j++) kids += span(b.children[j], md);
      var st = b.style || "normal";
      if (st === "bullet" || st === "number") {
        var tag = st === "bullet" ? "ul" : "ol";
        if (listTag !== tag) {
          if (listTag) out += "</" + listTag + ">";
          out += "<" + tag + ">";
          listTag = tag;
        }
        out += "<li>" + kids + "</li>";
      } else {
        if (listTag) { out += "</" + listTag + ">"; listTag = null; }
        if (st === "h2") out += "<h2>" + kids + "</h2>";
        else if (st === "h3") out += "<h3>" + kids + "</h3>";
        else if (st === "h4") out += "<h4>" + kids + "</h4>";
        else if (st === "blockquote") out += "<blockquote>" + kids + "</blockquote>";
        else out += "<p>" + kids + "</p>";
      }
    }
    if (listTag) out += "</" + listTag + ">";
    return out;
  }

  /* 深合并：Sanity 值覆盖本地；空串/undefined/空数组保留本地；数组按下标逐项合并 */
  function merge(base, over) {
    if (over === undefined || over === null || over === "") return base;
    if (Array.isArray(over) && over.length === 0) return base;
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
    return cur;
  }

  /* 注入规则：数组→富文本渲染；含 \n 字符串→转义+<br>；其余→textContent */
  function setValue(el, v) {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) { el.innerHTML = renderPT(v); return; }
    if (isObj(v)) return;
    var s = String(v);
    if (s.indexOf("\n") > -1) el.innerHTML = escHtml(s).replace(/\n/g, "<br>");
    else el.textContent = s;
  }

  function injectText(tree) {
    var els = document.querySelectorAll("[data-content]");
    for (var i = 0; i < els.length; i++) {
      var v = getPath(tree, els[i].getAttribute("data-content"));
      if (v !== undefined) setValue(els[i], v);
    }
  }

  /* ---------- Sanity ---------- */
  var PROJECT_ID = "4i3qoqt0";
  var DATASET = "production";
  var CDN = "https://" + PROJECT_ID + ".apicdn.sanity.io/v1/data/query/" + DATASET;
  var IMG = "https://cdn.sanity.io/images/" + PROJECT_ID + "/" + DATASET + "/";

  function imageUrl(ref) {
    if (!ref) return null;
    /* 槽位查询取的是 asset.path（形如 images/<项目>/<数据集>/xxx.png）→ 直接拼 CDN 根 */
    if (/^images\//.test(ref)) return "https://cdn.sanity.io/" + ref;
    var m = /^image-(.+)-(\d+x\d+)-(\w+)$/.exec(ref);
    if (m) return IMG + m[1] + "-" + m[2] + "." + (m[3] === "png" ? "png" : "webp");
    return IMG + ref.replace(/^image-/, "").replace(/-(png|jpg|jpeg|webp)$/, ".webp");
  }

  /* ---------- 先用本地兜底立即渲染（无闪烁） ---------- */
  injectText(LOCAL);

  var QUERY = encodeURIComponent(
    '*[_type=="siteSettings"][0]{' +
    'navigation{brand,pageTitle,top,menu,dir[]{cn,en,num}},' +
    'catalog{left,right},' +
    'hero{title,subtitle,description,roleCn,roleEn,decoInitial,decoLine1,decoLine2,please},' +
    'contact{phone,wechat,email,labels},' +
    'about{jobs[]{co,role,date,desc,ptnum,pt}},' +
    'works[]{_key,number,title,subtitle,description,year,yearring,hide,' +
    'mininav[]{cn,en},blocks[]{_key,key,title,subtitle,body,items},' +
    'slots[]{_key,name,image{asset->{path}},alt,focus}}}'
  );

  fetch(CDN + "?query=" + QUERY)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var s = data && data.result;
      if (!s) return;
      /* works[].blocks 由「数组」归一化为「按 key 的对象」，与 data-content 路径对应 */
      if (s.works) {
        s.works.forEach(function (w) {
          if (w && Array.isArray(w.blocks)) {
            var map = {};
            w.blocks.forEach(function (b) { if (b && b.key) map[b.key] = b; });
            w.blocks = map;
          }
        });
      }
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
        var assetRef = sl.image && sl.image.asset;
        var url = imageUrl(assetRef && assetRef.path);
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

  /* ---------- 顶部导航当前章节高亮（无动画，纯状态切换） ---------- */
  try {
    var menuLinks = {};
    Array.prototype.forEach.call(document.querySelectorAll(".topbar .menu a"), function (a) {
      var h = a.getAttribute("href");
      if (h && h.charAt(0) === "#") menuLinks[h] = a;
    });
    var watched = [];
    Object.keys(menuLinks).forEach(function (k) {
      var sec = document.querySelector(k);
      if (sec) watched.push(sec);
    });
    function setActive(id) {
      Object.keys(menuLinks).forEach(function (k) {
        if (k === id) menuLinks[k].classList.add("active");
        else menuLinks[k].classList.remove("active");
      });
    }
    if ("IntersectionObserver" in window && watched.length) {
      var current = null;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) current = "#" + en.target.id;
        });
        if (current) setActive(current);
      }, { rootMargin: "-45% 0px -45% 0px" });
      watched.forEach(function (sec) { io.observe(sec); });
    }
  } catch (e) { /* 高亮失败不影响页面 */ }

  /* ---------- Camera 观看模式 v2：分层呼吸 ----------
     摄影机保持相对稳定，排版随观看焦点呼吸（The Brand Identity 式浏览感）：
     - Scene 容器本身不做整体缩放——避免图片继承文字变化、文字继承图片变化
     - Image Layer（图片槽位/色块/装饰水印）：imageScale 1 → 0.97，几乎稳定
     - Text Layer（标题/正文/标签）：textScale 0.94 → 1.16，明显呼吸
     - 两层参数相互独立，不叠加任何补偿公式
     - 超高 Scene（高度 > 1.6 屏，如长卷/拼贴墙）只做淡入，不缩放——
       避免缩放轴落在屏幕外造成可见内容偏移
     - 纯 transform/opacity，不改文档流；URL 加 ?nocamera=1 可关闭 */
  try {
    var reducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!/[?&]nocamera=1/.test(location.search) && !reducedMotion) {
      document.documentElement.classList.add("camera-on");
      /* 文字层：信息文字（标题/正文/标签/元信息），紧耦合组以组为单位呼吸。
         锚点动态判定：贴左缘（x0 < 64px）的文字用 left center 锚（字号感放大、
         左缘不动、向右扩展）；其余用 center center。避免放大时块级文字左溢出屏。
         首帧未缩放时测量一次并缓存；resize 时清空 transform 重测。 */
      var CAM_TEXT = ".hero-t, .hero-s, .hero-b, .contact .grp, .home-top .role, " +
        ".please, .dir .it, .job .co, .job .meta, .job .desc, .job .pt, " +
        ".giant, .cn-t, .en-t, .mini-nav .it, .bio, " +
        ".tt2, .tt3, .big-t, .big-e, .h, .para, .labels > div, .cc, " +
        ".spec, .poems .main, .poems .it, .tag-box, .poem-en";
      /* 图片层：图片槽位 + 色块 + 装饰水印，只做轻微缩放（幅度小，统一 center 锚） */
      var CAM_IMG = "[data-slot], .wm25-stair, .wm25-col, .wm25-left, .ring, " +
        ".deco-c, .sw .blk, .bigsw";
      var isNarrow = Math.min(window.innerWidth, document.documentElement.clientWidth) < 768;
      var IMG_SHRINK = isNarrow ? 0.015 : 0.03;   /* 图片 1 → 0.985 / 0.97 */
      var TXT_BOTTOM = isNarrow ? 0.97 : 0.94;    /* 文字最远端 */
      var TXT_AMP    = isNarrow ? 0.13 : 0.22;    /* 呼吸幅度 → 1.10 / 1.16 */
      var anchorTexts = function (list) {
        return Array.prototype.map.call(list, function (tx) {
          return { el: tx, left: tx.getBoundingClientRect().left < 64 };
        });
      };
      var scenes = [];
      Array.prototype.forEach.call(document.querySelectorAll("[data-scene]"), function (el) {
        var texts = anchorTexts(el.querySelectorAll(CAM_TEXT));
        var imgs = Array.prototype.slice.call(el.querySelectorAll(CAM_IMG));
        scenes.push({ el: el, texts: texts, imgs: imgs, zoom: null });
      });
      var camTick = function () {
        var vh = window.innerHeight || 1;
        scenes.forEach(function (s) {
          var r = s.el.getBoundingClientRect();
          if (r.bottom < -vh || r.top > vh * 2) return;
          if (s.zoom === null) s.zoom = r.height <= vh * 1.6;   /* 首次测量后缓存 */
          var center = r.top + r.height / 2;
          if (s.zoom) {
            var denom = vh / 2 + r.height / 2;
            var t = Math.max(-1, Math.min(1, (vh / 2 - center) / denom));
            var a = t < 0 ? -t : t;
            a = a * a * (3 - 2 * a);                 /* smoothstep，中段平滑 */
            var imgScale = (1 - IMG_SHRINK * a).toFixed(4);
            var txtScale = (TXT_BOTTOM + TXT_AMP * (1 - a)).toFixed(4);
            s.imgs.forEach(function (im) {
              im.style.transformOrigin = "center center";
              im.style.transform = "scale(" + imgScale + ")";
            });
            s.texts.forEach(function (o) {
              o.el.style.transformOrigin = o.left ? "left center" : "center center";
              o.el.style.transform = "scale(" + txtScale + ")";
            });
            s.el.style.opacity = (1 - 0.15 * a).toFixed(4);
          } else {
            /* 超高场景：只轻淡入 */
            var prog = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.8)));
            s.el.style.opacity = (0.7 + 0.3 * prog).toFixed(4);
          }
        });
      };
      var camRaf = null;
      var camScroll = function () {
        if (camRaf) return;
        camRaf = window.requestAnimationFrame(function () { camRaf = null; camTick(); });
      };
      window.addEventListener("scroll", camScroll, { passive: true });
      window.addEventListener("resize", function () {
        /* 断点切换后布局左缘会变：清空 transform 重测锚点，下一帧重新应用 */
        scenes.forEach(function (s) {
          s.imgs.forEach(function (im) { im.style.transform = ""; });
          s.texts.forEach(function (o) { o.el.style.transform = ""; });
          s.texts = anchorTexts(s.texts.map(function (o) { return o.el; }));
        });
        camScroll();
      });
      camTick();
    }
  } catch (e) { /* Camera 失败不影响页面 */ }
})();
