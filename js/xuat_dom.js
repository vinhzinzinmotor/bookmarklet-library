/* ==========================================================================
 * xuat_dom.js — Xuất cây DOM của trang (file .html hoặc clipboard) để Claude phân tích
 * Thư viện : bookmarklet-library (GitHub → Cloudflare Pages)
 * Phiên bản: 2.0.0 — 13/11/2026
 *
 * NGUYÊN TẮC AN TOÀN:
 *   - Chỉ ĐỌC trang. Không click, không điền, không sửa nội dung của trang.
 *     Bảng điều khiển nằm riêng trong Shadow DOM, không đụng CSS/DOM của trang.
 *   - Không có bất kỳ lệnh gửi dữ liệu ra ngoài (fetch / XHR / POST).
 *   - Kết quả chỉ được tải về máy hoặc copy vào clipboard của người dùng.
 *
 * CHẾ ĐỘ:
 *   - Cả trang : xuất toàn bộ document.
 *   - Chọn vùng: rê chuột để tô sáng, Click để xuất,
 *                ↑ mở rộng ra thẻ cha, ↓ thu hẹp lại, Esc để hủy.
 *
 * LÀM SẠCH:
 *   - Tắt        : giữ nguyên.
 *   - Thông minh : giữ chữ; che email, SĐT, dãy số dài, nonce/token (cả trong thuộc tính).
 *   - Nghiêm ngặt: chữ → [TEXT], trừ chữ của nút, label, option, th, legend, h1–h6.
 *
 * v2.0.0: thuộc tính & trạng thái form thực tế, làm sạch 3 mức, đọc Shadow DOM
 *         + template, giữ <script src> / JSON-LD / vỏ <svg>, copy clipboard,
 *         gộp phần tử lặp, đánh dấu phần tử ẩn, nhận diện công nghệ của trang.
 * ========================================================================== */
