(function () {
  var e = document.getElementById("zzm-nav-panel");
  if (e) {
    e.remove();
    return;
  }
  var p = document.createElement("div");
  p.id = "zzm-nav-panel";
  p.innerHTML =
    '<style>#zzm-nav-panel{position:fixed;top:40px;right:20px;width:550px;max-height:85vh;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:999999;font-family:Segoe UI,sans-serif;font-size:13px;display:flex;flex-direction:column;overflow:hidden;border:2px solid #2C3E50}#zzm-nhd{background:#2C3E50;color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:14px;cursor:move;user-select:none}#zzm-nx{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px}#zzm-nbd{padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:50vh}.xe-row{display:flex;flex-direction:column;gap:4px;background:#f8f9fa;padding:10px;border-radius:6px;border:1px solid #e2e8f0}.xe-hdr{display:flex;align-items:center;gap:8px;font-weight:700;color:#2c3e50}.xe-lbl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.xe-ta{width:100%;height:60px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;font-family:monospace;font-size:11px;resize:vertical;box-sizing:border-box;outline:none}.xe-ta:focus{border-color:#2C3E50}.xe-stt{font-size:11px;color:#64748b;font-weight:400}#zzm-nbtn{background:#27AE60;color:#fff;border:none;border-radius:6px;padding:10px;font-size:14px;font-weight:700;cursor:pointer;margin:14px;margin-top:0}#zzm-nbtn:disabled{background:#bdc3c7;cursor:not-allowed}#zzm-nlog{max-height:200px;overflow-y:auto;padding:10px 14px;background:#1e1e1e;color:#00ff00;font-family:monospace;font-size:11px;line-height:1.6;border-top:1px solid #2c3e50}.zl{margin:0}.zo{color:#2ecc71}.zw{color:#f1c40f}.ze{color:#e74c3c}.zi{color:#3498db;font-weight:700}</style><div id="zzm-nhd">🚀 Bộ Điền Sản Phẩm Lồng Cấp ACF — ZZM<button id="zzm-nx">✖</button></div><div id="zzm-nbd"></div><button id="zzm-nbtn">▶ Chạy các xe đã chọn</button><div id="zzm-nlog" style="display:none"></div>';
  document.body.appendChild(p);
  document.getElementById("zzm-nx").onclick = function () {
    p.remove();
  };
  var hd = document.getElementById("zzm-nhd"),
    dx,
    dy,
    ox,
    oy,
    dr = false;
  hd.addEventListener("mousedown", function (e) {
    if (e.target.id === "zzm-nx") return;
    dr = true;
    dx = e.clientX;
    dy = e.clientY;
    var r = p.getBoundingClientRect();
    ox = r.left;
    oy = r.top;
    e.preventDefault();
  });
  document.addEventListener("mousemove", function (e) {
    if (!dr) return;
    p.style.left = ox + e.clientX - dx + "px";
    p.style.top = oy + e.clientY - dy + "px";
    p.style.right = "auto";
  });
  document.addEventListener("mouseup", function () {
    dr = false;
  });
  var lg = document.getElementById("zzm-nlog");
  function L(m, t) {
    lg.style.display = "block";
    var d = document.createElement("div");
    d.className = "zl " + (t || "");
    d.textContent = m;
    lg.appendChild(d);
    lg.scrollTop = lg.scrollHeight;
  }
  var CFG = {
    fkP: "field_62342410d91a9",
    fkR: "field_62342410d8494",
    ajax: "/wp-admin/admin-ajax.php",
  };
  var nc =
    document.querySelector('[data-key="' + CFG.fkP + '"] select')?.dataset
      ?.nonce ||
    document.querySelector('select[data-nonce][data-ajax="1"]')?.dataset
      ?.nonce ||
    "9542c59af4";
  var pid = document.querySelector("#post_ID")?.value;
  var bBody = document.getElementById("zzm-nbd");
  var rows = document.querySelectorAll(
    ".acf-field-62343165dd16c > .acf-input > .acf-repeater > .acf-table > tbody > .acf-row:not(.acf-clone)",
  );
  if (!rows.length) {
    L("❌ Không tìm thấy danh sách Xe trên giao diện!", "ze");
    document.getElementById("zzm-nbtn").disabled = true;
  }
  rows.forEach((row, idx) => {
    var tx =
      row
        .querySelector('[data-key="field_62343183dd16e"] textarea')
        ?.value?.trim() || "Xe không tên #" + (idx + 1);
    var cDiv = document.createElement("div");
    cDiv.className = "xe-row";
    cDiv.innerHTML =
      '<div class="xe-hdr"><input type="checkbox" id="chk-' +
      idx +
      '" class="xe-chk"><label for="chk-' +
      idx +
      '" class="xe-lbl" title="' +
      tx +
      '">' +
      (idx + 1) +
      ". " +
      tx +
      '</label><span id="stt-' +
      idx +
      '" class="xe-stt">Chờ dữ liệu...</span></div><textarea id="ta-' +
      idx +
      '" class="xe-ta" placeholder="Paste danh sách SKU cho xe này (Mỗi dòng 1 SKU)"></textarea>';
    bBody.appendChild(cDiv);
    var ta = document.getElementById("ta-" + idx);
    var chk = document.getElementById("chk-" + idx);
    ta.oninput = function () {
      var hasVal = !!ta.value.trim();
      chk.checked = hasVal;
      document.getElementById("stt-" + idx).textContent = hasVal
        ? "🔹 Đã sẵn sàng"
        : "Chờ dữ liệu...";
    };
  });
  var sl = (ms) => new Promise((r) => setTimeout(r, ms));
  async function sAPI(q) {
    try {
      var res = await fetch(CFG.ajax, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: new URLSearchParams({
          action: "acf/fields/post_object/query",
          s: q,
          paged: 1,
          field_key: CFG.fkP,
          nonce: nc,
          post_id: pid,
        }).toString(),
      });
      var d = await res.json();
      return d.results || [];
    } catch (e) {
      return [];
    }
  }
  document.getElementById("zzm-nbtn").onclick = async function () {
    var tBtn = this;
    var chks = document.querySelectorAll(".xe-chk");
    var tasks = [];
    chks.forEach((c) => {
      var idx = c.id.split("-")[1];
      var ta = document.getElementById("ta-" + idx);
      if (c.checked && ta.value.trim()) {
        var skus = ta.value
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s);
        if (skus.length) tasks.push({ idx: parseInt(idx, 10), skus: skus });
      }
    });
    if (!tasks.length) {
      alert("Vui lòng nhập dữ liệu và tick chọn ít nhất 1 xe!");
      return;
    }
    tBtn.disabled = true;
    tBtn.textContent = "⏳ Đang xử lý tuần tự...";
    lg.innerHTML = "";
    L("📋 Bắt đầu xử lý " + tasks.length + " Xe được chọn...", "zi");
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      var sLbl = document.getElementById("stt-" + t.idx);
      var targetRow = rows[t.idx];
      var addBtn = targetRow.querySelector(
        '[data-key="' + CFG.fkR + '"] .acf-repeater-add-row',
      );
      if (!addBtn) {
        L("❌ Không tìm thấy nút thêm sản phẩm ở Xe thứ " + (t.idx + 1), "ze");
        sLbl.textContent = "❌ Lỗi nút bấm";
        continue;
      }
      L(
        "🚗 [" +
          (i + 1) +
          "/" +
          tasks.length +
          "] Đang xử lý Xe thứ " +
          (t.idx + 1) +
          " | Số lượng SKU: " +
          t.skus.length,
        "zi",
      );
      sLbl.textContent = "⏳ Đang chạy...";
      var okCount = 0;
      for (var j = 0; j < t.skus.length; j++) {
        var sku = t.skus[j];
        L("  🔍 Tìm kiếm SKU: " + sku);
        await sl(300);
        var r = await sAPI(sku);
        if (!r.length) {
          L("  ❌ Không tìm thấy sản phẩm cho SKU: " + sku, "ze");
          continue;
        }
        var xid = r[0].id,
          xt = r[0].text;
        L("  ✅ Tìm thấy: " + xt.substring(0, 40), "zo");
        var subRep = targetRow.querySelector('[data-key="' + CFG.fkR + '"]');
        var beforeRows = subRep.querySelectorAll(
          ".acf-row:not(.acf-clone)",
        ).length;
        addBtn.click();
        var newRow = null;
        for (var k = 0; k < 30; k++) {
          await sl(100);
          var currentRows = subRep.querySelectorAll(".acf-row:not(.acf-clone)");
          if (currentRows.length > beforeRows) {
            newRow = currentRows[currentRows.length - 1];
            break;
          }
        }
        if (!newRow) {
          L("  ❌ DOM không sinh được dòng mới cho SKU: " + sku, "ze");
          continue;
        }
        await sl(200);
        var sel = newRow.querySelector("select");
        if (sel) {
          var $s = jQuery(sel);
          for (var m = 0; m < 20; m++) {
            if ($s.hasClass("select2-hidden-accessible") || $s.data("select2"))
              break;
            await sl(100);
          }
          $s.append(new Option(xt, String(xid), true, true)).trigger("change");
          okCount++;
        } else {
          L("  ❌ Không tìm thấy thẻ select ở dòng mới sinh", "ze");
        }
        await sl(300);
      }
      sLbl.textContent = "✅ Đã thêm " + okCount + " SP";
      L(
        "🎉 Hoàn thành Xe thứ " +
          (t.idx + 1) +
          " (Thành công: " +
          okCount +
          "/" +
          t.skus.length +
          ")",
        "zo",
      );
    }
    L("──────────────────────────────", "zi");
    L('🏁 ĐÃ HOÀN THÀNH TẤT CẢ! HÃY BẤM "CẬP NHẬT" ĐỂ LƯU BÀI VIẾT.', "zo");
    tBtn.disabled = false;
    tBtn.textContent = "▶ Chạy các xe đã chọn";
  };
})();
