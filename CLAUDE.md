# Bookmarklet Library — ZinZinMotor (zzm.vn)

Tài liệu tổng hợp dự án. Đọc file này trước khi làm bất cứ việc gì.

---

## 1. Người dùng & Nguyên tắc làm việc (BẮT BUỘC)

- Chủ dự án: **Thân Quang Vinh** — kỹ sư vận hành tại ZinZinMotor. Giao tiếp **tiếng Việt**.
- **Thảo luận & thống nhất thiết kế trước**, hỏi ý kiến trước khi viết mới / sửa code.
- **Không tự ý đổi logic gốc** đang chạy ổn định. Chỉ sửa đúng chỗ, không refactor, không đổi tên biến, không thêm tính năng ngoài yêu cầu.
- Khi hướng dẫn sửa: ghi đúng thụt dòng. Khi đưa code: file hoàn chỉnh, không dùng `...`.
- Thấy vấn đề → nêu ra trước. Yêu cầu chưa rõ → hỏi lại (dùng câu hỏi có lựa chọn, đề xuất phương án Recommended).
- Dữ liệu kinh doanh phải chính xác tuyệt đối. Ưu tiên automation, UI đẹp & dễ dùng.
- Commit/push: **người dùng tự làm**. Không tự commit.
- **Không bao giờ đề xuất gộp 2 file JS** — mỗi file có đặc thù chạy riêng.

---

## 2. Cấu trúc dự án

| File | Vai trò |
|---|---|
| `js/them_san_pham_dan_ao.js` | **Bookmarklet** — gắn sản phẩm (theo SKU) vào từng Xe trong repeater ACF |
| `js/tao_phoi_san_pham.js` | **Userscript Tampermonkey** — tự điền & tạo phôi sản phẩm mới (v1.4) |
| `js/xuat_dom.js` | **Bookmarklet** — xuất cây DOM của trang bất kỳ (copy / tải file) để Claude phân tích (v2.0.1) |
| `_headers` | Cloudflare Pages: đặt `charset=UTF-8` cho JS/CSS/HTML (sửa lỗi font tiếng Việt) |
| `css/panel.css` | Hiện **không được dùng** (CSS nằm inline trong JS) |
| `index.html` | Trang chủ tĩnh của host |
| `CLAUDE.md` | File này |

### Triển khai (deploy)
- Repo GitHub → **Cloudflare Pages** tự build khi push `main` → `https://bookmarklet-library.pages.dev/`
- ⚠️ Toàn bộ repo (kể cả file này) là **công khai** trên pages.dev — không đưa mật khẩu/token vào.

### Cách chạy từng file
**Bookmarklet (`them_san_pham_dan_ao.js`)** — loader, luôn tải bản mới nhất nhờ `?v=Date.now()`:
```
javascript:(function(){    var s=document.createElement('script');    s.src='https://bookmarklet-library.pages.dev/js/them_san_pham_dan_ao.js?v='+Date.now();    document.body.appendChild(s);})();
```
File mới → chỉ đổi tên file trong `s.src`, giữ nguyên `?v='+Date.now()`.

**Bookmarklet (`xuat_dom.js`)** — cùng kiểu loader:
```
javascript:(function(){var s=document.createElement('script');s.src='https://bookmarklet-library.pages.dev/js/xuat_dom.js?t='+Date.now();document.body.appendChild(s);})();
```

⚠️ **Trang có CSP chặt (vd TikTok Seller Center) chặn bookmarklet loader** — xem mục 6.2.
Cách chạy thay thế đang dùng: **Chrome DevTools Snippets** (F12 → Sources → Snippets → snippet `xuat_dom` → Ctrl+Enter,
hoặc trong DevTools nhấn Ctrl+P gõ `!xuat_dom`). Code chạy từ DevTools không bị CSP của trang chặn.
Khi `xuat_dom.js` có bản mới → phải dán lại vào snippet.

**Tampermonkey (`tao_phoi_san_pham.js`)** — chạy bản dán sẵn trong Tampermonkey trên máy.
Chưa có `@updateURL/@downloadURL` → commit **không** tự cập nhật Tampermonkey; phải dán tay.
(Ý tưởng chờ duyệt: thêm `@updateURL/@downloadURL` + đổi tên `.user.js` để tự cập nhật.)

