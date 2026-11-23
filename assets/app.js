/* 모집 사이트 공통 스크립트: 설정값 · 캐러셀 · 지원서(글자 수 · 임시 저장 · 검사 · 첨부 · 제출) */
(function () {
  "use strict";
  var C = window.RECRUIT || {};

  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, C);
  }

  // ── 설정값 채우기 ──
  document.querySelectorAll("[data-c]").forEach(function (el) {
    var value = get(el.getAttribute("data-c"));
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll("[data-mail]").forEach(function (el) {
    el.textContent = C.contactEmail || "";
    el.setAttribute("href", "mailto:" + (C.contactEmail || ""));
  });

  // ── 1차 심사 기준일 (config.js 의 firstRound). 비었거나 지났으면 원래 문구 그대로 ──
  (function () {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(C.firstRound || "");
    if (!m) return;
    var end = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59);
    if (isNaN(end.getTime()) || Date.now() > end.getTime()) return;
    var label = (+m[2]) + "월 " + (+m[3]) + "일(" + "일월화수목금토".charAt(end.getDay()) + ")";
    document.querySelectorAll("[data-round]").forEach(function (el) {
      el.textContent = el.getAttribute("data-round").replace(/\{date\}/g, label);
    });
  })();

  // ── 어디서 들어왔는지: 홍보 링크 끝의 ?from=이름 을 기억했다가 지원서에 함께 보낸다 ──
  var REF_KEY = "cinebom-from";
  try {
    var q = new URLSearchParams(location.search);
    var tag = (q.get("from") || q.get("utm_source") || "").replace(/[^0-9A-Za-z가-힣._-]/g, "").slice(0, 40);
    if (tag) localStorage.setItem(REF_KEY, JSON.stringify({ tag: tag, at: Date.now() }));
  } catch (e) {}
  function refTag() {
    try {
      var r = JSON.parse(localStorage.getItem(REF_KEY) || localStorage.getItem("cinepick-from") || "null"); // 예전 이름으로 남은 값도 읽는다
      if (r && r.tag && Date.now() - r.at < 60 * 24 * 3600 * 1000) return String(r.tag); // 60일 동안
    } catch (e) {}
    return "";
  }

  // ── 캐러셀 ──
  var carousel = document.querySelector("[data-carousel]");
  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-dots button"));
    var status = carousel.querySelector(".carousel-status");
    var current = 0;
    var timer = null;
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var showSlide = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === current);
        slide.setAttribute("aria-hidden", i === current ? "false" : "true");
      });
      dots.forEach(function (dot, i) {
        dot.setAttribute("aria-selected", i === current ? "true" : "false");
        dot.tabIndex = i === current ? 0 : -1;
      });
      if (status) status.textContent = (current + 1) + " / " + slides.length;
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var play = function () {
      if (still || timer || slides.length < 2) return;
      timer = setInterval(function () { showSlide(current + 1); }, 6000);
    };
    var prev = carousel.querySelector("[data-carousel-prev]");
    var next = carousel.querySelector("[data-carousel-next]");
    if (prev) prev.addEventListener("click", function () { stop(); showSlide(current - 1); });
    if (next) next.addEventListener("click", function () { stop(); showSlide(current + 1); });
    dots.forEach(function (dot, i) { dot.addEventListener("click", function () { stop(); showSlide(i); }); });
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", play);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { stop(); showSlide(current - 1); }
      if (e.key === "ArrowRight") { stop(); showSlide(current + 1); }
    });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else play(); });
    showSlide(0);
    play();
  }

  // ── 지원서 ──
  var form = document.querySelector("form.apply");
  if (!form) return;

  var kind = form.getAttribute("data-kind"); // director | critic
  var KIND_KO = kind === "director" ? "감독" : "평론가";
  var KEY = "cinebom-draft-" + kind;
  var saved = form.querySelector(".saved");
  var errBox = form.querySelector(".form-error");
  var btn = form.querySelector('button[type="submit"]');
  var sending = form.querySelector(".sending");

  var fields = Array.prototype.filter.call(form.elements, function (el) {
    return el.name && el.name !== "_gotcha" && el.type !== "submit";
  });
  function visible(el) { return !el.closest("[hidden]"); }

  // 고른 값에 따라 보이는 칸 (data-show="이름=값")
  function syncShow() {
    form.querySelectorAll("[data-show]").forEach(function (box) {
      var rule = box.getAttribute("data-show").split("=");
      var picked = form.querySelector('input[name="' + rule[0] + '"]:checked');
      box.hidden = !(picked && picked.value === rule[1]);
    });
  }
  form.addEventListener("change", function (e) { if (e.target.type === "radio") syncShow(); });

  // 글자 수
  function limitOf(el) {
    var k = el.getAttribute("data-limit");
    var v = k && (C.limits || {})[k];
    return Array.isArray(v) ? v : null;
  }
  function len(s) { return s.replace(/\s+/g, " ").trim().length; }
  form.querySelectorAll("[data-limit]").forEach(function (el) {
    var lim = limitOf(el);
    if (!lim) return;
    if (lim[1]) el.setAttribute("maxlength", String(lim[1]));
    var box = el.parentNode.querySelector(".count");
    if (!box) return;
    box.querySelector(".need").textContent = lim[0] ? lim[0].toLocaleString() + "자 이상" : lim[1] + "자까지";
    var n = box.querySelector(".n");
    el._paint = function () {
      var c = len(el.value);
      n.textContent = c.toLocaleString() + " / " + lim[1].toLocaleString() + "자";
      n.className = "n" + (lim[0] ? (c >= lim[0] ? " ok" : c > 0 ? " short" : "") : "");
    };
    el.addEventListener("input", el._paint);
  });

  // 임시 저장 (이 브라우저에만, 파일은 제외)
  function snapshot() {
    var d = {};
    fields.forEach(function (el) {
      if (el.type === "file") return;
      if (el.type === "radio") { if (el.checked) d[el.name] = el.value; }
      else if (el.type === "checkbox") d[el.name] = el.checked;
      else d[el.name] = el.value;
    });
    return d;
  }
  (function restore() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("cinepick-draft-" + kind) || "null"); } catch (e) {} // 예전 이름으로 저장된 임시 저장본도 이어 쓴다
    if (d) {
      fields.forEach(function (el) {
        if (el.type === "file" || !(el.name in d)) return;
        if (el.type === "radio") el.checked = d[el.name] === el.value;
        else if (el.type === "checkbox") el.checked = !!d[el.name];
        else el.value = d[el.name];
      });
      if (saved) saved.textContent = "이전에 쓰던 내용을 불러왔어요.";
    }
    syncShow();
    form.querySelectorAll("[data-limit]").forEach(function (el) { if (el._paint) el._paint(); });
  })();
  if (form.elements.ref_link && refTag()) form.elements.ref_link.value = refTag();

  var saveTimer;
  form.addEventListener("input", function (e) {
    var f = e.target.closest(".field");
    if (f && f.classList.contains("bad")) check(e.target);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(snapshot()));
        if (saved) saved.textContent = "이 브라우저에 임시 저장됨 · " + new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
      } catch (err) {}
    }, 600);
  });

  // 첨부 파일: 크기 · 영상 길이 확인
  function mb(n) { return (n / 1024 / 1024).toFixed(1) + "MB"; }
  function secText(s) { s = Math.round(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  form.querySelectorAll('input[type="file"]').forEach(function (el) {
    var info = el.closest(".field").querySelector(".file-info");
    var say = function (text, cls) { if (info) { info.textContent = text; info.className = "file-info" + (cls ? " " + cls : ""); } };
    el.addEventListener("change", function () {
      el._meta = null;
      var f = el.files && el.files[0];
      if (!f) { say(""); return; }
      var isVideo = el.hasAttribute("data-video");
      var max = (isVideo ? C.maxVideoMB : C.maxDocMB) || 10;
      if (f.size > max * 1024 * 1024) {
        el._meta = { ok: false, msg: "파일이 너무 커요 (" + mb(f.size) + "). " + max + "MB까지 받을 수 있어요." + (isVideo ? " 720p로 다시 내보내거나 공유 링크로 내 주세요." : "") };
        say(el._meta.msg, "bad"); check(el); return;
      }
      if (!isVideo) { el._meta = { ok: true }; say(f.name + " · " + mb(f.size), "ok"); check(el); return; }
      if (f.type && f.type.indexOf("video/") !== 0) {
        el._meta = { ok: false, msg: "영상 파일이 아니에요." }; say(el._meta.msg, "bad"); check(el); return;
      }
      el._meta = { pending: true };
      say("영상 길이를 확인하는 중…");
      var v = document.createElement("video");
      var url = URL.createObjectURL(f);
      var done = function (sec) {
        URL.revokeObjectURL(url);
        var limit = C.maxTrailerSec || 60;
        if (sec == null) el._meta = { ok: false, msg: "이 영상의 길이를 읽지 못했어요. MP4(H.264)로 내보내거나 공유 링크로 내 주세요." };
        else if (sec > limit + 0.5) el._meta = { ok: false, sec: sec, msg: "영상이 " + secText(sec) + "예요. 예고편은 " + limit + "초 이내여야 해요." };
        else el._meta = { ok: true, sec: sec };
        if (el._meta.ok) say(f.name + " · " + secText(sec) + " · " + mb(f.size), "ok");
        else say(el._meta.msg, "bad");
        check(el);
      };
      v.preload = "metadata";
      v.onloadedmetadata = function () { done(isFinite(v.duration) ? v.duration : null); };
      v.onerror = function () { done(null); };
      v.src = url;
    });
  });

  // 검사
  function fail(el, msg) {
    var f = el.closest(".field");
    if (f) {
      f.classList.add("bad");
      var e = f.querySelector(".err");
      if (e) e.textContent = msg;
    }
    return false;
  }
  function ok(el) {
    var f = el.closest(".field");
    if (f) f.classList.remove("bad");
    return true;
  }
  function check(el) {
    if (!visible(el)) return ok(el);
    if (el.type === "radio") {
      var any = form.querySelector('input[name="' + el.name + '"]:checked');
      var req = form.querySelector('input[name="' + el.name + '"][required]');
      return req && !any ? fail(el, "하나를 골라 주세요.") : ok(el);
    }
    if (el.type === "checkbox") return el.required && !el.checked ? fail(el, "확인이 필요해요.") : ok(el);
    if (el.type === "file") {
      if (el.required && !(el.files && el.files.length)) return fail(el, "파일을 골라 주세요.");
      if (el._meta && el._meta.pending) return fail(el, "영상 길이를 확인하는 중이에요. 잠시 뒤 다시 눌러 주세요.");
      if (el._meta && !el._meta.ok) return fail(el, el._meta.msg);
      return ok(el);
    }
    var v = el.value.trim();
    if (el.required && !v) return fail(el, el.tagName === "SELECT" ? "골라 주세요." : "꼭 적어 주세요.");
    if (!v) return ok(el);
    if (el.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return fail(el, "메일 주소 형식이 아니에요.");
    if (el.type === "url" && !/^https?:\/\/\S+\.\S+/.test(v)) return fail(el, "https:// 로 시작하는 주소를 넣어 주세요.");
    if (el.type === "tel" && !/^[0-9+\-\s()]{8,}$/.test(v)) return fail(el, "숫자로 적어 주세요.");
    if (el.hasAttribute("data-sec")) {
      var s = Number(v), limit = C.maxTrailerSec || 60;
      if (!(s >= 1 && s <= limit)) return fail(el, "예고편은 1~" + limit + "초여야 해요.");
    }
    var lim = limitOf(el);
    if (lim && lim[0] && len(v) < lim[0]) return fail(el, lim[0] + "자 이상 적어 주세요. 지금 " + len(v) + "자예요.");
    return ok(el);
  }

  // 지원서 본문
  function receiptNo() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    return (kind === "director" ? "D" : "C") + "-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  }
  function collect() {
    var out = [];
    var seen = {};
    fields.forEach(function (el) {
      if (seen[el.name] || !visible(el)) return;
      if (el.type === "hidden" && !el.value) return; // 빈 숨은 칸은 지원서에 넣지 않음
      seen[el.name] = true;
      var label = el.getAttribute("data-label") || el.name;
      var v;
      if (el.type === "radio") {
        var c = form.querySelector('input[name="' + el.name + '"]:checked');
        v = c ? c.value : "";
      } else if (el.type === "checkbox") v = el.checked ? "예" : "아니요";
      else if (el.type === "file") {
        var f = el.files && el.files[0];
        v = f ? f.name + " (" + mb(f.size) + (el._meta && el._meta.sec ? ", " + secText(el._meta.sec) : "") + ")" : "";
      } else v = el.value.trim();
      out.push([label, v]);
    });
    return out;
  }
  function readFile(f) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(String(r.result).split(",")[1] || ""); };
      r.onerror = function () { reject(r.error); };
      r.readAsDataURL(f);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errBox) errBox.textContent = "";
    if (form.elements._gotcha && form.elements._gotcha.value) return; // 스팸 봇

    var first = null;
    fields.forEach(function (el) { if (!check(el) && !first) first = el; });
    if (first) {
      if (errBox) errBox.textContent = "빠지거나 짧은 칸이 있어요. 빨간 표시를 확인해 주세요.";
      var target = first.closest(".field") || first;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (x) {} }, 350);
      return;
    }
    if (!C.submitEndpoint) {
      if (errBox) errBox.textContent = "지금은 접수 준비 중이에요. 잠시 뒤 다시 시도해 주세요. 쓴 내용은 이 브라우저에 남아 있어요.";
      return;
    }

    var no = receiptNo();
    var rows = collect();
    var name = form.elements.name_real.value.trim();
    var text = ["[씨네봄 " + (C.round || "") + " " + KIND_KO + " 지원서]", "접수번호: " + no, "접수 시각: " + new Date().toLocaleString("ko-KR"), ""]
      .concat(rows.map(function (r) { return "■ " + r[0] + "\n" + (r[1] || "-") + "\n"; }))
      .join("\n");
    var fieldsObj = {};
    rows.forEach(function (r) { fieldsObj[r[0]] = r[1]; });

    btn.disabled = true;
    var old = btn.textContent;
    btn.textContent = "보내는 중…";
    if (sending) sending.classList.add("on");

    var fileInputs = Array.prototype.filter.call(form.querySelectorAll('input[type="file"]'), function (el) {
      return visible(el) && el.files && el.files[0];
    });
    Promise.all(fileInputs.map(function (el) {
      var f = el.files[0];
      return readFile(f).then(function (data) {
        return { label: el.getAttribute("data-label"), name: f.name, type: f.type || "application/octet-stream", data: data };
      });
    }))
      .then(function (files) {
        return fetch(C.submitEndpoint, {
          method: "POST",
          // text/plain 으로 보내야 구글 Apps Script가 추가 확인 없이 받습니다
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            kind: kind,
            no: no,
            subject: "[씨네봄 " + (C.round || "") + " " + KIND_KO + " 지원] " + name + " · " + no,
            email: form.elements.email.value.trim(),
            name: name,
            text: text,
            fields: fieldsObj,
            files: files,
          }),
        });
      })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (body) {
        var res = null;
        try { res = JSON.parse(body); } catch (x) {}
        if (res && res.ok === false) { var er = new Error(res.error || "접수 실패"); er.server = true; throw er; }
        try { localStorage.removeItem(KEY); localStorage.removeItem("cinepick-draft-" + kind); } catch (x) {}
        try { sessionStorage.setItem("cinebom-receipt", JSON.stringify({ no: no, kind: kind, name: name })); } catch (x) {}
        location.href = "thanks.html?k=" + kind;
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = old;
        if (sending) sending.classList.remove("on");
        if (errBox && err && err.server && err.message !== "접수 실패") { errBox.textContent = err.message + " 쓴 내용은 이 브라우저에 남아 있어요."; return; }
        if (errBox) errBox.textContent = "보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요. 쓴 내용은 이 브라우저에 남아 있어요. 계속 안 되면 " + (C.contactEmail || "") + "로 알려 주세요.";
      });
  });
})();
