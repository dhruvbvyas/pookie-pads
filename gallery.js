// Gallery page: nav menu, drop-in tiles, and a photo viewer (arrows, keys or a swipe)
(function () {
  "use strict";
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Nav ----------
  var nav = $(".nav");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      ticking = false;
    });
  }, { passive: true });

  var toggle = $(".nav__toggle");
  var menu = $("#nav-menu");
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });

  // ---------- Tiles drop in once ----------
  var jellies = $$("[data-jelly]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15 });
    jellies.forEach(function (el) { io.observe(el); });
  } else {
    jellies.forEach(function (el) { el.classList.add("is-in"); });
  }

  // ---------- Photo viewer ----------
  var viewer = $("#viewer");
  var shots = $$(".gallery__btn");
  var vImg = $("[data-viewer-img]", viewer), vCap = $("[data-viewer-cap]", viewer);
  var vAt = 0, vFrom = null;
  function show(i) {
    vAt = (i + shots.length) % shots.length;
    var b = shots[vAt];
    vImg.src = b.getAttribute("data-full");
    vImg.alt = $("img", b).alt;
    vCap.textContent = $(".gallery__cap", b).textContent;
    vImg.style.animation = "none"; void vImg.offsetWidth; vImg.style.animation = "";
  }
  shots.forEach(function (b, i) {
    b.addEventListener("click", function () { show(i); viewer.showModal(); });
  });
  $$("[data-viewer-step]", viewer).forEach(function (b) {
    b.addEventListener("click", function () { show(vAt + Number(b.getAttribute("data-viewer-step"))); });
  });
  $("[data-viewer-close]", viewer).addEventListener("click", function () { viewer.close(); });
  viewer.addEventListener("click", function (e) { if (e.target === viewer || e.target.classList.contains("viewer__figure")) viewer.close(); });
  viewer.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(vAt - 1);
    if (e.key === "ArrowRight") show(vAt + 1);
  });
  viewer.addEventListener("touchstart", function (e) { vFrom = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener("touchend", function (e) {
    if (vFrom === null) return;
    var dx = e.changedTouches[0].clientX - vFrom;
    if (Math.abs(dx) > 50) show(vAt + (dx < 0 ? 1 : -1));
    vFrom = null;
  });
  viewer.addEventListener("close", function () { shots[vAt].focus({ preventScroll: true }); });
})();