### Quy trình test trước khi commit
- Bookmarklet: Chrome DevTools → **Sources → Snippets** → dán toàn bộ file → Ctrl+S → Ctrl+Enter. (Hoặc Console, lần đầu gõ `allow pasting`.)
- Tampermonkey: Dashboard → mở script → dán toàn bộ file → Ctrl+S → mở trang tạo SP mới.
- Test xong **không bấm "Cập nhật"** (bookmarklet) / xoá các nháp test (Tampermonkey).
- Kiểm tra cú pháp nhanh: `node --check js/<file>.js`

---

## 3. `js/them_san_pham_dan_ao.js` — Bookmarklet gắn SP vào Xe

Chạy trên trang **sửa sản phẩm** WP admin có repeater "Xe".

### Cấu hình ACF
| Khoá | Ý nghĩa |
|---|---|
| `field_62343165dd16c` | Repeater cha — danh sách **Xe** |
| `field_62343183dd16e` | Textarea **tên xe** trong mỗi dòng Xe |
| `CFG.fkR = field_62342410d8494` | Repeater con — danh sách SP của 1 xe |
| `CFG.fkP = field_62342410d91a9` | Trường **Post Object** (select2) chọn SP |
| `CFG.ajax = /wp-admin/admin-ajax.php` | Endpoint tìm kiếm |

Nonce: lấy từ `data-nonce` của select → fallback `select[data-nonce][data-ajax="1"]` → fallback cứng `"9542c59af4"` (có thể đã hết hạn).

### Luồng xử lý (LOGIC GỐC — KHÔNG ĐỔI)
1. Bấm bookmarklet → bật/tắt panel `#zzm-nav-panel` (bấm lần 2 = đóng).
2. Đọc các dòng Xe (`.acf-row:not(.acf-clone)`), mỗi xe 1 khối nhập SKU.
3. Bấm **▶ Chạy** → gom task: xe được tick + có SKU (`{idx, skus, els}`).
4. Tuần tự từng xe → từng SKU:
   - `sl(300)` → `sAPI(sku)`: POST `acf/fields/post_object/query` (`s, paged:1, field_key, nonce, post_id`)
   - Lấy **`r[0]`** (kết quả đầu tiên) → `xid`, `xt`
   - Bấm `.acf-repeater-add-row` của repeater con → chờ dòng mới (30 × 100ms)
   - `sl(200)` → chờ select2 khởi tạo (20 × 100ms) → `append(new Option(xt, xid, true, true)).trigger("change")`
   - `sl(300)`
5. Xong → nhắc bấm **"CẬP NHẬT"** để lưu bài.

### Giao diện (làm lại 2026-10-27, commit `78eeded`)
- Mỗi xe = 1 bảng `.sku-tb`: cột `# | Mã SKU | Trạng thái / Sản phẩm | ✖`.
- **Paste** cột từ Excel/Sheets → tự tách (`\r?\n` hoặc `\t`) mỗi mã 1 ô, chèn sau ô đang chọn (ô trống thì điền vào chính nó).
- Phím: Enter/↓ xuống, ↑ lên, Backspace ở ô trống = xoá dòng; nút ✖ xoá dòng. Luôn có 1 ô trống cuối bảng.
- Mã **trùng** trong cùng xe → nền vàng (`tr.dup`), chỉ cảnh báo, vẫn chạy.
- Trạng thái dòng (`setSt`): `⏳ Chờ chạy` → `run` (xanh dương, tự cuộn tới) → `ok` (xanh lá + tên SP khớp) / `err` (**đỏ** + lý do).
- Đầu mỗi xe: `🔹 n mã · ⚠ trùng` → sau chạy `✅ ok · ❌ lỗi / tổng`. Nút **📋 Copy mã lỗi (n)**.
- Thanh tổng kết `#zzm-sum`: Xe có dữ liệu, Tổng SKU, Đã thêm, Lỗi, thông báo tiến trình / nhắc "CẬP NHẬT".
- Log chi tiết đen-xanh `#zzm-nlog` **ẩn mặc định**, nút "📜 Xem log chi tiết".
- Panel rộng 550px, **không khoá ô** khi chạy (người dùng chọn vậy). CSS input có prefix `#zzm-nav-panel` để thắng CSS WP admin.

