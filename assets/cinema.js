// 영화관 연출: 머리 막대 색, 구역이 나타나는 효과, 영사기 먼지. 없어도 내용은 그대로 보입니다.
(function () {
  var top = document.querySelector(".top");
  if (top && !top.classList.contains("solid")) {
    var onScroll = function () { top.classList.toggle("scrolled", window.scrollY > 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 구역이 나타나는 효과
  var items = document.querySelectorAll(".reveal");
  if (items.length) {
    if (still || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      items.forEach(function (el) { io.observe(el); });
    }
  }

  // 영사기 빛 속에 떠다니는 먼지
  var dust = document.querySelector(".dust");
  if (dust && !still) {
    for (var i = 0; i < 34; i++) {
      var d = document.createElement("i");
      var size = 1.5 + Math.random() * 3.2;
      d.style.cssText =
        "left:" + (8 + Math.random() * 84).toFixed(1) + "%;" +
        "top:" + (10 + Math.random() * 80).toFixed(1) + "%;" +
        "width:" + size.toFixed(1) + "px;height:" + size.toFixed(1) + "px;" +
        "--o:" + (0.25 + Math.random() * 0.5).toFixed(2) + ";" +
        "--dx:" + ((Math.random() - 0.5) * 80).toFixed(0) + "px;" +
        "animation-duration:" + (9 + Math.random() * 12).toFixed(1) + "s;" +
        "animation-delay:-" + (Math.random() * 14).toFixed(1) + "s;";
      dust.appendChild(d);
    }
  }
})();
