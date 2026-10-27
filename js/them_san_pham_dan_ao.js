(function () {
  var e = document.getElementById("zzm-nav-panel");
  if (e) {
    e.remove();
    return;
  }
  var p = document.createElement("div");
  p.id = "zzm-nav-panel";
  p.innerHTML =
    "<style>" +
    "#zzm-nav-panel{position:fixed;top:40px;right:20px;width:550px;max-height:85vh;background:#fff;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:999999;font-family:Segoe UI,sans-serif;font-size:13px;display:flex;flex-direction:column;overflow:hidden;border:2px solid #2C3E50}" +
    "#zzm-nhd{background:#2C3E50;color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;font-weight:700;font-size:14px;cursor:move;user-select:none}" +
    "#zzm-nx{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px}" +
    "#zzm-sum{padding:8px 14px;background:#ecf0f1;border-bottom:1px solid #d5dbe1;font-size:12px;font-weight:600;color:#2c3e50;display:flex;gap:14px;flex-wrap:wrap}" +
    ".zs-ok{color:#27ae60}.zs-er{color:#c0392b}.zs-msg{flex-basis:100%;font-weight:700}" +
    "#zzm-nbd{padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;max-height:55vh}" +
    ".xe-row{display:flex;flex-direction:column;gap:6px;background:#f8f9fa;padding:10px;border-radius:6px;border:1px solid #e2e8f0}" +
    ".xe-hdr{display:flex;align-items:center;gap:8px;font-weight:700;color:#2c3e50}" +
    ".xe-lbl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
    ".xe-stt{font-size:11px;color:#64748b;font-weight:600;white-space:nowrap}" +
    ".sku-tb{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;font-size:12px}" +
    ".sku-tb th{background:#e2e8f0;color:#334155;font-weight:600;text-align:left;padding:4px 6px;border:1px solid #cbd5e1}" +
    ".sku-tb td{border:1px solid #cbd5e1;padding:0;height:26px}" +
    ".sku-tb .c-no{width:30px;text-align:center;color:#94a3b8;padding:0}" +
    ".sku-tb .c-sku{width:160px}" +
    ".sku-tb .c-del{width:26px;padding:0}" +
    ".sku-tb .c-st{padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#64748b}" +
    "#zzm-nav-panel .sku-in{width:100%;height:26px;min-height:0;margin:0;border:none;border-radius:0;outline:none;box-shadow:none;padding:0 6px;font-family:monospace;font-size:12px;line-height:26px;background:transparent;color:#1e293b;box-sizing:border-box}" +
    "#zzm-nav-panel .sku-in:focus{background:#eef6ff;box-shadow:inset 0 0 0 2px #2C3E50}" +
    ".sku-del{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px;padding:0;width:100%;height:26px}" +
    ".sku-del:hover{color:#e74c3c}" +
    ".sku-tb tr.dup td{background:#fff3cd}" +
    ".sku-tb tr.run td{background:#dbeafe}" +
    ".sku-tb tr.ok td{background:#e8f8ef}.sku-tb tr.ok .c-st{color:#1e8449}" +
    ".sku-tb tr.err td{background:#fde2e2}.sku-tb tr.err .c-st{color:#c0392b;font-weight:700}" +
    ".xe-ft{display:flex;justify-content:flex-end}" +
    ".xe-cp{background:#fff;border:1px solid #e74c3c;color:#e74c3c;border-radius:4px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer}" +
    ".xe-cp:disabled{border-color:#cbd5e1;color:#94a3b8;cursor:default}" +
    "#zzm-nbtn{background:#27AE60;color:#fff;border:none;border-radius:6px;padding:10px;font-size:14px;font-weight:700;cursor:pointer;margin:14px;margin-top:0}" +
    "#zzm-nbtn:disabled{background:#bdc3c7;cursor:not-allowed}" +
    "#zzm-lgbar{padding:0 14px 8px;text-align:right}" +
    "#zzm-lgt{background:none;border:none;color:#2C3E50;font-size:11px;cursor:pointer;text-decoration:underline;padding:0}" +
    "#zzm-nlog{max-height:200px;overflow-y:auto;padding:10px 14px;background:#1e1e1e;color:#00ff00;font-family:monospace;font-size:11px;line-height:1.6;border-top:1px solid #2c3e50}" +
    ".zl{margin:0}.zo{color:#2ecc71}.zw{color:#f1c40f}.ze{color:#e74c3c}.zi{color:#3498db;font-weight:700}" +
    "</style>" +
    '<div id="zzm-nhd">🚀 Bộ Điền Sản Phẩm Lồng Cấp ACF — ZZM<button id="zzm-nx">✖</button></div>' +
    '<div id="zzm-sum"></div>' +
    '<div id="zzm-nbd"></div>' +
    '<button id="zzm-nbtn">▶ Chạy các xe đã chọn</button>' +
    '<div id="zzm-lgbar"><button id="zzm-lgt">📜 Xem log chi tiết</button></div>' +
    '<div id="zzm-nlog" style="display:none"></div>';
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
    var d = document.createElement("div");
    d.className = "zl " + (t || "");
    d.textContent = m;
    lg.appendChild(d);
    lg.scrollTop = lg.scrollHeight;
  }
  document.getElementById("zzm-lgt").onclick = function () {
    var show = lg.style.display === "none";
    lg.style.display = show ? "block" : "none";
    this.textContent = show ? "📜 Ẩn log chi tiết" : "📜 Xem log chi tiết";
  };

  // ── Thanh tổng kết chung ──
  var sumEl = document.getElementById("zzm-sum"),
    msg = "",
    msgC = "#27ae60";
  function updSum() {
    var nx = 0,
      ns = 0;
    document.querySelectorAll("#zzm-nbd tbody").forEach((tb) => {
      var c = 0;
      tb.querySelectorAll(".sku-in").forEach((x) => {
        if (x.value.trim()) c++;
      });
      if (c) nx++;
      ns += c;
    });
    sumEl.innerHTML =
      "<span>🚗 Xe có dữ liệu: <b>" +
      nx +
      "</b></span><span>📦 Tổng SKU: <b>" +
      ns +
      '</b></span><span class="zs-ok">✅ Đã thêm: ' +
      p.querySelectorAll(".sku-tb tr.ok").length +
      '</span><span class="zs-er">❌ Lỗi: ' +
      p.querySelectorAll(".sku-tb tr.err").length +
      "</span>" +
      (msg
        ? '<span class="zs-msg" style="color:' + msgC + '">' + msg + "</span>"
        : "");
  }

  // ── Nút copy mã lỗi từng xe ──
  function updCp(idx) {
    var cp = document.getElementById("cp-" + idx);
    var n = document.querySelectorAll("#tb-" + idx + " tr.err").length;
    cp.textContent = "📋 Copy mã lỗi (" + n + ")";
    cp.disabled = !n;
  }
  function cpText(txt, done) {
    function fb() {
      var t = document.createElement("textarea");
      t.value = txt;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
      done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fb);
    } else fb();
  }

  // ── Trạng thái từng dòng SKU ──
  function setSt(tr, cls, txt) {
    tr.classList.remove("run", "ok", "err");
    if (cls) tr.classList.add(cls);
    var st = tr.querySelector(".c-st");
    st.textContent = txt;
    st.title = txt;
    updSum();
    updCp(tr.closest(".xe-row").dataset.idx);
  }
  function mkRow(val) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="c-no"></td><td class="c-sku"><input class="sku-in" type="text" spellcheck="false"></td><td class="c-st"></td><td class="c-del"><button class="sku-del" tabindex="-1" title="Xoá dòng">✖</button></td>';
    tr.querySelector(".sku-in").value = val || "";
    return tr;
  }
  function refresh(idx) {
    var tb = document.getElementById("tb-" + idx);
    var trs = tb.querySelectorAll("tr");
    if (
      !trs.length ||
      trs[trs.length - 1].querySelector(".sku-in").value.trim()
    ) {
      tb.appendChild(mkRow());
      trs = tb.querySelectorAll("tr");
    }
    var cnt = {},
      n = 0,
      nd = 0;
    trs.forEach((tr) => {
      var v = tr.querySelector(".sku-in").value.trim();
      if (v) {
        cnt[v] = (cnt[v] || 0) + 1;
        n++;
      }
    });
    for (var k in cnt) if (cnt[k] > 1) nd++;
    trs.forEach((tr, i) => {
      tr.querySelector(".c-no").textContent = i + 1;
      var v = tr.querySelector(".sku-in").value.trim();
      var isDup = !!v && cnt[v] > 1;
      tr.classList.toggle("dup", isDup);
      tr.title = isDup ? "⚠ Mã này bị trùng trong cùng xe" : "";
    });
    document.getElementById("chk-" + idx).checked = n > 0;
    document.getElementById("stt-" + idx).textContent = n
      ? "🔹 " + n + " mã" + (nd ? " · ⚠ " + nd + " mã trùng" : "")
      : "Chờ dữ liệu...";
    updSum();
    updCp(idx);
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
    msg = "❌ Không tìm thấy danh sách Xe trên giao diện!";
    msgC = "#c0392b";
    document.getElementById("zzm-nbtn").disabled = true;
  }
  rows.forEach((row, idx) => {
    var tx =
      row
        .querySelector('[data-key="field_62343183dd16e"] textarea')
        ?.value?.trim() || "Xe không tên #" + (idx + 1);
    var cDiv = document.createElement("div");
    cDiv.className = "xe-row";
    cDiv.dataset.idx = idx;
    cDiv.innerHTML =
      '<div class="xe-hdr"><input type="checkbox" id="chk-' +
      idx +
      '" class="xe-chk"><label for="chk-' +
      idx +
      '" class="xe-lbl"></label><span id="stt-' +
      idx +
      '" class="xe-stt">Chờ dữ liệu...</span></div>' +
      '<table class="sku-tb"><thead><tr><th class="c-no">#</th><th class="c-sku">Mã SKU</th><th class="c-st">Trạng thái / Sản phẩm</th><th class="c-del"></th></tr></thead><tbody id="tb-' +
      idx +
      '"></tbody></table>' +
      '<div class="xe-ft"><button class="xe-cp" id="cp-' +
      idx +
      '" disabled>📋 Copy mã lỗi (0)</button></div>';
    var lb = cDiv.querySelector(".xe-lbl");
    lb.textContent = idx + 1 + ". " + tx;
    lb.title = tx;
    bBody.appendChild(cDiv);
    var tb = document.getElementById("tb-" + idx);

    // Gõ tay vào ô
    tb.addEventListener("input", function (ev) {
      if (!ev.target.classList.contains("sku-in")) return;
      setSt(ev.target.closest("tr"), "", "");
      refresh(idx);
    });
    // Paste nhiều dòng → tự tách mỗi mã 1 ô, chèn từ ô đang chọn
    tb.addEventListener("paste", function (ev) {
      var inp = ev.target;
      if (!inp.classList.contains("sku-in")) return;
      var arr = (ev.clipboardData || window.clipboardData)
        .getData("text")
        .split(/\r?\n|\t/)
        .map((s) => s.trim())
        .filter((s) => s);
      if (arr.length < 2) return;
      ev.preventDefault();
      var tr = inp.closest("tr");
      if (!inp.value.trim()) {
        inp.value = arr.shift();
        setSt(tr, "", "");
      }
      var after = tr;
      arr.forEach((v) => {
        var nr = mkRow(v);
        after.after(nr);
        after = nr;
      });
      refresh(idx);
      after.querySelector(".sku-in").focus();
    });
    // Enter / ↑ / ↓ di chuyển ô, Backspace ở ô trống thì xoá dòng
    tb.addEventListener("keydown", function (ev) {
      var inp = ev.target;
      if (!inp.classList.contains("sku-in")) return;
      var tr = inp.closest("tr");
      if (ev.key === "Enter" || ev.key === "ArrowDown") {
        ev.preventDefault();
        refresh(idx);
        if (tr.nextElementSibling)
          tr.nextElementSibling.querySelector(".sku-in").focus();
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        if (tr.previousElementSibling)
          tr.previousElementSibling.querySelector(".sku-in").focus();
      } else if (
        ev.key === "Backspace" &&
        !inp.value &&
        tr.previousElementSibling
      ) {
        ev.preventDefault();
        var pv = tr.previousElementSibling.querySelector(".sku-in");
        if (tr.nextElementSibling) tr.remove();
        refresh(idx);
        pv.focus();
      }
    });
    // Nút ✖ xoá dòng
    tb.addEventListener("click", function (ev) {
      if (!ev.target.classList.contains("sku-del")) return;
      ev.target.closest("tr").remove();
      refresh(idx);
    });
    // Copy mã lỗi
    var cp = document.getElementById("cp-" + idx);
    cp.onclick = function () {
      var errs = [].map.call(tb.querySelectorAll("tr.err .sku-in"), (x) =>
        x.value.trim(),
      );
      if (!errs.length) return;
      cpText(errs.join("\n"), function () {
        cp.textContent = "✔ Đã copy " + errs.length + " mã";
        setTimeout(function () {
          updCp(idx);
        }, 1500);
      });
    };
    refresh(idx);
  });
  updSum();
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
      if (c.checked) {
        var skus = [],
          els = [];
        document.querySelectorAll("#tb-" + idx + " tr").forEach((tr) => {
          var v = tr.querySelector(".sku-in").value.trim();
          if (v) {
            skus.push(v);
            els.push(tr);
          }
        });
        if (skus.length)
          tasks.push({ idx: parseInt(idx, 10), skus: skus, els: els });
      }
    });
    if (!tasks.length) {
      alert("Vui lòng nhập dữ liệu và tick chọn ít nhất 1 xe!");
      return;
    }
    tBtn.disabled = true;
    tBtn.textContent = "⏳ Đang xử lý tuần tự...";
    lg.innerHTML = "";
    tasks.forEach((t) => {
      t.els.forEach((tr) => setSt(tr, "", "⏳ Chờ chạy"));
    });
    L("📋 Bắt đầu xử lý " + tasks.length + " Xe được chọn...", "zi");
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      var sLbl = document.getElementById("stt-" + t.idx);
      var targetRow = rows[t.idx];
      msg =
        "⏳ Đang xử lý Xe thứ " +
        (t.idx + 1) +
        " [" +
        (i + 1) +
        "/" +
        tasks.length +
        "]...";
      msgC = "#2980b9";
      updSum();
      var addBtn = targetRow.querySelector(
        '[data-key="' + CFG.fkR + '"] .acf-repeater-add-row',
      );
      if (!addBtn) {
        L("❌ Không tìm thấy nút thêm sản phẩm ở Xe thứ " + (t.idx + 1), "ze");
        sLbl.textContent = "❌ Lỗi nút bấm";
        t.els.forEach((tr) =>
          setSt(tr, "err", "❌ Không tìm thấy nút thêm SP của xe này"),
        );
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
        var tr = t.els[j];
        setSt(tr, "run", "🔍 Đang tìm...");
        tr.scrollIntoView({ block: "nearest" });
        L("  🔍 Tìm kiếm SKU: " + sku);
        await sl(300);
        var r = await sAPI(sku);
        if (!r.length) {
          L("  ❌ Không tìm thấy sản phẩm cho SKU: " + sku, "ze");
          setSt(tr, "err", "❌ Không tìm thấy sản phẩm");
          continue;
        }
        var xid = r[0].id,
          xt = r[0].text;
        L("  ✅ Tìm thấy: " + xt.substring(0, 40), "zo");
        setSt(tr, "run", "➕ Đang thêm: " + xt);
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
          setSt(tr, "err", "❌ Không tạo được dòng mới");
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
          setSt(tr, "ok", "✅ " + xt);
        } else {
          L("  ❌ Không tìm thấy thẻ select ở dòng mới sinh", "ze");
          setSt(tr, "err", "❌ Không thấy ô chọn SP ở dòng mới");
        }
        await sl(300);
      }
      sLbl.textContent =
        "✅ " +
        okCount +
        " · ❌ " +
        (t.skus.length - okCount) +
        " / " +
        t.skus.length;
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
    msg = '🏁 ĐÃ HOÀN THÀNH TẤT CẢ! HÃY BẤM "CẬP NHẬT" ĐỂ LƯU BÀI VIẾT.';
    msgC = "#27ae60";
    updSum();
    tBtn.disabled = false;
    tBtn.textContent = "▶ Chạy các xe đã chọn";
  };
})();