### Các rủi ro đã biết (chưa sửa — người dùng chưa yêu cầu)
1. Lấy `r[0]` không so khớp chính xác SKU → có thể gắn nhầm SP (cột tên SP giúp phát hiện bằng mắt).
2. `sAPI` nuốt lỗi (nonce hết hạn / mạng) → báo "Không tìm thấy".
3. Không chặn SKU đã có sẵn trong xe.
4. Dòng rỗng có thể bị bỏ lại nếu không tìm thấy `select`.
5. Listener `mousemove/mouseup` trên `document` không gỡ khi đóng panel.

---

## 4. `js/tao_phoi_san_pham.js` — Tampermonkey tạo phôi (v1.4)

`@match` `post-new.php*` và `post.php*` trên zzm.vn, `@run-at document-idle`, `@grant none`.

### Cấu hình
- `CFG_GOC`: giá trị gốc (ảnh `thumbId 73630`, tên, nơi SX, tình trạng, ĐVT, giá `9999999`, thương hiệu, dòng xe, mô tả ngắn, `quanLyTonKho`, `tuDongDien`).
- Cài đặt người dùng lưu `localStorage["zzm_phoi_cfg"]`, gộp đè lên `CFG_GOC` (`docCFG/luuCFG`).
- Màn hình ⚙️ Cài đặt: sửa ảnh, các trường text, thương hiệu/dòng xe (mỗi dòng 1 tên), mô tả. **Không** có `tuDongDien`, `quanLyTonKho`.

### Trường được điền (`dienForm`)
| Panel | Ô WordPress |
|---|---|
| Tên | `#title` |
| Mô tả ngắn | TinyMCE `excerpt` (fallback tab HTML `#excerpt-html`) |
| Nơi sản xuất | `#acf-field_62131508f975e` |
| Tình trạng | `#acf-field_62131542f9761` |
| Đơn vị tính | `#acf-field_621c667ee37f4` |
| Giá | `#_regular_price` |
| Quản lý tồn kho | `#_manage_stock` (chỉ bật, **không** điền SL dù UI ghi "SL = 1") |
| Ảnh | `#_thumbnail_id` (tạo hidden input nếu thiếu) + preview `#postimagediv` |
| Thương hiệu | tick `#thuonghieuchecklist label.selectit` (so khớp `norm()` không phân biệt hoa thường) |
| Dòng xe | tick `#dong-xechecklist label.selectit` |

Trả về `{ok, fail}`.

### Luồng thủ công (LOGIC GỐC — KHÔNG ĐỔI)
1. Trang `post-new.php?post_type=product` → chờ **1500ms** → dựng panel `#zzm-phoi-panel` → nếu `tuDongDien` thì tự `dienForm()`.
2. **▶ Chỉ điền form**: điền, không lưu.
3. **💾 Lưu & Tạo phôi tiếp theo**: `dienForm()` → có lỗi thì DỪNG, không lưu → không lỗi: set `sessionStorage["zzm_tao_lien_tuc"]="1"` → sau 700ms click `#save-post`.
4. Trang `post.php` có cờ `zzm_tao_lien_tuc` → banner xanh → 900ms → chuyển về `URL_NEW`.
5. ✖ đóng panel → xoá cờ (và huỷ auto).

### 🔁 Chạy tự động N phôi (thêm 2026-10-27, v1.4)
Khoá `sessionStorage`: `zzm_auto_tong` (N), `zzm_auto_xong` (đã lưu), `zzm_auto_id_cuoi` (ID bài vừa đếm).
- UI: hàng `#zp-auto-cfg` (ô số phôi + nút **🔁 Chạy tự động**) ↔ `#zp-auto-run` (chữ tiến độ + thanh `#zp-auto-fill` + **⏹ Dừng**).
- Bấm chạy → kiểm tra số nguyên ≥ 1 → set khoá → `napPanelDien()` (**mọi phôi dùng Cài đặt đã lưu** — người dùng chọn) → `chayAutoPhoi()`.
- `chayAutoPhoi()`: **đếm ngược 2s** (huỷ được bằng Dừng/✖) → xoá cờ → gọi lại đúng `#zzm-phoi-save.onclick()` → nếu cờ không được bật (có lỗi) → `dungAuto()`; kiểm tra lại sau 900ms (không có nút lưu).
- Trang `post.php`: `xuLyAutoSauLuu()` → `daLuuThanhCong()` xác nhận đã lưu → mỗi `post=ID` chỉ đếm 1 lần (chống F5) → chưa đủ N: chuyển tiếp; đủ N: xoá cờ + khoá, banner **"🏁 ĐÃ TẠO XONG N/N PHÔI!"** (bấm để ẩn). Không xác nhận được → banner đỏ, dừng.
- Trang mới khi đang auto (có cờ) → tự `chayAutoPhoi()`; khoá auto mà không có cờ → dọn khoá.
- Các ô tick tắt trường trên panel chỉ áp dụng trang hiện tại (phôi sau tick đủ lại).