(function () {
  'use strict';

  var HOST_ID = '__xuat_dom_host__';
  var STORAGE_KEY = 'xuatDom.settings';
  var VERSION = '2.0.0';

  // Bảng điều khiển đã mở → hiện lại, không tạo thêm
  var existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.style.display = '';
    return;
  }

  /* ------------------------------------------------------------------------
   * 1. CÀI ĐẶT (ghi nhớ lựa chọn lần trước — theo từng trang web)
   * ---------------------------------------------------------------------- */
  var CLEAN_LABELS = {
    off: 'TẮT (giữ nguyên)',
    smart: 'THÔNG MINH (che email, SĐT, số dài, nonce/token)',
    strict: 'NGHIÊM NGẶT (chữ → [TEXT], trừ nút/label/option/th/legend/h1–h6)'
  };
  var CLEAN_HINTS = {
    off: 'Giữ nguyên toàn bộ chữ và thuộc tính',
    smart: 'Giữ chữ để phân tích, chỉ che email, SĐT, dãy số ≥ 6 chữ số và nonce/token',
    strict: 'Chữ thành [TEXT], chỉ giữ chữ của nút, label, option, tiêu đề'
  };

  function loadSettings() {
    var d = { mode: 'full', clean: 'smart', collapse: true, output: 'copy' };
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s.mode === 'full' || s.mode === 'region') d.mode = s.mode;
        if (CLEAN_LABELS.hasOwnProperty(s.clean)) d.clean = s.clean;
        if (typeof s.collapse === 'boolean') d.collapse = s.collapse;
        if (s.output === 'copy' || s.output === 'file') d.output = s.output;
      }
    } catch (e) { /* trang chặn localStorage → dùng mặc định */ }
    return d;
  }

  function saveSettings(s) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) { /* bỏ qua */ }
  }

  /* ------------------------------------------------------------------------
   * 2. BỘ CHUYỂN DOM → HTML (đã lọc + thụt dòng)
   * ---------------------------------------------------------------------- */
  var VOID_TAGS = {
    area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1,
    link: 1, meta: 1, source: 1, track: 1, wbr: 1
  };
  var SKIP_TAGS = { style: 1, noscript: 1 };
  var KEEP_ATTRS = {
    id: 1, 'class': 1, name: 1, type: 1, role: 1, placeholder: 1, href: 1,
    value: 1, 'for': 1, checked: 1, selected: 1, disabled: 1, readonly: 1,
    required: 1, multiple: 1, action: 1, method: 1, src: 1, alt: 1, title: 1,
    rel: 1, content: 1, label: 1, target: 1, colspan: 1, rowspan: 1, hidden: 1,
    contenteditable: 1, lang: 1, charset: 1, property: 1, 'http-equiv': 1
  };
  var BOOL_ATTRS = {
    checked: 1, selected: 1, disabled: 1, readonly: 1, required: 1, multiple: 1, hidden: 1
  };
  // Không gộp lặp các thẻ này (mỗi cái mang thông tin riêng)
  var NO_COLLAPSE = { meta: 1, link: 1, script: 1 };
  // Không kiểm tra hiển thị các thẻ này (vốn không được vẽ lên màn hình)
  var NON_VISUAL = {
    html: 1, head: 1, meta: 1, link: 1, title: 1, base: 1, script: 1, template: 1,
    option: 1, optgroup: 1, source: 1, track: 1, area: 1, br: 1, wbr: 1,
    col: 1, colgroup: 1, param: 1
  };
  // Chế độ Nghiêm ngặt vẫn giữ chữ nằm trong các thẻ giao diện này
  var UI_TEXT_SEL = 'button,label,option,optgroup,th,legend,h1,h2,h3,h4,h5,h6,summary,caption,svg';
  var URL_ATTRS = { href: 1, src: 1, action: 1 };
  var TEXT_ATTRS = {
    value: 1, placeholder: 1, title: 1, alt: 1, label: 1, content: 1,
    'aria-label': 1, 'aria-description': 1, 'aria-valuetext': 1
  };
  var NON_TYPED_INPUTS = {
    hidden: 1, checkbox: 1, radio: 1, submit: 1, button: 1, reset: 1,
    image: 1, file: 1, password: 1, range: 1, color: 1
  };

  var COLLAPSE_MIN = 6;   // từ 6 phần tử giống nhau liền kề trở lên → gộp
  var COLLAPSE_KEEP = 3;  // giữ lại 3 phần tử đầu
  var TEXT_MAX = 300;
  var ATTR_MAX = 300;
  var JSONLD_MAX = 3000;
  var COPY_WARN = 500 * 1024;

  var SECRET_NAME_RX = /nonce|token|secret|csrf|xsrf|api[_-]?key|session|signature|passw|^security$/i;
  var SECRET_PARAM_RX = /^(_?wpnonce|_ajax_nonce|nonce|token|access_token|refresh_token|id_token|key|api_key|apikey|secret|sig|signature|auth|session|sid|code|password|pass|pwd)$/i;
  var RX_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  var RX_PHONE = /(?:\+84|\b0)(?:[\s.-]?\d){8,10}(?!\d)/g;
  var RX_LONGNUM = /\d{6,}/g;

  function isKeptAttr(n) {
    return KEEP_ATTRS[n] === 1 || n.indexOf('data-') === 0 || n.indexOf('aria-') === 0;
  }

  function escText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escAttr(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function escComment(s) {
    return String(s).replace(/--/g, '- -');
  }

  function pad(depth) {
    return new Array(depth + 1).join('  ');
  }

  function truncate(s, max) {
    if (s.length <= max) return s;
    return s.slice(0, max) + '…[+' + (s.length - max) + ' ký tự]';
  }

  // ── Làm sạch ──
  function maskEmail(s, ctx) {
    return s.replace(RX_EMAIL, function () { ctx.stats.masked++; return '[EMAIL]'; });
  }

  function maskPatterns(s, ctx, withNum) {
    s = maskEmail(s, ctx);
    s = s.replace(RX_PHONE, function () { ctx.stats.masked++; return '[SĐT]'; });
    if (withNum) s = s.replace(RX_LONGNUM, function () { ctx.stats.masked++; return '[SỐ]'; });
    return s;
  }

  function cleanUrl(v, ctx) {
    if (/^\s*mailto:/i.test(v)) { ctx.stats.masked++; return 'mailto:[EMAIL]'; }
    if (/^\s*tel:/i.test(v)) { ctx.stats.masked++; return 'tel:[SĐT]'; }
    v = v.replace(/([?&#;])([^=&#;]+)=([^&#;]*)/g, function (m, sep, k, val) {
      if (!val || !SECRET_PARAM_RX.test(k)) return m;
      ctx.stats.masked++;
      return sep + k + '=[ẨN]';
    });
    return maskEmail(v, ctx);
  }

  function isTypedField(el) {
    if (el.localName === 'textarea') return true;
    if (el.localName !== 'input') return false;
    return !NON_TYPED_INPUTS[String(el.type || 'text').toLowerCase()];
  }

  function cleanText(t, parent, ctx) {
    if (ctx.clean === 'off') return truncate(t, TEXT_MAX);
    if (ctx.clean === 'strict' && !(parent && parent.nodeType === 1 && parent.closest(UI_TEXT_SEL))) {
      return '[TEXT]';
    }
    return truncate(maskPatterns(t, ctx, true), TEXT_MAX);
  }

  function cleanAttr(el, n, v, ctx) {
    if (/^\s*data:/i.test(v)) return '[BASE64]';
    if (ctx.clean !== 'off' && v) {
      if (SECRET_NAME_RX.test(n) ||
          ((n === 'value' || n === 'content') && SECRET_NAME_RX.test(el.getAttribute('name') || ''))) {
        ctx.stats.masked++;
        v = '[ẨN]';
      } else if (URL_ATTRS[n]) {
        v = cleanUrl(v, ctx);
      } else if (n === 'value' && ctx.clean === 'strict' && isTypedField(el)) {
        v = '[TEXT]';
      } else if (TEXT_ATTRS[n]) {
        v = maskPatterns(v, ctx, n === 'value' ? isTypedField(el) : n !== 'content');
      } else if (n.indexOf('data-') === 0 || n.indexOf('aria-') === 0) {
        v = maskPatterns(v, ctx, false);
      }
    }
    return truncate(v, ATTR_MAX);
  }

  // ── Thuộc tính + trạng thái thực tế của form ──
  function collectAttrs(el) {
    var tag = el.localName;
    var inputType = tag === 'input' ? String(el.type || 'text').toLowerCase() : '';
    var isCheck = inputType === 'checkbox' || inputType === 'radio';
    var liveValue = tag === 'input' && !isCheck;
    var list = [];
    var attrs = el.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var n = attrs[i].name.toLowerCase();
      if (!isKeptAttr(n)) continue;
      if (n === 'checked' || n === 'selected') continue; // lấy trạng thái thật bên dưới
      if (n === 'value' && liveValue) continue;
      var v = attrs[i].value;
      if (n === 'class') {
        v = v.replace(/\s+/g, ' ').trim();
        if (!v) continue;
      }
      list.push([n, v]);
    }
    if (liveValue && inputType !== 'file' && el.value) {
      list.push(['value', inputType === 'password' ? '[MẬT KHẨU]' : el.value]);
    }
    if (isCheck && el.checked) list.push(['checked', '']);
    if (tag === 'option' && el.selected) list.push(['selected', '']);
    return list;
  }

  function openTag(el, ctx, hidden) {
    var parts = ['<' + el.localName];
    var list = collectAttrs(el);
    for (var i = 0; i < list.length; i++) {
      var n = list[i][0];
      var v = list[i][1];
      if (v === '' && BOOL_ATTRS[n]) parts.push(n);
      else parts.push(n + '="' + escAttr(cleanAttr(el, n, v, ctx)) + '"');
    }
    if (hidden) parts.push('data-xd-an="1"');
    return parts.join(' ') + '>';
  }

  // ── Phần tử đang ẩn ──
  function isHidden(el) {
    try {
      var view = el.ownerDocument.defaultView;
      if (typeof el.checkVisibility === 'function') {
        if (el.checkVisibility({ visibilityProperty: true })) return false;
        // display:contents không có khung nhưng con vẫn hiển thị
        return !(view && view.getComputedStyle(el).display === 'contents');
      }
      var cs = view.getComputedStyle(el);
      return cs.display === 'none' || cs.visibility === 'hidden';
    } catch (e) {
      return false;
    }
  }

  // ── Các thẻ đặc biệt ──
  function serializeScript(el, depth, ctx) {
    var type = (el.getAttribute('type') || '').toLowerCase();
    if (el.hasAttribute('src')) {
      ctx.stats.scriptExt++;
      ctx.lines.push(pad(depth) + openTag(el, ctx, false) + '</script>');
      return;
    }
    if (type === 'application/ld+json') {
      ctx.stats.jsonLd++;
      var j = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (ctx.clean !== 'off') j = maskPatterns(j, ctx, false);
      j = truncate(j, JSONLD_MAX).replace(/<\/script/gi, '<\\/script');
      ctx.lines.push(pad(depth) + openTag(el, ctx, false));
      ctx.lines.push(pad(depth + 1) + j);
      ctx.lines.push(pad(depth) + '</script>');
      return;
    }
    ctx.stats.scriptInline++; // script nội tuyến: chỉ đếm, bỏ nội dung
  }

  function svgInner(el, ctx) {
    var out = '';
    var t = el.querySelector('title');
    var tt = t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
    if (tt) out += escText(cleanText(tt, el, ctx));
    var u = el.querySelector('use');
    var ref = u && (u.getAttribute('href') || u.getAttribute('xlink:href'));
    if (ref) out += '<!-- icon: ' + escComment(ref) + ' -->';
    return out;
  }

  function fieldText(el, ctx) {
    var v = String(el.value || '').replace(/\s+/g, ' ').trim();
    if (!v || ctx.clean === 'off') return truncate(v, TEXT_MAX);
    if (SECRET_NAME_RX.test(el.getAttribute('name') || '')) {
      ctx.stats.masked++;
      return '[ẨN]';
    }
    if (ctx.clean === 'strict') return '[TEXT]';
    return truncate(maskPatterns(v, ctx, true), TEXT_MAX);
  }

  // ── Duyệt cây ──
  function sigOf(el) {
    return el.localName + '|' + classList(el, 99).sort().join(' ');
  }

  function sigLabel(el) {
    var cls = classList(el, 2);
    return el.localName + (cls.length ? '.' + cls.join('.') : '');
  }

  function serializeChildren(nodes, depth, ctx) {
    var len = nodes.length;
    var i = 0;
    while (i < len) {
      var n = nodes[i];
      if (ctx.collapse && n.nodeType === 1 && !NO_COLLAPSE[n.localName] && n.id !== HOST_ID) {
        // Đếm chuỗi anh em liền kề cùng thẻ + class (bỏ qua chữ trắng / comment xen giữa)
        var sig = sigOf(n);
        var run = [n];
        var j = i + 1;
        while (j < len) {
          var m = nodes[j];
          if (m.nodeType === 1) {
            if (sigOf(m) !== sig) break;
            run.push(m);
          } else if (m.nodeType === 3 && m.nodeValue.trim()) {
            break;
          }
          j++;
        }
        if (run.length >= COLLAPSE_MIN) {
          for (var k = 0; k < COLLAPSE_KEEP; k++) serializeNode(run[k], depth, ctx);
          var rest = run.length - COLLAPSE_KEEP;
          ctx.stats.collapsed += rest;
          ctx.lines.push(pad(depth) + '<!-- … lược bỏ ' + rest + ' phần tử giống nhau (' + escComment(sigLabel(n)) + ') -->');
          i = j;
          continue;
        }
      }
      serializeNode(n, depth, ctx);
      i++;
    }
  }

  function serializeNode(node, depth, ctx) {
    // Text
    if (node.nodeType === 3) {
      var t = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (!t) return;
      ctx.lines.push(pad(depth) + escText(cleanText(t, node.parentNode, ctx)));
      return;
    }
    // Bỏ comment, processing instruction...
    if (node.nodeType !== 1) return;

    var el = node;
    if (el.id === HOST_ID) return; // bỏ bảng điều khiển của chính công cụ
    var tag = el.localName;
    if (SKIP_TAGS[tag]) return;
    if (tag === 'script') {
      serializeScript(el, depth, ctx);
      return;
    }

    // Chỉ đánh dấu ẩn ở phần tử ngoài cùng (con của nó hiểu là ẩn theo)
    var hidden = false;
    if (!ctx.inHidden && !NON_VISUAL[tag] &&
        !(tag === 'input' && String(el.type).toLowerCase() === 'hidden') && isHidden(el)) {
      hidden = true;
      ctx.stats.hidden++;
    }

    ctx.stats.elements++;

    if (tag === 'iframe' || tag === 'frame') {
      serializeFrame(el, depth, ctx, hidden);
      return;
    }

    var open = openTag(el, ctx, hidden);
    if (tag === 'svg') {
      ctx.lines.push(pad(depth) + open + svgInner(el, ctx) + '</svg>');
      return;
    }
    if (VOID_TAGS[tag]) {
      ctx.lines.push(pad(depth) + open);
      return;
    }
    if (tag === 'textarea') {
      ctx.lines.push(pad(depth) + open + escText(fieldText(el, ctx)) + '</textarea>');
      return;
    }

    var savedHidden = ctx.inHidden;
    if (hidden || tag === 'head' || tag === 'template') ctx.inHidden = true;

    var start = ctx.lines.length;
    ctx.lines.push(pad(depth) + open);
    if (el.shadowRoot) {
      ctx.stats.shadow++;
      ctx.lines.push(pad(depth + 1) + '<!-- #shadow-root (open) -->');
      serializeChildren(el.shadowRoot.childNodes, depth + 2, ctx);
      ctx.lines.push(pad(depth + 1) + '<!-- /shadow-root -->');
    }
    serializeChildren(tag === 'template' ? el.content.childNodes : el.childNodes, depth + 1, ctx);
    ctx.inHidden = savedHidden;

    var added = ctx.lines.length - start - 1;
    if (added === 0) {
      // Không có con → gộp 1 dòng
      ctx.lines[start] += '</' + tag + '>';
    } else if (added === 1 && ctx.lines[start + 1].trim().charAt(0) !== '<') {
      // Chỉ có 1 dòng chữ → gộp 1 dòng: <button class="x">Lưu</button>
      ctx.lines[start] += ctx.lines[start + 1].trim() + '</' + tag + '>';
      ctx.lines.length = start + 1;
    } else {
      ctx.lines.push(pad(depth) + '</' + tag + '>');
    }
  }

  function serializeFrame(el, depth, ctx, hidden) {
    var src = cleanAttr(el, 'src', el.getAttribute('src') || '(không có src)', ctx);
    var doc = null;
    try {
      doc = el.contentDocument;
    } catch (e) {
      doc = null;
    }

    ctx.lines.push(pad(depth) + openTag(el, ctx, hidden));
    if (doc && doc.documentElement) {
      ctx.stats.iframeSame++;
      ctx.lines.push(pad(depth + 1) + '<!-- ===== BẮT ĐẦU IFRAME (cùng tên miền): ' + escComment(src) + ' ===== -->');
      serializeNode(doc.documentElement, depth + 1, ctx);
      ctx.lines.push(pad(depth + 1) + '<!-- ===== KẾT THÚC IFRAME ===== -->');
    } else {
      ctx.stats.iframeCross++;
      ctx.lines.push(pad(depth + 1) + '<!-- IFRAME KHÁC TÊN MIỀN — trình duyệt không cho đọc nội dung. src: ' + escComment(src) + ' -->');
    }
    ctx.lines.push(pad(depth) + '</' + el.localName + '>');
  }

  /* ------------------------------------------------------------------------
   * 3. TIỆN ÍCH: đường dẫn CSS, nhãn phần tử, tên file, thời gian, công nghệ
   * ---------------------------------------------------------------------- */
  function cssEsc(s) {
    return (window.CSS && window.CSS.escape) ? window.CSS.escape(s) : s;
  }

  function classList(el, max) {
    return (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, max);
  }

  function cssPath(el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.documentElement) {
      var s = el.localName;
      if (el.id) {
        parts.unshift(s + '#' + cssEsc(el.id));
        break;
      }
      var cls = classList(el, 3);
      if (cls.length) s += '.' + cls.map(cssEsc).join('.');
      var pn = el.parentNode;
      if (pn && pn.children) {
        var same = Array.prototype.filter.call(pn.children, function (c) {
          return c.localName === el.localName;
        });
        if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
      }
      parts.unshift(s);
      if (pn && pn.nodeType === 11 && pn.host) {
        // Đang nằm trong Shadow DOM → đi tiếp lên phần tử chủ
        parts.unshift('#shadow-root');
        el = pn.host;
      } else {
        el = el.parentElement;
      }
    }
    return parts.join(' > ');
  }

  function shortLabel(el) {
    var s = el.localName;
    if (el.id) s += '#' + el.id;
    var cls = classList(el, 2);
    if (cls.length) s += '.' + cls.join('.');
    return s;
  }

  function slug(s) {
    var r = String(s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    return r || 'trang';
  }

  function two(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function fileStamp(d) {
    return d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + '-' + two(d.getHours()) + two(d.getMinutes());
  }

  function readableTime(d) {
    return two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds());
  }

  function fileName(d) {
    var hostName = location.hostname.replace(/^www\./, '') || 'local';
    return hostName + '_' + slug(document.title) + '_' + fileStamp(d) + '.html';
  }

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function num(n) {
    return Number(n).toLocaleString('vi-VN');
  }

  function techInfo() {
    var out = [];
    try {
      var gens = Array.prototype.map.call(
        document.querySelectorAll('meta[name="generator"]'),
        function (m) { return (m.getAttribute('content') || '').trim(); }
      ).filter(Boolean);
      var wp = gens.filter(function (g) { return /wordpress/i.test(g); })[0];
      var bodyCls = document.body ? document.body.className : '';
      var wpVer = bodyCls.match(/\bversion-(\d+(?:-\d+)+)/); // trang wp-admin
      if (wp) out.push(wp);
      else if (wpVer) out.push('WordPress ' + wpVer[1].replace(/-/g, '.'));
      else if (window.wp || document.querySelector('link[href*="/wp-content/"], script[src*="/wp-includes/"]')) out.push('WordPress');
      gens.forEach(function (g) { if (g !== wp) out.push(g); });
      var hasWoo = gens.some(function (g) { return /woocommerce/i.test(g); });
      if (!hasWoo && (window.woocommerce_params || window.wc_add_to_cart_params || /\bwoocommerce\b/.test(bodyCls))) out.push('WooCommerce');
      if (window.acf) {
        var acfVer = '';
        try { acfVer = window.acf.get ? (window.acf.get('acf_version') || '') : ''; } catch (e) { acfVer = ''; }
        out.push('ACF' + (acfVer ? ' ' + acfVer : ''));
      }
      var jq = window.jQuery;
      if (jq && jq.fn && jq.fn.jquery) {
        out.push('jQuery ' + jq.fn.jquery);
        if (jq.fn.select2) out.push('select2');
      }
      if (window.tinymce && window.tinymce.majorVersion) out.push('TinyMCE ' + window.tinymce.majorVersion + '.' + window.tinymce.minorVersion);
      if (window.__NEXT_DATA__ || document.getElementById('__NEXT_DATA__')) out.push('Next.js');
      if (window.React && window.React.version) out.push('React ' + window.React.version);
      else if (document.querySelector('[data-reactroot]')) out.push('React');
      if (window.Vue && window.Vue.version) out.push('Vue ' + window.Vue.version);
      else if (window.__VUE__ || document.querySelector('[data-v-app]')) out.push('Vue');
      var ng = document.querySelector('[ng-version]');
      if (ng) out.push('Angular ' + ng.getAttribute('ng-version'));
    } catch (e) { /* bỏ qua */ }
    return out.length ? out.join(', ') : '(không nhận diện được)';
  }

  /* ------------------------------------------------------------------------
   * 4. XUẤT (dựng nội dung → copy clipboard hoặc tải file)
   * ---------------------------------------------------------------------- */
  function buildDom(rootEl, modeLabel, opts) {
    var now = new Date();
    var ctx = {
      lines: [],
      clean: opts.clean,
      collapse: opts.collapse,
      inHidden: false,
      stats: {
        elements: 0, hidden: 0, shadow: 0, collapsed: 0, masked: 0,
        scriptExt: 0, scriptInline: 0, jsonLd: 0, iframeSame: 0, iframeCross: 0
      }
    };
    serializeNode(rootEl, 0, ctx);
    var st = ctx.stats;

    var header = [
      '<!--',
      '  XUẤT DOM — xuat_dom.js v' + VERSION,
      '  URL        : ' + escComment(ctx.clean === 'off' ? location.href : cleanUrl(location.href, ctx)),
      '  Tiêu đề    : ' + escComment(ctx.clean === 'off' ? document.title : maskPatterns(document.title, ctx, true)),
      '  Thời gian  : ' + readableTime(now),
      '  Ngôn ngữ   : ' + escComment(document.documentElement.lang || '(không khai báo)'),
      '  Trạng thái : ' + document.readyState,
      '  Cửa sổ     : ' + window.innerWidth + ' x ' + window.innerHeight + ' px, đang cuộn tới ' +
        Math.round(window.scrollX) + ', ' + Math.round(window.scrollY),
      '  Công nghệ  : ' + escComment(techInfo()),
      '  Chế độ     : ' + escComment(modeLabel),
      '  Làm sạch   : ' + CLEAN_LABELS[ctx.clean] + (ctx.clean !== 'off' ? ' — đã che ' + st.masked + ' chỗ' : ''),
      '  Phần tử    : ' + st.elements + ' (đang ẩn: ' + st.hidden + ', shadow root: ' + st.shadow + ')',
      '  Gộp lặp    : ' + (ctx.collapse ? 'BẬT — lược bỏ ' + st.collapsed + ' phần tử giống nhau' : 'TẮT'),
      '  Script     : ' + st.scriptExt + ' file ngoài, ' + st.jsonLd + ' JSON-LD, ' +
        st.scriptInline + ' nội tuyến (bỏ nội dung)',
      '  Iframe     : ' + st.iframeSame + ' cùng tên miền (đã gộp), ' +
        st.iframeCross + ' khác tên miền (không đọc được)',
      '  Đã loại bỏ : style, noscript, comment, style inline, nội dung script nội tuyến, hình vẽ bên trong svg',
      '  Quy ước    : data-xd-an="1" = phần tử đang ẩn (tính cả các con bên trong)',
      '               value / checked / selected = trạng thái THỰC TẾ lúc xuất',
      '               [TEXT] [EMAIL] [SĐT] [SỐ] [ẨN] [MẬT KHẨU] = đã che | [BASE64] = data URI',
      '               …[+N ký tự] = đã cắt bớt | #shadow-root = nội dung Shadow DOM',
      '-->'
    ];

    var content = header.concat(ctx.lines).join('\n') + '\n';
    return {
      content: content,
      name: fileName(now),
      size: new Blob([content]).size,
      stats: st
    };
  }

  function downloadFile(res) {
    var blob = new Blob([res.content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = res.name;
    a.style.display = 'none';
    shadow.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);
  }

  /* ------------------------------------------------------------------------
   * 5. GIAO DIỆN (Shadow DOM — tách biệt hoàn toàn với CSS của trang)
   * ---------------------------------------------------------------------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (k === 'text') el.textContent = attrs[k];
        else el.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  var CSS_TEXT = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.panel{position:fixed;top:16px;right:16px;width:300px;background:#fff;color:#1f2937;',
    '  border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;font-size:13px;line-height:1.4}',
    '.head{display:flex;align-items:center;justify-content:space-between;background:#1f2937;color:#fff;padding:9px 12px}',
    '.title{font-weight:700;letter-spacing:.5px}',
    '.ver{font-weight:400;opacity:.6;font-size:11px;margin-left:6px}',
    '.close{all:unset;cursor:pointer;width:22px;height:22px;text-align:center;line-height:22px;border-radius:4px;font-size:14px}',
    '.close:hover{background:rgba(255,255,255,.15)}',
    '.body{padding:12px}',
    '.label{font-weight:600;margin:10px 0 4px}',
    '.label.first{margin-top:0}',
    '.inline{display:flex;gap:16px;margin:2px 0 2px 2px}',
    '.row{display:flex;align-items:center;gap:8px;margin:4px 0 4px 2px;cursor:pointer}',
    '.inline .row{margin:0}',
    '.row input{margin:0;cursor:pointer}',
    '.sel{width:100%;margin:2px 0 4px;padding:5px 6px;border:1px solid #d1d5db;border-radius:6px;',
    '  background:#fff;color:#1f2937;font-size:13px;cursor:pointer}',
    '.sel:disabled{opacity:.6;cursor:default}',
    '.hint{color:#6b7280;font-size:11px;margin:0 0 0 24px}',
    '.hint.flat{margin:0 0 0 2px}',
    '.sep{height:1px;background:#e5e7eb;margin:10px 0}',
    '.btn{all:unset;display:block;width:100%;box-sizing:border-box;text-align:center;cursor:pointer;margin-top:12px;',
    '  padding:8px 0;border-radius:6px;background:#2563eb;color:#fff;font-weight:600;font-size:13px}',
    '.btn:hover{background:#1d4ed8}',
    '.btn.cancel{background:#dc2626}',
    '.btn.cancel:hover{background:#b91c1c}',
    '.status{margin-top:10px;padding:7px 9px;border-radius:6px;font-size:12px;display:none;word-break:break-word}',
    '.status.info{display:block;background:#eff6ff;color:#1e40af}',
    '.status.ok{display:block;background:#ecfdf5;color:#065f46}',
    '.status.warn{display:block;background:#fffbeb;color:#92400e}',
    '.status.err{display:block;background:#fef2f2;color:#991b1b}',
    '.hl{position:fixed;display:none;pointer-events:none;border:2px solid #2563eb;background:rgba(37,99,235,.12);border-radius:2px}',
    '.tip{position:fixed;display:none;pointer-events:none;background:#111827;color:#fff;padding:3px 7px;border-radius:4px;',
    '  font:12px/1.4 Consolas,"Courier New",monospace;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis}'
  ].join('\n');

  var settings = loadSettings();

  var host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('style', 'all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;');
  var shadow = host.attachShadow({ mode: 'open' });

  var radioFull = h('input', { type: 'radio', name: 'xd-mode', value: 'full' });
  var radioRegion = h('input', { type: 'radio', name: 'xd-mode', value: 'region' });
  var selClean = h('select', { 'class': 'sel' }, [
    h('option', { value: 'off', text: 'Tắt' }),
    h('option', { value: 'smart', text: 'Thông minh' }),
    h('option', { value: 'strict', text: 'Nghiêm ngặt' })
  ]);
  var cleanHint = h('p', { 'class': 'hint flat' });
  var chkCollapse = h('input', { type: 'checkbox' });
  var radioCopy = h('input', { type: 'radio', name: 'xd-out', value: 'copy' });
  var radioFile = h('input', { type: 'radio', name: 'xd-out', value: 'file' });
  radioFull.checked = settings.mode === 'full';
  radioRegion.checked = settings.mode === 'region';
  selClean.value = settings.clean;
  cleanHint.textContent = CLEAN_HINTS[settings.clean];
  chkCollapse.checked = settings.collapse;
  radioCopy.checked = settings.output === 'copy';
  radioFile.checked = settings.output === 'file';

  var btnClose = h('button', { 'class': 'close', title: 'Đóng', text: '✕' });
  var btnStart = h('button', { 'class': 'btn', text: 'Bắt đầu' });
  var statusBox = h('div', { 'class': 'status' });
  var hl = h('div', { 'class': 'hl' });
  var tip = h('div', { 'class': 'tip' });

  var panel = h('div', { 'class': 'panel' }, [
    h('div', { 'class': 'head' }, [
      h('div', null, [
        h('span', { 'class': 'title', text: 'XUẤT DOM' }),
        h('span', { 'class': 'ver', text: 'v' + VERSION })
      ]),
      btnClose
    ]),
    h('div', { 'class': 'body' }, [
      h('div', { 'class': 'label first', text: 'Chế độ:' }),
      h('div', { 'class': 'inline' }, [
        h('label', { 'class': 'row' }, [radioFull, 'Cả trang']),
        h('label', { 'class': 'row' }, [radioRegion, 'Chọn vùng'])
      ]),
      h('div', { 'class': 'label', text: 'Làm sạch dữ liệu:' }),
      selClean,
      cleanHint,
      h('div', { 'class': 'sep' }),
      h('label', { 'class': 'row' }, [chkCollapse, 'Gộp phần tử lặp lại']),
      h('p', { 'class': 'hint', text: 'Từ 6 phần tử giống nhau liền kề → giữ 3, lược bỏ phần còn lại' }),
      h('div', { 'class': 'label', text: 'Xuất ra:' }),
      h('div', { 'class': 'inline' }, [
        h('label', { 'class': 'row' }, [radioCopy, '📋 Copy']),
        h('label', { 'class': 'row' }, [radioFile, '⬇ Tải file'])
      ]),
      btnStart,
      statusBox
    ])
  ]);

  shadow.appendChild(h('style', { text: CSS_TEXT }));
  shadow.appendChild(panel);
  shadow.appendChild(hl);
  shadow.appendChild(tip);
  (document.body || document.documentElement).appendChild(host);

  function setStatus(type, msg) {
    statusBox.className = 'status ' + type;
    statusBox.textContent = msg;
  }

  function readUiSettings() {
    return {
      mode: radioRegion.checked ? 'region' : 'full',
      clean: selClean.value,
      collapse: chkCollapse.checked,
      output: radioFile.checked ? 'file' : 'copy'
    };
  }

  function setControlsDisabled(disabled) {
    [radioFull, radioRegion, selClean, chkCollapse, radioCopy, radioFile].forEach(function (c) {
      c.disabled = disabled;
    });
  }

  function doExport(rootEl, modeLabel) {
    var s = readUiSettings();
    var res;
    try {
      res = buildDom(rootEl, modeLabel, s);
    } catch (err) {
      setStatus('err', 'Lỗi khi xuất: ' + (err && err.message ? err.message : err));
      console.error('[xuat_dom]', err);
      return;
    }
    var st = res.stats;
    var summary = formatSize(res.size) + ', ' + num(st.elements) + ' phần tử' +
      (st.collapsed ? ', lược bỏ ' + num(st.collapsed) : '') +
      (st.hidden ? ', ẩn ' + num(st.hidden) : '') +
      (s.clean !== 'off' ? ', che ' + num(st.masked) + ' chỗ' : '');

    function saveAsFile(prefix) {
      try {
        downloadFile(res);
        setStatus('ok', prefix + 'Đã tải: ' + res.name + ' — ' + summary);
      } catch (err) {
        setStatus('err', 'Lỗi khi tải file: ' + (err && err.message ? err.message : err));
        console.error('[xuat_dom]', err);
      }
    }

    if (s.output === 'copy' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(res.content).then(function () {
        if (res.size > COPY_WARN) {
          setStatus('warn', '📋 Đã copy — ' + summary + '. Nội dung khá lớn, nếu dán vào chat bị lỗi hãy chọn "Tải file".');
        } else {
          setStatus('ok', '📋 Đã copy — ' + summary + '. Dán (Ctrl+V) vào chat cho Claude.');
        }
      }, function (err) {
        console.warn('[xuat_dom] Không copy được:', err);
        saveAsFile('Không copy được → ');
      });
    } else if (s.output === 'copy') {
      saveAsFile('Trang không cho copy → ');
    } else {
      saveAsFile('⬇ ');
    }
  }

  /* ------------------------------------------------------------------------
   * 6. CHẾ ĐỘ CHỌN VÙNG
   * ---------------------------------------------------------------------- */
  var picking = false;
  var current = null;
  var downStack = [];
  var BLOCK_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'auxclick'];

  function isOwnEvent(e) {
    var path = e.composedPath ? e.composedPath() : [];
    return path.indexOf(host) !== -1;
  }

  function draw() {
    if (!current || !current.isConnected) {
      hl.style.display = 'none';
      tip.style.display = 'none';
      return;
    }
    var r = current.getBoundingClientRect();
    hl.style.display = 'block';
    hl.style.left = r.left + 'px';
    hl.style.top = r.top + 'px';
    hl.style.width = r.width + 'px';
    hl.style.height = r.height + 'px';

    tip.textContent = shortLabel(current) + '   ' + Math.round(r.width) + ' × ' + Math.round(r.height);
    tip.style.display = 'block';
    var tipTop = r.top - 24;
    if (tipTop < 0) tipTop = r.bottom + 4;
    if (tipTop > window.innerHeight - 24) tipTop = Math.max(0, r.top + 4);
    tip.style.top = tipTop + 'px';
    tip.style.left = Math.max(0, Math.min(r.left, window.innerWidth - 200)) + 'px';
  }

  function setCurrent(el) {
    current = el;
    draw();
  }

  function onMove(e) {
    if (isOwnEvent(e)) return;
    // composedPath()[0] = phần tử thật, kể cả khi nằm trong Shadow DOM của trang
    var path = e.composedPath ? e.composedPath() : [];
    var t = path.length ? path[0] : e.target;
    if (!t || t.nodeType !== 1) return;
    if (t !== current) {
      downStack = [];
      setCurrent(t);
    }
  }

  function onBlock(e) {
    if (isOwnEvent(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type === 'click' && current) confirmPick();
  }

  function firstUsableChild(el) {
    var c = el.firstElementChild || (el.shadowRoot ? el.shadowRoot.firstElementChild : null);
    while (c && (SKIP_TAGS[c.localName] || c.localName === 'script' || c.id === HOST_ID)) c = c.nextElementSibling;
    return c;
  }

  function onKey(e) {
    if (!picking) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      stopPick();
      setStatus('info', 'Đã hủy chọn vùng.');
      return;
    }
    if (!current) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      // Phần tử ở gốc Shadow DOM → cha là phần tử chủ (host)
      var p = current.parentElement || (current.parentNode && current.parentNode.host) || null;
      if (p && current !== document.body && p !== document.documentElement) {
        downStack.push(current);
        setCurrent(p);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      var next = downStack.length ? downStack.pop() : firstUsableChild(current);
      if (next) setCurrent(next);
    }
  }

  function startPick() {
    picking = true;
    current = null;
    downStack = [];
    document.addEventListener('mousemove', onMove, true);
    BLOCK_EVENTS.forEach(function (t) { window.addEventListener(t, onBlock, true); });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', draw, true);
    window.addEventListener('resize', draw, true);
    setControlsDisabled(true);
    btnStart.textContent = 'Hủy chọn (Esc)';
    btnStart.className = 'btn cancel';
    setStatus('info', 'Rê chuột để chọn vùng — Click để xuất. ↑ mở rộng, ↓ thu hẹp, Esc để hủy.');
  }

  function stopPick() {
    picking = false;
    document.removeEventListener('mousemove', onMove, true);
    BLOCK_EVENTS.forEach(function (t) { window.removeEventListener(t, onBlock, true); });
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', draw, true);
    window.removeEventListener('resize', draw, true);
    current = null;
    downStack = [];
    draw();
    setControlsDisabled(false);
    btnStart.textContent = 'Bắt đầu';
    btnStart.className = 'btn';
  }

  function confirmPick() {
    var el = current;
    stopPick();
    doExport(el, 'Chọn vùng — ' + cssPath(el));
  }

  /* ------------------------------------------------------------------------
   * 7. SỰ KIỆN NÚT BẤM
   * ---------------------------------------------------------------------- */
  btnStart.addEventListener('click', function () {
    if (picking) {
      stopPick();
      setStatus('info', 'Đã hủy chọn vùng.');
      return;
    }
    var s = readUiSettings();
    saveSettings(s);
    if (s.mode === 'full') {
      doExport(document.documentElement, 'Cả trang');
    } else {
      startPick();
    }
  });

  [radioFull, radioRegion, selClean, chkCollapse, radioCopy, radioFile].forEach(function (inp) {
    inp.addEventListener('change', function () {
      cleanHint.textContent = CLEAN_HINTS[selClean.value];
      saveSettings(readUiSettings());
    });
  });

  btnClose.addEventListener('click', function () {
    if (picking) stopPick();
    host.remove();
  });
})();
