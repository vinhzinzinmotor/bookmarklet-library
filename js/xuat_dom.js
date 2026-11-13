/* ==========================================================================
 * xuat_dom.js — Xuất cây DOM của trang ra file .html để Claude phân tích
 * Thư viện : bookmarklet-library (GitHub → Cloudflare Pages)
 * Phiên bản: 1.0.0 — 13/11/2026
 *
 * NGUYÊN TẮC AN TOÀN:
 *   - Chỉ ĐỌC trang. Không click, không điền, không sửa nội dung của trang.
 *     Bảng điều khiển nằm riêng trong Shadow DOM, không đụng CSS/DOM của trang.
 *   - Không có bất kỳ lệnh gửi dữ liệu ra ngoài (fetch / XHR / POST).
 *   - File chỉ được tải về máy người dùng.
 *
 * CHẾ ĐỘ:
 *   - Cả trang : xuất toàn bộ document.
 *   - Chọn vùng: rê chuột để tô sáng, Click để xuất,
 *                ↑ mở rộng ra thẻ cha, ↓ thu hẹp lại, Esc để hủy.
 * ========================================================================== */
(function () {
  'use strict';

  var HOST_ID = '__xuat_dom_host__';
  var STORAGE_KEY = 'xuatDom.settings';
  var VERSION = '1.0.0';

  // Bảng điều khiển đã mở → hiện lại, không tạo thêm
  var existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.style.display = '';
    return;
  }

  /* ------------------------------------------------------------------------
   * 1. CÀI ĐẶT (ghi nhớ lựa chọn lần trước — theo từng trang web)
   * ---------------------------------------------------------------------- */
  function loadSettings() {
    var d = { mode: 'full', sanitize: true };
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s.mode === 'full' || s.mode === 'region') d.mode = s.mode;
        if (typeof s.sanitize === 'boolean') d.sanitize = s.sanitize;
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
  var SKIP_TAGS = { script: 1, style: 1, noscript: 1, svg: 1 };
  var KEEP_ATTRS = {
    id: 1, 'class': 1, name: 1, type: 1, role: 1, placeholder: 1, href: 1
  };

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

  function cleanAttrValue(v) {
    if (/^\s*data:/i.test(v)) return '[BASE64]';
    return v;
  }

  function pad(depth) {
    return new Array(depth + 1).join('  ');
  }

  function openTag(el) {
    var parts = ['<' + el.localName];
    var attrs = el.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var n = attrs[i].name.toLowerCase();
      if (!isKeptAttr(n)) continue;
      var v = cleanAttrValue(attrs[i].value);
      if (n === 'class') {
        v = v.replace(/\s+/g, ' ').trim();
        if (!v) continue;
      }
      parts.push(n + '="' + escAttr(v) + '"');
    }
    return parts.join(' ') + '>';
  }

  function serializeNode(node, depth, ctx) {
    // Text
    if (node.nodeType === 3) {
      var t = node.nodeValue.replace(/\s+/g, ' ').trim();
      if (!t) return;
      ctx.lines.push(pad(depth) + (ctx.sanitize ? '[TEXT]' : escText(t)));
      return;
    }
    // Bỏ comment, processing instruction...
    if (node.nodeType !== 1) return;

    var el = node;
    if (el.id === HOST_ID) return; // bỏ bảng điều khiển của chính công cụ
    var tag = el.localName;
    if (SKIP_TAGS[tag]) return;

    ctx.stats.elements++;

    if (tag === 'iframe' || tag === 'frame') {
      serializeFrame(el, depth, ctx);
      return;
    }

    var open = openTag(el);
    if (VOID_TAGS[tag]) {
      ctx.lines.push(pad(depth) + open);
      return;
    }

    var start = ctx.lines.length;
    ctx.lines.push(pad(depth) + open);
    var kids = el.childNodes;
    for (var i = 0; i < kids.length; i++) {
      serializeNode(kids[i], depth + 1, ctx);
    }

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

  function serializeFrame(el, depth, ctx) {
    var src = cleanAttrValue(el.getAttribute('src') || '(không có src)');
    var doc = null;
    try {
      doc = el.contentDocument;
    } catch (e) {
      doc = null;
    }

    ctx.lines.push(pad(depth) + openTag(el));
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
   * 3. TIỆN ÍCH: đường dẫn CSS, nhãn phần tử, tên file, thời gian
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
      var p = el.parentElement;
      if (p) {
        var same = Array.prototype.filter.call(p.children, function (c) {
          return c.localName === el.localName;
        });
        if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
      }
      parts.unshift(s);
      el = p;
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

  /* ------------------------------------------------------------------------
   * 4. XUẤT FILE
   * ---------------------------------------------------------------------- */
  function exportDom(rootEl, modeLabel, sanitize) {
    var now = new Date();
    var ctx = {
      lines: [],
      sanitize: sanitize,
      stats: { elements: 0, iframeSame: 0, iframeCross: 0 }
    };
    serializeNode(rootEl, 0, ctx);

    var header = [
      '<!--',
      '  XUẤT DOM — xuat_dom.js v' + VERSION,
      '  URL        : ' + escComment(location.href),
      '  Tiêu đề    : ' + escComment(document.title),
      '  Thời gian  : ' + readableTime(now),
      '  Cửa sổ     : ' + window.innerWidth + ' x ' + window.innerHeight + ' px',
      '  Chế độ     : ' + escComment(modeLabel),
      '  Làm sạch   : ' + (sanitize ? 'BẬT (chữ hiển thị thay bằng [TEXT])' : 'TẮT (giữ nguyên chữ hiển thị)'),
      '  Phần tử    : ' + ctx.stats.elements,
      '  Iframe     : ' + ctx.stats.iframeSame + ' cùng tên miền (đã gộp), ' +
        ctx.stats.iframeCross + ' khác tên miền (không đọc được)',
      '  Đã loại bỏ : script, style, noscript, svg, comment, style inline, data URI (base64)',
      '-->'
    ];

    var content = header.concat(ctx.lines).join('\n') + '\n';
    var blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var name = fileName(now);

    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    shadow.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 1000);

    return { name: name, size: blob.size, elements: ctx.stats.elements };
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
    '.panel{position:fixed;top:16px;right:16px;width:270px;background:#fff;color:#1f2937;',
    '  border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);overflow:hidden;font-size:13px;line-height:1.4}',
    '.head{display:flex;align-items:center;justify-content:space-between;background:#1f2937;color:#fff;padding:9px 12px}',
    '.title{font-weight:700;letter-spacing:.5px}',
    '.ver{font-weight:400;opacity:.6;font-size:11px;margin-left:6px}',
    '.close{all:unset;cursor:pointer;width:22px;height:22px;text-align:center;line-height:22px;border-radius:4px;font-size:14px}',
    '.close:hover{background:rgba(255,255,255,.15)}',
    '.body{padding:12px}',
    '.label{font-weight:600;margin-bottom:6px}',
    '.row{display:flex;align-items:center;gap:8px;margin:4px 0 4px 2px;cursor:pointer}',
    '.row input{margin:0;cursor:pointer}',
    '.hint{color:#6b7280;font-size:11px;margin:0 0 0 24px}',
    '.sep{height:1px;background:#e5e7eb;margin:10px 0}',
    '.btn{all:unset;display:block;width:100%;box-sizing:border-box;text-align:center;cursor:pointer;margin-top:12px;',
    '  padding:8px 0;border-radius:6px;background:#2563eb;color:#fff;font-weight:600;font-size:13px}',
    '.btn:hover{background:#1d4ed8}',
    '.btn.cancel{background:#dc2626}',
    '.btn.cancel:hover{background:#b91c1c}',
    '.status{margin-top:10px;padding:7px 9px;border-radius:6px;font-size:12px;display:none;word-break:break-all}',
    '.status.info{display:block;background:#eff6ff;color:#1e40af}',
    '.status.ok{display:block;background:#ecfdf5;color:#065f46}',
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
  var chkSanitize = h('input', { type: 'checkbox' });
  radioFull.checked = settings.mode === 'full';
  radioRegion.checked = settings.mode === 'region';
  chkSanitize.checked = settings.sanitize;

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
      h('div', { 'class': 'label', text: 'Chế độ:' }),
      h('label', { 'class': 'row' }, [radioFull, 'Cả trang']),
      h('label', { 'class': 'row' }, [radioRegion, 'Chọn vùng']),
      h('div', { 'class': 'sep' }),
      h('label', { 'class': 'row' }, [chkSanitize, 'Làm sạch dữ liệu']),
      h('p', { 'class': 'hint', text: 'Thay chữ hiển thị bằng [TEXT] để không lộ dữ liệu khách hàng' }),
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
      sanitize: chkSanitize.checked
    };
  }

  function setControlsDisabled(disabled) {
    radioFull.disabled = disabled;
    radioRegion.disabled = disabled;
    chkSanitize.disabled = disabled;
  }

  function doExport(rootEl, modeLabel) {
    try {
      var res = exportDom(rootEl, modeLabel, chkSanitize.checked);
      setStatus('ok', 'Đã xuất: ' + res.name + ' — ' + formatSize(res.size) + ', ' + res.elements + ' phần tử');
    } catch (err) {
      setStatus('err', 'Lỗi khi xuất: ' + (err && err.message ? err.message : err));
      console.error('[xuat_dom]', err);
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
    var t = e.target;
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
    var c = el.firstElementChild;
    while (c && (SKIP_TAGS[c.localName] || c.id === HOST_ID)) c = c.nextElementSibling;
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
      var p = current.parentElement;
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

  [radioFull, radioRegion, chkSanitize].forEach(function (inp) {
    inp.addEventListener('change', function () { saveSettings(readUiSettings()); });
  });

  btnClose.addEventListener('click', function () {
    if (picking) stopPick();
    host.remove();
  });
})();