### ⚠️ Bài học: WordPress xoá `message=` khỏi URL
Sau khi lưu, WP chuyển tới `post.php?post=X&action=edit&message=10` rồi **`history.replaceState` xoá `message=`** trước khi userscript chạy → đọc `location.search` sẽ báo sai "chưa lưu" (lỗi đã gặp ở phôi 1/5).
Cách đúng (`daLuuThanhCong`): `performance.getEntriesByType("navigation")[0].name` chứa `message=` **hoặc** có `#message.updated / #message.notice-success`.

### Các rủi ro đã biết (chưa sửa — người dùng chưa yêu cầu)
1. Chế độ thủ công: cờ `zzm_tao_lien_tuc` không tự tắt → mở sửa bài bất kỳ trong cùng tab sẽ bị chuyển sang tạo mới (chế độ auto đã tự dọn khi xong).
2. Bấm "Lưu & Tạo" chạy lại `dienForm()` → ghi đè thay đổi sửa tay trên form WP.
3. UI ghi "SL mặc định = 1" nhưng không điền số lượng.
4. Chờ cố định 1500ms — trang chậm có thể báo "Không tìm thấy ô…".

---

## 5. `js/xuat_dom.js` — Bookmarklet xuất DOM (v2.0.1)

Mục đích: người dùng xuất DOM của trang cần làm automation (zzm.vn, Shopee Kênh Người bán…) rồi
**gửi file/dán nội dung cho Claude phân tích**, thay vì copy DOM thủ công.
Khi nhận được file xuất, đọc **phần đầu `<!-- … -->`** trước: URL, chế độ, đường dẫn CSS vùng chọn, công nghệ, thống kê, quy ước.
File tải về mặc định nằm ở **`C:\down ảnh`** (tên: `<tên miền>_<slug tiêu đề>_<yyyymmdd-hhmm>.html`).

### Nguyên tắc an toàn (giữ nguyên khi phát triển)
- Chỉ ĐỌC trang; panel nằm trong **Shadow DOM** (`#__xuat_dom_host__`) — không đụng CSS/DOM trang.
- Không có fetch/XHR/POST. Kết quả chỉ copy clipboard hoặc tải file.
- Cài đặt nhớ theo từng trang: `localStorage["xuatDom.settings"]` = `{mode, clean, collapse, output}`.

### Giao diện panel
- **Chế độ:** Cả trang / Chọn vùng (rê chuột tô sáng, Click xuất, ↑ thẻ cha, ↓ thu hẹp, Esc hủy; chọn trúng phần tử trong Shadow DOM qua `composedPath()[0]`).
- **Làm sạch:** Tắt / **Thông minh** (mặc định) / Nghiêm ngặt.
- **☑ Gộp phần tử lặp lại** (mặc định bật).
- **Xuất ra:** 📋 Copy (mặc định; lỗi → tự tải file; > 500 KB → cảnh báo vàng) / ⬇ Tải file.

### Bộ chuyển DOM → HTML (`serializeNode` / `serializeChildren`)
- Bỏ: `style`, `noscript`, comment, `style` inline, nội dung script nội tuyến (chỉ đếm), hình vẽ trong svg, **`data-v-xxxxxxxx(-s)` của Vue** (`RX_VUE_SCOPE`).
- Giữ thuộc tính: `KEEP_ATTRS` (id, class, name, type, role, placeholder, href, value, for, checked, selected, disabled, readonly, required, multiple, action, method, src, alt, title, rel, content, label, target, colspan, rowspan, hidden, contenteditable, lang, charset, property, http-equiv) + mọi `data-*`, `aria-*`.
- **Trạng thái thực tế** (`collectAttrs`): input → `el.value`; checkbox/radio → `el.checked`; option → `el.selected`; textarea → `el.value`; password → `[MẬT KHẨU]`.
- `<script src>` giữ thẻ rỗng; JSON-LD giữ ≤ 3000 ký tự; `<svg>` giữ vỏ + `<title>` + `<!-- icon: #use-href -->`.
- Đọc `shadowRoot` mở (`<!-- #shadow-root (open) -->`), nội dung `<template>`, iframe cùng tên miền (khác tên miền → ghi chú).
- **Ẩn:** `data-xd-an="1"` chỉ ở phần tử ẩn ngoài cùng (`checkVisibility({visibilityProperty:true})`, trừ `display:contents`); bỏ qua `NON_VISUAL`, `input[type=hidden]`, nội dung `head`/`template`.
- **Gộp lặp:** ≥ 6 anh em liền kề cùng `thẻ + class` → giữ 3, ghi `<!-- … lược bỏ N phần tử giống nhau (tag.class) -->`. Không gộp `meta`, `link`, `script`.
- Cắt bớt: chữ & thuộc tính > 300 ký tự → `…[+N ký tự]`. Data URI → `[BASE64]`. Thụt dòng 2 dấu cách/cấp.

