// ==UserScript==
// @name         ZZM — Điền Phôi Sản Phẩm
// @namespace    https://zzm.vn/
// @version      1.3
// @description  Tự động điền phôi + vòng lặp + cài đặt mặc định qua giao diện
// @author       ZINZINMOTOR
// @match        https://zzm.vn/wp-admin/post-new.php*
// @match        https://zzm.vn/wp-admin/post.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ════════════════════════════════════════════════════════════
  // ⚙️  CẤU HÌNH GỐC — chỉ dùng cho LẦN ĐẦU (khi chưa lưu cài đặt)
  // ════════════════════════════════════════════════════════════
  var CFG_GOC = {
    thumbId: "73630",
    thumbSrc:
      "https://zzm.vn/wp-content/uploads/2025/02/Phu-Tung-Xe-May-Chinh-Hang-1-300x300.jpg",
    thumbName: "Phu-Tung-Xe-May-Chinh-Hang-1.jpg",
    tenSP: "Sản Phẩm Mới",
    noiSX: "Việt Nam",
    tinhTrang: "Mới 100%",
    dvt: "1 Cái",
    gia: "9999999",
    quanLyTonKho: true,
    thuongHieu: ["Honda"],
    dongXe: ["Air Blade 125 (2026 - Nay)"],
    tuDongDien: true,
    moTa: "✅ LƯU Ý ĐẾN QUÝ KHÁCH HÀNG\n– Vị trí (Trái/Phải) của sản phẩm được tính theo hướng người ngồi lái (từ Đuôi xe → Đầu xe).\n– Sản phẩm được bán theo mã sản phẩm trong Catalogue của nhà sản xuất (một số Sản Phẩm sẽ có Nhiều Mã Sản Phẩm VD: Đồng hồ Vario 150 K59J có các mã sản phẩm 37100K59A71 hoặc 37100K59A72 hoặc 37100K59A73…).\n– Sản phẩm sẽ Được Kiểm Tra Hàng, Quý khách hàng khi mở kiện hàng nên quay video để có cơ sở giải quyết khiếu nại (nếu có).\n– Chất lượng sơn, mạ, đúc, bề mặt phụ tùng là yếu tố ngoại quan và phụ thuộc hoàn toàn vào phía nhà sản xuất.\n– Quý khách hàng nếu chưa rõ về thông tin Sản Phẩm hoặc Dịch Vụ vui lòng CHAT hoặc GỌI TRỰC TIẾP ☎️0909 666 983☎️ để được tư vấn và hỗ trợ.",
  };
  // ════════════════════════════════════════════════════════════
  // /CẤU HÌNH GỐC — Không cần sửa bất cứ thứ gì phía dưới
  // ════════════════════════════════════════════════════════════

  var URL_NEW = "https://zzm.vn/wp-admin/post-new.php?post_type=product";
  var FLAG_KEY = "zzm_tao_lien_tuc";
  var STORE_KEY = "zzm_phoi_cfg";

  function docCFG() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        var merged = {};
        for (var k in CFG_GOC) merged[k] = CFG_GOC[k];
        for (var k2 in saved) merged[k2] = saved[k2];
        return merged;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(CFG_GOC));
  }
  function luuCFG(cfg) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      return false;
    }
  }

  var CFG = docCFG();

  var path = window.location.pathname;
  var isNewPage = path.indexOf("post-new.php") !== -1;
  var isEditPage = path.indexOf("post.php") !== -1;

  if (isEditPage) {
    if (sessionStorage.getItem(FLAG_KEY) === "1") {
      var note = document.createElement("div");
      note.style.cssText =
        "position:fixed;top:0;left:0;right:0;background:#1E8449;color:#fff;padding:14px;text-align:center;z-index:9999999;font-family:sans-serif;font-weight:bold;font-size:15px";
      note.textContent = "✅ Đã lưu nháp! Đang chuyển sang tạo phôi tiếp theo…";
      document.documentElement.appendChild(note);
      setTimeout(function () {
        window.location.href = URL_NEW;
      }, 900);
    }
    return;
  }

  if (!isNewPage || window.location.search.indexOf("post_type=product") === -1)
    return;

  setTimeout(function () {
    if (!document.getElementById("title")) return;

    var wcBox = document.getElementById("woocommerce-product-data");
    if (wcBox && wcBox.classList.contains("closed")) {
      var wcBtn = wcBox.querySelector(".handlediv");
      if (wcBtn) wcBtn.click();
    }

    var ST = document.createElement("style");
    ST.textContent = [
      "#zzm-phoi-panel{position:fixed;top:60px;right:20px;width:460px;",
      "max-height:90vh;display:flex;flex-direction:column;background:#fff;",
      "border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.3);",
      "z-index:999999;font-family:Segoe UI,sans-serif;font-size:13px;",
      "border:2px solid #1A5276;overflow:hidden;}",
      "#zzm-phoi-hd{background:#1A5276;color:#fff;padding:11px 16px;",
      "flex-shrink:0;display:flex;align-items:center;",
      "justify-content:space-between;font-weight:700;font-size:14px;",
      "cursor:move;user-select:none;}",
      ".zp-hd-btns{display:flex;gap:4px;align-items:center;}",
      ".zp-hd-btn{background:rgba(255,255,255,.2);border:none;color:#fff;",
      "font-size:14px;cursor:pointer;padding:3px 8px;line-height:1;",
      "border-radius:4px;}",
      ".zp-hd-btn:hover{background:rgba(255,255,255,.35);}",
      "#zzm-phoi-body{padding:12px 14px;overflow-y:auto;flex:1;",
      "display:flex;flex-direction:column;gap:7px;}",
      ".zp-sec{font-size:11px;font-weight:700;color:#1A5276;",
      "padding:4px 0 2px;border-bottom:1px solid #eee;}",
      ".zp-row{display:flex;align-items:flex-start;gap:8px;}",
      ".zp-row input[type=checkbox]{margin-top:3px;flex-shrink:0;cursor:pointer;}",
      ".zp-lbl{font-size:11px;font-weight:700;color:#555;",
      "white-space:nowrap;min-width:95px;margin-top:3px;}",
      ".zp-inp{flex:1;padding:5px 8px;border:2px solid #ddd;",
      "border-radius:5px;font-size:12px;font-family:inherit;outline:none;}",
      ".zp-inp:focus{border-color:#1A5276;}",
      ".zp-inp:disabled{background:#f5f5f5;color:#aaa;}",
      ".zp-ta{flex:1;padding:5px 8px;border:2px solid #ddd;",
      "border-radius:5px;font-size:11px;font-family:inherit;",
      "outline:none;resize:vertical;height:72px;}",
      ".zp-ta:focus{border-color:#1A5276;}",
      ".zp-ta:disabled{background:#f5f5f5;color:#aaa;}",
      ".zzm-tagbox{min-height:38px;max-height:88px;overflow-y:auto;",
      "border:2px solid #ddd;border-radius:5px;padding:4px 6px;",
      "display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;cursor:text;}",
      ".zzm-tagbox:focus-within{border-color:#1A5276;}",
      ".zzm-tag{display:inline-flex;align-items:center;gap:3px;",
      "background:#EAF2FF;color:#1A5276;border:1px solid #AED6F1;",
      "border-radius:4px;padding:2px 6px 2px 8px;font-size:11px;font-weight:600;}",
      ".zzm-tag-del{background:none;border:none;color:#85B6D4;",
      "font-size:14px;cursor:pointer;padding:0;line-height:1;}",
      ".zzm-tag-del:hover{color:#C0392B;}",
      ".zzm-tag-inp{border:none;outline:none;font-size:11px;",
      "font-family:inherit;min-width:80px;flex:1;height:20px;background:transparent;}",
      ".zp-thumb-preview{display:flex;align-items:center;gap:10px;flex:1;",
      "background:#f8f9fa;border:1px solid #ddd;border-radius:5px;padding:6px 8px;}",
      ".zp-thumb-preview img{width:48px;height:48px;object-fit:cover;",
      "border-radius:4px;border:1px solid #ddd;}",
      ".zp-thumb-info{font-size:11px;color:#555;line-height:1.5;}",
      ".zp-thumb-info strong{color:#1A5276;display:block;}",
      "#zzm-phoi-ft{padding:10px 14px;display:flex;flex-direction:column;gap:6px;",
      "border-top:1px solid #eee;flex-shrink:0;}",
      ".zp-ft-row{display:flex;gap:8px;}",
      "#zzm-phoi-run{flex:1;background:#fff;color:#1A5276;border:2px solid #1A5276;",
      "border-radius:6px;padding:9px;font-size:12.5px;font-weight:700;",
      "cursor:pointer;font-family:inherit;}",
      "#zzm-phoi-run:hover{background:#EAF2FF;}",
      "#zzm-phoi-rst{background:#f5f5f5;color:#666;border:1.5px solid #ddd;",
      "border-radius:6px;padding:9px 14px;font-size:12px;font-weight:600;",
      "cursor:pointer;font-family:inherit;}",
      "#zzm-phoi-rst:hover{background:#e8e8e8;}",
      "#zzm-phoi-save{flex:1;background:#1E8449;color:#fff;border:none;",
      "border-radius:6px;padding:11px;font-size:13px;font-weight:700;",
      "cursor:pointer;font-family:inherit;}",
      "#zzm-phoi-save:hover{filter:brightness(.92);}",
      "#zzm-phoi-log{display:none;max-height:160px;overflow-y:auto;",
      "padding:10px 14px;background:#f8f9fa;border-top:1px solid #eee;",
      "font-family:monospace;font-size:11px;line-height:1.8;flex-shrink:0;}",
      ".ll-ok{color:#1E8449;}.ll-err{color:#C0392B;}",
      ".ll-info{color:#1A5276;font-weight:700;}.ll-warn{color:#784212;}",
      "#zzm-set-body{display:none;padding:12px 14px;overflow-y:auto;flex:1;",
      "flex-direction:column;gap:8px;background:#F8FBFF;}",
      ".zs-note{font-size:11px;color:#555;background:#EAF2FF;",
      "border:1px solid #AED6F1;border-radius:6px;padding:8px 10px;line-height:1.5;}",
      ".zs-grp{background:#fff;border:1.5px solid #E0E6EC;border-radius:7px;",
      "padding:10px 12px;}",
      ".zs-grp-title{font-size:10.5px;font-weight:700;color:#1A5276;",
      "text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;}",
      ".zs-row{display:flex;align-items:flex-start;gap:8px;margin-bottom:7px;}",
      ".zs-row:last-child{margin-bottom:0;}",
      ".zs-lbl{font-size:11px;font-weight:700;color:#555;min-width:78px;",
      "margin-top:7px;font-family:monospace;}",
      ".zs-inp{flex:1;padding:6px 9px;border:2px solid #ddd;border-radius:5px;",
      "font-size:12px;font-family:inherit;outline:none;}",
      ".zs-inp:focus{border-color:#1A5276;}",
      ".zs-ta{flex:1;padding:6px 9px;border:2px solid #ddd;border-radius:5px;",
      "font-size:11px;font-family:inherit;outline:none;resize:vertical;height:80px;}",
      ".zs-ta:focus{border-color:#1A5276;}",
      "#zzm-set-ft{display:none;padding:10px 14px;gap:8px;",
      "border-top:1px solid #eee;flex-shrink:0;}",
      "#zs-save{flex:1;background:#1E8449;color:#fff;border:none;border-radius:6px;",
      "padding:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}",
      "#zs-save:hover{filter:brightness(.92);}",
      "#zs-default{background:#FDEDEC;color:#C0392B;border:1.5px solid #F5C6C2;",
      "border-radius:6px;padding:11px 14px;font-size:12px;font-weight:600;",
      "cursor:pointer;font-family:inherit;}",
      "#zs-default:hover{background:#FADBD8;}",
    ].join("");
    document.head.appendChild(ST);

    var P = document.createElement("div");
    P.id = "zzm-phoi-panel";
    P.innerHTML = [
      '<div id="zzm-phoi-hd">',
      '<span id="zzm-hd-title">📋 Điền Phôi Sản Phẩm — ZZM</span>',
      '<div class="zp-hd-btns">',
      '<button class="zp-hd-btn" id="zzm-btn-set" title="Cài đặt mặc định">⚙️</button>',
      '<button class="zp-hd-btn" id="zzm-phoi-close" title="Đóng">✖</button>',
      "</div>",
      "</div>",
      '<div id="zzm-phoi-body">',
      '<div class="zp-sec">📝 THÔNG TIN CƠ BẢN</div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-ten" checked>',
      '<span class="zp-lbl">Tên sản phẩm</span>',
      '<input type="text" class="zp-inp" id="zp-ten"></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-mota" checked>',
      '<span class="zp-lbl">Mô tả ngắn</span>',
      '<textarea class="zp-ta" id="zp-mota"></textarea></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-nsx" checked>',
      '<span class="zp-lbl">Nơi sản xuất</span>',
      '<input type="text" class="zp-inp" id="zp-nsx"></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-tt" checked>',
      '<span class="zp-lbl">Tình trạng</span>',
      '<input type="text" class="zp-inp" id="zp-tt"></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-dvt" checked>',
      '<span class="zp-lbl">Đơn vị tính</span>',
      '<input type="text" class="zp-inp" id="zp-dvt"></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-gia" checked>',
      '<span class="zp-lbl">Giá thông thường</span>',
      '<input type="text" class="zp-inp" id="zp-gia"></div>',
      '<div class="zp-row">',
      '<input type="checkbox" id="zp-ck-qtk">',
      '<span class="zp-lbl">Quản lý tồn kho</span>',
      '<span style="font-size:11px;color:#555;padding-top:3px">Tick bật — SL mặc định = 1</span></div>',
      '<div class="zp-row"><input type="checkbox" id="zp-ck-anh" checked>',
      '<span class="zp-lbl">Ảnh sản phẩm</span>',
      '<div class="zp-thumb-preview">',
      '<img id="zp-thumb-img" src="" alt="">',
      '<div class="zp-thumb-info">',
      '<strong id="zp-thumb-name"></strong><span id="zp-thumb-id"></span>',
      "</div></div></div>",
      '<div class="zp-sec">🏷 THƯƠNG HIỆU — paste tên + Enter</div>',
      '<div class="zzm-tagbox" id="zp-box-th">',
      '<textarea class="zzm-tag-inp" id="zp-inp-th" rows="1"',
      ' placeholder="Paste hoặc gõ tên + Enter…"></textarea></div>',
      '<div class="zp-sec">🏍 DÒNG XE — paste tên + Enter</div>',
      '<div class="zzm-tagbox" id="zp-box-dx">',
      '<textarea class="zzm-tag-inp" id="zp-inp-dx" rows="1"',
      ' placeholder="Paste hoặc gõ tên + Enter…"></textarea></div>',
      "</div>",
      '<div id="zzm-set-body">',
      '<div class="zs-note">⚙️ Thay đổi giá trị mặc định rồi bấm <b>"💾 Lưu cài đặt"</b>. ',
      "Cài đặt lưu trên máy này — lần sau mở panel sẽ tự dùng giá trị đã lưu.</div>",
      '<div class="zs-grp">',
      '<div class="zs-grp-title">🖼 Ảnh phôi</div>',
      '<div class="zs-row"><span class="zs-lbl">ID ảnh</span>',
      '<input class="zs-inp" id="zs-thumbId"></div>',
      '<div class="zs-row"><span class="zs-lbl">URL ảnh</span>',
      '<input class="zs-inp" id="zs-thumbSrc"></div>',
      '<div class="zs-row"><span class="zs-lbl">Tên file</span>',
      '<input class="zs-inp" id="zs-thumbName"></div>',
      "</div>",
      '<div class="zs-grp">',
      '<div class="zs-grp-title">📝 Các trường text</div>',
      '<div class="zs-row"><span class="zs-lbl">Tên SP</span>',
      '<input class="zs-inp" id="zs-tenSP"></div>',
      '<div class="zs-row"><span class="zs-lbl">Nơi SX</span>',
      '<input class="zs-inp" id="zs-noiSX"></div>',
      '<div class="zs-row"><span class="zs-lbl">Tình trạng</span>',
      '<input class="zs-inp" id="zs-tinhTrang"></div>',
      '<div class="zs-row"><span class="zs-lbl">ĐVT</span>',
      '<input class="zs-inp" id="zs-dvt"></div>',
      '<div class="zs-row"><span class="zs-lbl">Giá</span>',
      '<input class="zs-inp" id="zs-gia"></div>',
      "</div>",
      '<div class="zs-grp">',
      '<div class="zs-grp-title">🏷 Danh mục mặc định (mỗi tên 1 dòng)</div>',
      '<div class="zs-row"><span class="zs-lbl">Thương hiệu</span>',
      '<textarea class="zs-ta" id="zs-thuongHieu" style="height:54px"></textarea></div>',
      '<div class="zs-row"><span class="zs-lbl">Dòng xe</span>',
      '<textarea class="zs-ta" id="zs-dongXe" style="height:54px"></textarea></div>',
      "</div>",
      '<div class="zs-grp">',
      '<div class="zs-grp-title">📄 Mô tả ngắn</div>',
      '<div class="zs-row"><textarea class="zs-ta" id="zs-moTa" style="height:120px"></textarea></div>',
      "</div>",
      "</div>",
      '<div id="zzm-phoi-ft">',
      '<div class="zp-ft-row">',
      '<button id="zzm-phoi-run">▶ Chỉ điền form</button>',
      '<button id="zzm-phoi-rst">🗑 Reset</button>',
      "</div>",
      '<div class="zp-ft-row">',
      '<button id="zzm-phoi-save">💾 Lưu &amp; Tạo phôi tiếp theo</button>',
      "</div>",
      "</div>",
      '<div id="zzm-set-ft">',
      '<button id="zs-default">↺ Khôi phục gốc</button>',
      '<button id="zs-save">💾 Lưu cài đặt</button>',
      "</div>",
      '<div id="zzm-phoi-log"></div>',
    ].join("");
    document.body.appendChild(P);

    function napPanelDien() {
      document.getElementById("zp-ten").value = CFG.tenSP;
      document.getElementById("zp-mota").value = CFG.moTa;
      document.getElementById("zp-nsx").value = CFG.noiSX;
      document.getElementById("zp-tt").value = CFG.tinhTrang;
      document.getElementById("zp-dvt").value = CFG.dvt;
      document.getElementById("zp-gia").value = CFG.gia;
      document.getElementById("zp-ck-qtk").checked = CFG.quanLyTonKho;
      document.getElementById("zp-thumb-img").src = CFG.thumbSrc;
      document.getElementById("zp-thumb-name").textContent = CFG.thumbName;
      document.getElementById("zp-thumb-id").textContent = "ID: " + CFG.thumbId;
      ["zp-box-th", "zp-box-dx"].forEach(function (id) {
        document
          .getElementById(id)
          .querySelectorAll(".zzm-tag")
          .forEach(function (t) {
            t.remove();
          });
      });
      CFG.thuongHieu.forEach(function (v) {
        addTag("zp-box-th", "zp-inp-th", v);
      });
      CFG.dongXe.forEach(function (v) {
        addTag("zp-box-dx", "zp-inp-dx", v);
      });
    }

    function napPanelCaiDat() {
      document.getElementById("zs-thumbId").value = CFG.thumbId;
      document.getElementById("zs-thumbSrc").value = CFG.thumbSrc;
      document.getElementById("zs-thumbName").value = CFG.thumbName;
      document.getElementById("zs-tenSP").value = CFG.tenSP;
      document.getElementById("zs-noiSX").value = CFG.noiSX;
      document.getElementById("zs-tinhTrang").value = CFG.tinhTrang;
      document.getElementById("zs-dvt").value = CFG.dvt;
      document.getElementById("zs-gia").value = CFG.gia;
      document.getElementById("zs-thuongHieu").value =
        CFG.thuongHieu.join("\n");
      document.getElementById("zs-dongXe").value = CFG.dongXe.join("\n");
      document.getElementById("zs-moTa").value = CFG.moTa;
    }

    function docPanelCaiDat() {
      function dongThanhMang(s) {
        return s
          .split(/\r?\n/)
          .map(function (l) {
            return l.trim();
          })
          .filter(Boolean);
      }
      return {
        thumbId: document.getElementById("zs-thumbId").value.trim(),
        thumbSrc: document.getElementById("zs-thumbSrc").value.trim(),
        thumbName: document.getElementById("zs-thumbName").value.trim(),
        tenSP: document.getElementById("zs-tenSP").value.trim(),
        noiSX: document.getElementById("zs-noiSX").value.trim(),
        tinhTrang: document.getElementById("zs-tinhTrang").value.trim(),
        dvt: document.getElementById("zs-dvt").value.trim(),
        gia: document.getElementById("zs-gia").value.trim(),
        quanLyTonKho: CFG.quanLyTonKho,
        tuDongDien: CFG.tuDongDien,
        thuongHieu: dongThanhMang(
          document.getElementById("zs-thuongHieu").value,
        ),
        dongXe: dongThanhMang(document.getElementById("zs-dongXe").value),
        moTa: document.getElementById("zs-moTa").value,
      };
    }

    function moCaiDat() {
      napPanelCaiDat();
      document.getElementById("zzm-phoi-body").style.display = "none";
      document.getElementById("zzm-phoi-ft").style.display = "none";
      document.getElementById("zzm-set-body").style.display = "flex";
      document.getElementById("zzm-set-ft").style.display = "flex";
      document.getElementById("zzm-hd-title").textContent =
        "⚙️ Cài Đặt Mặc Định";
      document.getElementById("zzm-phoi-log").style.display = "none";
    }
    function dongCaiDat() {
      document.getElementById("zzm-set-body").style.display = "none";
      document.getElementById("zzm-set-ft").style.display = "none";
      document.getElementById("zzm-phoi-body").style.display = "flex";
      document.getElementById("zzm-phoi-ft").style.display = "flex";
      document.getElementById("zzm-hd-title").textContent =
        "📋 Điền Phôi Sản Phẩm — ZZM";
    }

    document.getElementById("zzm-btn-set").onclick = function () {
      if (document.getElementById("zzm-set-body").style.display === "flex")
        dongCaiDat();
      else moCaiDat();
    };

    document.getElementById("zs-save").onclick = function () {
      var moi = docPanelCaiDat();
      if (!moi.thumbId || !moi.thumbSrc || !moi.thumbName) {
        alert("Vui lòng điền đủ ID ảnh, URL ảnh và Tên file!");
        return;
      }
      CFG = moi;
      luuCFG(CFG);
      napPanelDien();
      dongCaiDat();
      alert("✅ Đã lưu cài đặt! Từ giờ panel sẽ dùng giá trị mới.");
    };

    document.getElementById("zs-default").onclick = function () {
      if (!confirm("Khôi phục về giá trị gốc và xóa cài đặt đã lưu?")) return;
      localStorage.removeItem(STORE_KEY);
      CFG = JSON.parse(JSON.stringify(CFG_GOC));
      napPanelCaiDat();
      napPanelDien();
      alert("↺ Đã khôi phục giá trị gốc.");
    };

    document.getElementById("zzm-phoi-close").onclick = function () {
      sessionStorage.removeItem(FLAG_KEY);
      P.remove();
      ST.remove();
    };
    var hd = document.getElementById("zzm-phoi-hd");
    var mdx,
      mdy,
      mox,
      moy,
      dragging = false;
    hd.addEventListener("mousedown", function (e) {
      if (e.target.id === "zzm-phoi-close" || e.target.id === "zzm-btn-set")
        return;
      dragging = true;
      mdx = e.clientX;
      mdy = e.clientY;
      var r = P.getBoundingClientRect();
      mox = r.left;
      moy = r.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      P.style.left = mox + e.clientX - mdx + "px";
      P.style.top = moy + e.clientY - mdy + "px";
      P.style.right = "auto";
    });
    document.addEventListener("mouseup", function () {
      dragging = false;
    });

    ["ten", "mota", "nsx", "tt", "dvt", "gia"].forEach(function (k) {
      var ck = document.getElementById("zp-ck-" + k);
      var ip = document.getElementById("zp-" + k);
      if (!ck || !ip) return;
      ck.addEventListener("change", function () {
        ip.disabled = !ck.checked;
      });
    });

    function norm(s) {
      return String(s).toLowerCase().replace(/\s+/g, " ").trim();
    }
    function addTag(boxId, inpId, raw) {
      raw = raw.trim();
      if (!raw) return;
      var box = document.getElementById(boxId);
      var inp = document.getElementById(inpId);
      var ex = box.querySelectorAll(".zzm-tag-name");
      for (var i = 0; i < ex.length; i++) {
        if (norm(ex[i].textContent) === norm(raw)) return;
      }
      var tag = document.createElement("div");
      tag.className = "zzm-tag";
      var nm = document.createElement("span");
      nm.className = "zzm-tag-name";
      nm.textContent = raw;
      nm.title = raw;
      var del = document.createElement("button");
      del.className = "zzm-tag-del";
      del.textContent = "×";
      del.onclick = function () {
        tag.remove();
      };
      tag.appendChild(nm);
      tag.appendChild(del);
      box.insertBefore(tag, inp);
    }
    function setupTagBox(boxId, inpId) {
      var box = document.getElementById(boxId);
      var inp = document.getElementById(inpId);
      box.addEventListener("click", function (e) {
        if (e.target === box) inp.focus();
      });
      inp.addEventListener("paste", function (e) {
        e.preventDefault();
        var txt = (e.clipboardData || window.clipboardData).getData("text");
        txt
          .split(/\r?\n/)
          .map(function (l) {
            return l.trim();
          })
          .filter(Boolean)
          .forEach(function (line) {
            addTag(boxId, inpId, line);
          });
        inp.value = "";
      });
      inp.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        addTag(boxId, inpId, inp.value);
        inp.value = "";
      });
    }
    setupTagBox("zp-box-th", "zp-inp-th");
    setupTagBox("zp-box-dx", "zp-inp-dx");

    napPanelDien();

    var LG = document.getElementById("zzm-phoi-log");
    function L(msg, cls) {
      LG.style.display = "block";
      var d = document.createElement("div");
      if (cls) d.className = cls;
      d.textContent = msg;
      LG.appendChild(d);
      LG.scrollTop = LG.scrollHeight;
    }

    function getTagNames(boxId) {
      return Array.from(
        document.getElementById(boxId).querySelectorAll(".zzm-tag-name"),
      ).map(function (el) {
        return el.textContent.trim();
      });
    }
    function setField(el, val) {
      if (!el) return false;
      el.value = val;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    function fillExcerpt(text) {
      var html = text
        .split("\n")
        .map(function (l) {
          return l.trim();
        })
        .filter(Boolean)
        .join("<br>");
      if (typeof tinymce !== "undefined" && tinymce.get("excerpt")) {
        tinymce.get("excerpt").setContent(html);
        return true;
      }
      var btn = document.getElementById("excerpt-html");
      if (btn) {
        btn.click();
        setTimeout(function () {
          var ta = document.getElementById("excerpt");
          if (ta) {
            ta.value = text;
            ta.dispatchEvent(new Event("input"));
          }
        }, 350);
        return true;
      }
      return false;
    }
    function tickList(listId, names) {
      var labels = document.querySelectorAll("#" + listId + " label.selectit");
      var map = {};
      labels.forEach(function (lbl) {
        var key = norm(lbl.textContent);
        var cb = lbl.querySelector('input[type="checkbox"]');
        if (cb && !(key in map)) map[key] = cb;
      });
      var ok = 0,
        fail = 0;
      names.forEach(function (name) {
        var cb = map[norm(name)];
        if (cb) {
          if (!cb.checked) cb.click();
          L("  ✅ " + name, "ll-ok");
          ok++;
        } else {
          L("  ❌ Không tìm thấy: " + name, "ll-err");
          fail++;
        }
      });
      return { ok: ok, fail: fail };
    }

    function dienForm() {
      LG.innerHTML = "";
      var ok = 0,
        fail = 0;
      L("▶ Bắt đầu điền form…", "ll-info");

      if (document.getElementById("zp-ck-ten").checked) {
        var tv = document.getElementById("zp-ten").value.trim();
        if (setField(document.getElementById("title"), tv)) {
          L("✅ Tên: " + tv, "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Tên", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-mota").checked) {
        if (fillExcerpt(document.getElementById("zp-mota").value)) {
          L("✅ Đã điền mô tả ngắn", "ll-ok");
          ok++;
        } else {
          L("❌ Không điền được mô tả", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-nsx").checked) {
        var nv = document.getElementById("zp-nsx").value.trim();
        if (setField(document.getElementById("acf-field_62131508f975e"), nv)) {
          L("✅ Nơi sản xuất: " + nv, "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Nơi sản xuất", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-tt").checked) {
        var tv2 = document.getElementById("zp-tt").value.trim();
        if (setField(document.getElementById("acf-field_62131542f9761"), tv2)) {
          L("✅ Tình trạng: " + tv2, "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Tình trạng", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-dvt").checked) {
        var dv = document.getElementById("zp-dvt").value.trim();
        if (setField(document.getElementById("acf-field_621c667ee37f4"), dv)) {
          L("✅ Đơn vị tính: " + dv, "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Đơn vị tính", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-gia").checked) {
        var gv = document.getElementById("zp-gia").value.trim();
        if (setField(document.getElementById("_regular_price"), gv)) {
          L("✅ Giá: " + gv, "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Giá", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-qtk").checked) {
        var ms = document.getElementById("_manage_stock");
        if (ms) {
          if (!ms.checked) ms.click();
          L("✅ Quản lý tồn kho: đã bật", "ll-ok");
          ok++;
        } else {
          L("❌ Không tìm thấy ô Quản lý tồn kho", "ll-err");
          fail++;
        }
      }
      if (document.getElementById("zp-ck-anh").checked) {
        var tf = document.getElementById("_thumbnail_id");
        if (!tf) {
          var formEl = document.getElementById("post");
          if (formEl) {
            tf = document.createElement("input");
            tf.type = "hidden";
            tf.id = "_thumbnail_id";
            tf.name = "_thumbnail_id";
            formEl.appendChild(tf);
          }
        }
        if (tf) {
          tf.value = CFG.thumbId;
          var ib = document.querySelector("#postimagediv .inside");
          if (ib) {
            ib.innerHTML =
              '<img src="' +
              CFG.thumbSrc +
              '" style="max-width:100%;' +
              'height:auto;border-radius:4px;display:block;margin-bottom:8px">' +
              '<p style="margin:0;font-size:11px"><a href="#" id="zp-rm-thumb"' +
              ' style="color:#C0392B">Xóa ảnh sản phẩm</a></p>';
            document.getElementById("zp-rm-thumb").onclick = function (e) {
              e.preventDefault();
              tf.value = "-1";
              ib.innerHTML =
                '<p class="hide-if-no-js">' +
                '<a href="#" id="set-post-thumbnail" class="thickbox">Đặt ảnh sản phẩm</a></p>';
              L("🗑 Đã xóa ảnh", "ll-warn");
            };
          }
          L("✅ Ảnh: " + CFG.thumbName + " (ID: " + CFG.thumbId + ")", "ll-ok");
          ok++;
        } else {
          L("❌ Không tạo được trường ảnh", "ll-err");
          fail++;
        }
      }
      var th = getTagNames("zp-box-th");
      if (th.length) {
        L("🏷 Thương hiệu:", "ll-info");
        var r1 = tickList("thuonghieuchecklist", th);
        ok += r1.ok;
        fail += r1.fail;
      }
      var dx = getTagNames("zp-box-dx");
      if (dx.length) {
        L("🏍 Dòng xe:", "ll-info");
        var r2 = tickList("dong-xechecklist", dx);
        ok += r2.ok;
        fail += r2.fail;
      }

      return { ok: ok, fail: fail };
    }

    document.getElementById("zzm-phoi-run").onclick = function () {
      var r = dienForm();
      setTimeout(function () {
        L("──────────────────────────", "ll-info");
        L("✅ Đã điền: " + r.ok + " trường/mục", "ll-ok");
        if (r.fail) L("❌ Lỗi: " + r.fail + " trường/mục", "ll-err");
        L('🔴 Kiểm tra kỹ rồi tự bấm "Lưu nháp" của WordPress!', "ll-warn");
      }, 500);
    };

    document.getElementById("zzm-phoi-save").onclick = function () {
      var r = dienForm();
      if (r.fail > 0) {
        setTimeout(function () {
          L("──────────────────────────", "ll-info");
          L("⚠️ Có " + r.fail + " lỗi — ĐÃ DỪNG, không tự lưu.", "ll-err");
          L('🔴 Kiểm tra lại rồi tự bấm "Lưu nháp".', "ll-warn");
        }, 500);
        return;
      }
      L("──────────────────────────", "ll-info");
      L("✅ Điền xong, đang lưu nháp…", "ll-ok");
      sessionStorage.setItem(FLAG_KEY, "1");
      setTimeout(function () {
        var saveBtn = document.getElementById("save-post");
        if (saveBtn) {
          saveBtn.click();
        } else {
          L("❌ Không tìm thấy nút Lưu nháp", "ll-err");
          sessionStorage.removeItem(FLAG_KEY);
        }
      }, 700);
    };

    document.getElementById("zzm-phoi-rst").onclick = function () {
      napPanelDien();
      LG.innerHTML = "";
      LG.style.display = "none";
    };

    if (CFG.tuDongDien) {
      var r = dienForm();
      setTimeout(function () {
        L("──────────────────────────", "ll-info");
        L("✅ Đã tự động điền " + r.ok + " trường/mục", "ll-ok");
        if (r.fail) L("❌ Lỗi: " + r.fail + " trường/mục", "ll-err");
        L('🔴 Kiểm tra rồi bấm "💾 Lưu & Tạo phôi tiếp theo"', "ll-warn");
      }, 600);
    }
  }, 1500);
})();
