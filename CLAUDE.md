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

## 5. Lịch sử
| Commit | Nội dung |
|---|---|
| `28ec69f` → `952cf25` | Khởi tạo, sửa JS đầu tiên, sửa font tiếng Việt (`_headers`) |
| `433d165` | Đổi tên thành `them_san_pham_dan_ao` |
| `ebb2c65` | Thêm `tao_phoi_san_pham.js` (Tampermonkey v1.3) |
| `78eeded` | Làm lại giao diện bookmarklet: bảng SKU + trạng thái từng dòng |
| (sau đó) | Tampermonkey v1.4: Chạy tự động N phôi + sửa xác nhận lưu bằng `daLuuThanhCong()` |

Cả 2 công cụ đã được người dùng test & xác nhận **chạy ổn định online** (2026-10-27).

## 6. Ý tưởng chờ (chưa làm — cần hỏi trước)
- Tampermonkey tự cập nhật (`@updateURL/@downloadURL`, đổi tên `.user.js`).
- Bookmarklet: so khớp SKU chính xác, báo lỗi API thật, chạy lại riêng mã lỗi, khoá ô khi chạy.
- Tampermonkey: danh sách ID phôi đã tạo, giới hạn/xác nhận số lượng lớn, điền SL tồn kho = 1.