### Làm sạch
| Mức | Chữ | Thuộc tính / URL |
|---|---|---|
| Tắt | giữ nguyên | giữ nguyên |
| **Thông minh** | giữ chữ & **số** (giá, tồn kho, mã SP); che `[EMAIL]`, `[SĐT]` | che `[ẨN]`: tên thuộc tính khớp `SECRET_NAME_RX` (data-nonce…), value/content của phần tử có `name` chứa nonce/token/security; tham số URL khớp `SECRET_PARAM_RX` (`_wpnonce`, `key`, `token`…); `mailto:` / `tel:` |
| Nghiêm ngặt | `[TEXT]`, trừ chữ trong `UI_TEXT_SEL` (button, label, option, th, legend, h1–h6, summary, caption, svg); che thêm `[SỐ]` (≥ 6 chữ số) | như Thông minh + value ô nhập → `[TEXT]` |

URL & tiêu đề ở phần đầu file cũng được làm sạch.

### Phần đầu file (header)
URL, Tiêu đề, Thời gian, Ngôn ngữ, Trạng thái tải, Cửa sổ + vị trí cuộn, **Công nghệ** (`techInfo`: WordPress/phiên bản — admin đọc từ body class `version-x-y`, WooCommerce, ACF, jQuery, select2, TinyMCE, Next.js, React, Vue, Angular), Chế độ (+ đường dẫn CSS vùng chọn, có `#shadow-root`), Làm sạch (số chỗ che), Phần tử (ẩn, shadow root), Gộp lặp, Script, Iframe, Đã loại bỏ, **Quy ước ký hiệu**.

### Kết quả kiểm chứng
- **Shopee** (2026-11-13, "Thông tin bán hàng"): v2.0.0 → v2.0.1: giá `[SỐ]` → `157000`; 2.180 thuộc tính Vue → 0; 273 KB → 233 KB. Thụt dòng vẫn chiếm ~60% dung lượng.
- **TikTok Seller Center** (2026-11-13, chạy qua Snippets, vùng `div#productlisting_sales_info`): 58 KB, 423 phần tử; lấy đủ giá trị thực tế (tồn kho, giá, SKU người bán, tùy chọn); không che nhầm.
  Nhược điểm: dòng "Công nghệ" = "(không nhận diện được)" dù trang dùng React 18 + Arco Design.

### Ý tưởng chờ (chưa làm — cần hỏi trước)
- Thụt dòng 1 dấu cách/cấp (giảm thêm ~25–30%).
- Checkbox "Rút gọn phần tử ẩn" (mặc định tắt): chỉ giữ thẻ ngoài + số phần tử con.
- `techInfo`: nhận diện React 18 qua thuộc tính `__reactFiber$…` / `__reactContainer$…` / `_reactRootContainer` trên phần tử; nhận diện Arco Design qua class `arco-icon` / `core-*`.
- Bản Tampermonkey của xuat_dom (menu "📋 Xuất DOM", chạy mọi trang kể cả trang CSP chặt).
- Bookmarklet nhúng toàn bộ code (nén 1 dòng, ~25 KB) — chạy được trên TikTok vì `default-src` có `'unsafe-inline'`; phải dán lại mỗi bản mới, hỏng nếu TikTok bỏ `'unsafe-inline'`.

---

## 6. Nền tảng bên ngoài (phục vụ automation sắp tới)

### 6.1 Shopee — Kênh Người bán (`banhang.shopee.vn`)
- Viết bằng **Vue 3**; có thuộc tính `data-v-xxxxxxxx` (đã lọc khi xuất DOM).
- **Không chặn** bookmarklet loader → `xuat_dom.js` chạy bằng bookmarklet bình thường.
- Trang sửa SP: `/portal/product/<id>`; vùng "Thông tin bán hàng" = `div.product-detail-panel.product-sales-info`.
- Ô giá phân loại: `.price-input input.eds-input__input`; có thuộc tính hữu ích `data-product-edit-field-unique-id="priceMo…"`.
- Thư viện giao diện: `eds-*` (eds-input, eds-button, eds-popper…).

### 6.2 TikTok Shop Seller Center (`seller-vn.tiktok.com`)
**CSP (nguyên nhân bookmarklet loader không chạy):** trang gửi 2 lớp chính sách:
- `Content-Security-Policy-Report-Only: script-src …` → chỉ ghi log, không chặn.
- `Content-Security-Policy: default-src 'self' 'unsafe-eval' 'unsafe-inline' blob: … *.cloudflare.com … unpkg.com …` → **chặn thật**.
  `bookmarklet-library.pages.dev` không có trong danh sách → `<script src>` bị chặn (log: *"The action has been blocked"*).
  Bản thân đoạn `javascript:` vẫn chạy (`'unsafe-inline'` được phép).
- Header của trang chuyển hướng/đăng nhập còn có `script-src … 'nonce-…' 'strict-dynamic'`.
- Log console khác (`sw-backend.js`, `Dynokit`, `AgenticUI`, `GSAP`, `[SR]`, inline-script report-only…) là nhiễu của TikTok — bỏ qua.
- **Không dùng** tiện ích "Disable CSP" (rủi ro khi đang đăng nhập tài khoản người bán), **không** đưa code lên npm/unpkg để lách.
- → Xuất DOM: dùng **DevTools Snippets**. Automation: viết **userscript Tampermonkey** (không bị CSP trang chặn).

**Công nghệ:** **React 18** (không có `window.React`, không có `data-reactroot`) + thư viện giao diện **Arco Design** (class `core-*`, `arco-icon`, `pulse-*`, `data-tid="m4b_*"`).

**Trang sửa SP:** `/product/edit/<productId>?category_id=…&root_category_id=…&shop_region=VN&tab=2`
Vùng "Thông tin bán hàng": `div#productlisting_sales_info`.

**Selector bền — ưu tiên `data-id` (có ý nghĩa, không mã băm):**
| Thành phần | Selector | Ghi chú |
|---|---|---|
| Bật/tắt biến thể | `[data-id="product.publish.variation.switch"] button[role=switch]` | trạng thái ở `aria-checked` |
| Tên biến thể (cascader) | `[data-id^="product.publish.sale_property.name."]` | vd "VỊ TRÍ" |
| Ô tên tùy chọn | `input[data-id^="product.publish.sale_property.value.name."]` | số cuối là id tùy chọn (805, 807…) |
| Ảnh tùy chọn | `[data-id^="product.publish.sale_property.value.image."]` | cùng số id với ô tên |
| Sửa hàng loạt | `[data-id="product.publish.skus.batch_edit"]` | chọn SKU (combobox), tồn kho, giá |
| ├ Tồn kho hàng loạt | `[data-id="product.publish.skus.batch_edit.stock"] input` | placeholder "Số lượng" |
| ├ Giá hàng loạt | `[data-id="product.publish.skus.batch_edit.price"] input` | placeholder "Giá bán lẻ" |
| └ Nút "Áp dụng" | nút chứa chữ "Áp dụng" trong `.pulse-button-group` (data-uid `…button_onapply…`) | |
| Phóng to bảng SKU | `[data-id="product.publish.skus.fullscreen_toggle"]` | |
| Dòng SKU | `#productlisting_sales_info table tbody tr.core-table-tr` | |
| **Tồn kho 1 SKU** | `[data-id="product.publish.skus.stock.<skuId>"] input` | `value="2"`, `aria-valuenow="2"` |
| **Giá 1 SKU** | `[data-id="product.publish.skus.sale_price.<skuId>"] input` | `value="398.000"` (có dấu chấm), `aria-valuenow="398000"` (số thô) |
| **SKU người bán** | `input#skus<skuId>` | vd `#skus1737620134400001451` → `64300K27V00ZA` |

- Cột bảng SKU (thead): [Tên tùy chọn, vd "VỊ TRÍ"] | **Hàng có sẵn*** | **Giá bán lẻ*** | SKU người bán | (nút xoá).
- `skuId` là số dài 19 chữ số (vd `1737620134400001451`) → từ SKU người bán tìm được `skuId` rồi điền đúng tồn kho/giá cùng dòng.
- Đọc số: **dùng `aria-valuenow`** (số thô), không dùng `value` đã định dạng.

**KHÔNG dùng làm selector (đổi sau mỗi lần TikTok build):**
- Class có mã băm: `_shadowTips_7rrvi_5`, `_iconUploadContainer_zs0xj_123`, `sc-jsJBEP`, `kPToOl`…
- Đuôi băm của `data-uid` (vd `shop_product:button:ad5a3`) — chỉ dùng phần chữ nếu cần (`button_onapply`, `button_ondeletesku`).
- `id="skus"` — TikTok **dùng trùng** cho nhiều phần tử.
- `data-v="eqdc58"`, `data-vv="…"` (mã phiên bản component).

**Lưu ý khi viết automation:**
- Input là **React controlled** → gán `el.value = x` không có tác dụng. Phải gọi setter gốc
  `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, x)` rồi `dispatchEvent(new Event('input', {bubbles:true}))` (+ `change`/`blur` nếu cần) — cần test thực tế.
- Phần tử ẩn (`data-xd-an`): popup hover ảnh, icon xoá nội dung (`core-input-clear-icon`), `_shadowTips_*`, `DndDescribedBy-*` (chữ trợ năng kéo-thả) → bỏ qua.
- Danh sách tùy chọn / dòng SKU kéo-thả được (`aria-roledescription="sortable"`) → không dựa vào thứ tự, dựa vào `data-id`.

**Hướng automation đã gợi ý (chờ người dùng mô tả quy trình):**
paste danh sách *SKU người bán | tồn kho | giá* từ Excel → tự điền đúng dòng (giống bảng SKU của `them_san_pham_dan_ao.js`); hoặc tạo biến thể/tùy chọn hàng loạt.

---

## 7. Lịch sử
| Commit | Nội dung |
|---|---|
| `28ec69f` → `952cf25` | Khởi tạo, sửa JS đầu tiên, sửa font tiếng Việt (`_headers`) |
| `433d165` | Đổi tên thành `them_san_pham_dan_ao` |
| `ebb2c65` | Thêm `tao_phoi_san_pham.js` (Tampermonkey v1.3) |
| `78eeded` | Làm lại giao diện bookmarklet: bảng SKU + trạng thái từng dòng |
| `1ba61c3` | Tampermonkey v1.4: Chạy tự động N phôi + sửa xác nhận lưu bằng `daLuuThanhCong()` |
| `4cc2d31`, `2a9a6d9` | Thêm `xuat_dom.js` v1.0.0 (người dùng tự viết) |
| `001eadd` | `xuat_dom.js` v2.0.0 (thuộc tính/trạng thái form, làm sạch 3 mức, Shadow DOM, copy, gộp lặp, đánh dấu ẩn) |
| `820df11` | `xuat_dom.js` v2.0.1 (Thông minh không che số; bỏ `data-v-*` của Vue) |
| `ac9b4f5` | Bổ sung mục `xuat_dom.js` vào `CLAUDE.md` |
| (chưa commit) | `CLAUDE.md`: mục 6 — Shopee & TikTok Seller Center (CSP, selector, lưu ý React) |

`them_san_pham_dan_ao.js` và `tao_phoi_san_pham.js` đã được người dùng xác nhận **chạy ổn định online** (2026-10-27).
`xuat_dom.js` v2.0.1 đã test thực tế trên Shopee (bookmarklet) và TikTok Seller Center (Snippets) (2026-11-13).

## 8. Ý tưởng chờ (chưa làm — cần hỏi trước)
- Tampermonkey tự cập nhật (`@updateURL/@downloadURL`, đổi tên `.user.js`).
- Bookmarklet: so khớp SKU chính xác, báo lỗi API thật, chạy lại riêng mã lỗi, khoá ô khi chạy.
- Tampermonkey: danh sách ID phôi đã tạo, giới hạn/xác nhận số lượng lớn, điền SL tồn kho = 1.
- Xuất DOM: xem mục 5 → "Ý tưởng chờ".
- TikTok Seller Center: userscript Tampermonkey tự điền tồn kho/giá theo SKU người bán (xem mục 6.2).
