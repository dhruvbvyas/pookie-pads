(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  // Fallback so the page still renders prices if the API is unreachable
  var catalog = {
    deliveryFee: 0,
    onlinePayments: false,
    products: [
      { id: "xl-6", size: "XL", flow: "Regular to medium flow", pads: 6, price: 45, image: "assets/img/pookie-xl-6-pack-520.webp" },
      { id: "xl-50", size: "XL", flow: "Regular to medium flow", pads: 50, price: 375, image: "assets/img/pookie-xl-50-pack-700.webp" },
      { id: "xxl-6", size: "XXL", flow: "Medium to heavy flow", pads: 6, price: 50, image: "assets/img/pookie-xxl-6-pack-520.webp" },
      { id: "xxl-50", size: "XXL", flow: "Medium to heavy flow", pads: 50, price: 400, image: "assets/img/pookie-xxl-50-pack-700.webp" }
    ]
  };
  var byId = {};
  var money = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };

  function indexCatalog() {
    byId = {};
    catalog.products.forEach(function (p) { byId[p.id] = p; });
    $$("[data-price]").forEach(function (el) {
      var p = byId[el.getAttribute("data-price")];
      if (p) el.textContent = money(p.price);
    });
    $$("[data-online-option]").forEach(function (el) { el.hidden = !catalog.onlinePayments; });
    $$("[data-upi-option]").forEach(function (el) { el.hidden = !catalog.upi; });
    // Default to UPI when it's available, since it's paid upfront
    var upiRadio = $('input[name="payment"][value="upi"]');
    if (catalog.upi && upiRadio && !indexCatalog.picked) upiRadio.checked = true;
    var payFaq = $("[data-pay-faq]");
    if (payFaq) {
      var ways = [];
      if (catalog.upi) ways.push("pay by UPI (GPay, PhonePe, Paytm or any UPI app) when you order");
      if (catalog.onlinePayments) ways.push("pay online by card or netbanking");
      ways.push("pay cash on delivery");
      var text = ways.length > 1 ? ways.slice(0, -1).join(", ") + " or " + ways[ways.length - 1] : ways[0];
      payFaq.textContent = "You can " + text + ". You'll see your total before you place the order.";
    }
  }
  indexCatalog();

  fetch("/api/catalog").then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (data && data.products) {
      catalog = data;
      indexCatalog();
      renderBasket();
    }
  }).catch(function () {});

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

  // ---------- Jelly blobs ----------
  $$(".blob").forEach(function (blob) {
    blob.addEventListener("click", function () {
      if (reduceMotion.matches) return;
      blob.classList.remove("is-squished");
      void blob.offsetWidth;
      blob.classList.add("is-squished");
    });
    blob.addEventListener("animationend", function (e) {
      if (e.animationName === "squish") blob.classList.remove("is-squished");
    });
  });

  // Product cards drop in once
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

  // Reviews: show the rest on request, and move focus to the first newly shown card
  var moreBtn = $("[data-more-reviews]");
  if (moreBtn) {
    moreBtn.addEventListener("click", function () {
      var hidden = $$("[data-more]");
      var open = moreBtn.getAttribute("aria-expanded") === "true";
      hidden.forEach(function (el, i) {
        el.hidden = open;
        if (!open && !reduceMotion.matches) {
          el.classList.remove("is-revealed");
          el.style.animationDelay = Math.min(i, 6) * 50 + "ms";
          el.classList.add("is-revealed");
        }
      });
      moreBtn.setAttribute("aria-expanded", String(!open));
      moreBtn.textContent = open ? "Show all " + (hidden.length + 6) + " reviews" : "Show fewer reviews";
      if (!open && hidden[0]) { hidden[0].setAttribute("tabindex", "-1"); hidden[0].focus({ preventScroll: true }); }
      if (open) document.getElementById("reviews").scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  }

  // ---------- Basket state ----------
  var STORE_KEY = "pookie-basket";
  var basket = {};
  try { basket = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { basket = {}; }
  var lastAdded = null;

  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(basket)); } catch (e) {}
  }
  function lines() {
    return Object.keys(basket).filter(function (id) { return byId[id] && basket[id] > 0; })
      .map(function (id) { return { p: byId[id], qty: basket[id] }; });
  }
  function count() { return lines().reduce(function (n, l) { return n + l.qty; }, 0); }
  function subtotal() { return lines().reduce(function (n, l) { return n + l.qty * l.p.price; }, 0); }

  function add(id, qty) {
    if (!byId[id]) return;
    basket[id] = Math.min(20, (basket[id] || 0) + (qty || 1));
    lastAdded = id;
    persist();
    renderBasket();
    var btn = $(".basket-btn");
    btn.classList.remove("is-bumped");
    void btn.offsetWidth;
    btn.classList.add("is-bumped");
  }
  function setQty(id, qty) {
    if (qty <= 0) delete basket[id]; else basket[id] = Math.min(20, qty);
    persist();
    renderBasket();
  }

  // ---------- Basket UI ----------
  var dialog = $("#basket");
  var itemsEl = $("[data-items]", dialog);
  var emptyEl = $("[data-empty]", dialog);
  var cartFoot = $("[data-cart-foot]", dialog);
  var title = $("#basket-title");
  var backBtn = $("[data-step-back]", dialog);
  var steps = { cart: $('[data-step="cart"]', dialog), details: $('[data-step="details"]', dialog), upi: $('[data-step="upi"]', dialog), done: $('[data-step="done"]', dialog) };
  var step = "cart";

  function label(p) { return "Pookie " + p.size + ", " + p.pads + " pads"; }

  function renderQuickAdd() {
    var list = $("[data-quick-add]", dialog);
    list.innerHTML = "";
    catalog.products.forEach(function (p) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--qa", p.size === "XL" ? "var(--xl-tint)" : "var(--xxl-tint)");
      b.innerHTML = '<img src="' + p.image + '" alt="" loading="lazy"><b>' + p.size + " · " + p.pads + " pads</b><span>" + money(p.price) + "</span>";
      b.setAttribute("aria-label", "Add " + label(p) + " for " + money(p.price));
      b.addEventListener("click", function () { add(p.id); focusFirstLine(); });
      li.appendChild(b);
      list.appendChild(li);
    });
  }

  function focusFirstLine() {
    var first = $(".stepper button", itemsEl);
    if (first) first.focus();
  }

  function renderBasket() {
    var n = count();
    $$("[data-basket-count]").forEach(function (el) { el.textContent = n; });
    $$(".basket-btn").forEach(function (el) { el.setAttribute("aria-label", "Open basket, " + n + (n === 1 ? " item" : " items")); });

    var ls = lines();
    itemsEl.innerHTML = "";
    ls.forEach(function (l) {
      var li = document.createElement("li");
      li.className = "line" + (l.p.id === lastAdded && !reduceMotion.matches ? " is-new" : "");
      li.innerHTML =
        '<img class="line__img" src="' + l.p.image + '" alt="">' +
        '<div><p class="line__name">Pookie ' + l.p.size + " · " + l.p.pads + ' pads</p><p class="line__meta">' + l.p.flow + " · " + money(l.p.price) + " each</p></div>" +
        '<p class="line__price">' + money(l.p.price * l.qty) + "</p>" +
        '<div class="line__controls"><div class="stepper" role="group" aria-label="Quantity for ' + label(l.p) + '">' +
        '<button type="button" data-dec aria-label="Remove one">−</button><output aria-live="polite">' + l.qty + "</output>" +
        '<button type="button" data-inc aria-label="Add one">+</button></div>' +
        '<button class="line__remove" type="button" data-remove>Remove</button></div>';
      $("[data-dec]", li).addEventListener("click", function () { setQty(l.p.id, l.qty - 1); refocus(l.p.id, "[data-dec]"); });
      $("[data-inc]", li).addEventListener("click", function () { setQty(l.p.id, l.qty + 1); refocus(l.p.id, "[data-inc]"); });
      $("[data-remove]", li).addEventListener("click", function () {
        setQty(l.p.id, 0);
        toast(label(l.p) + " removed");
        title.focus();
      });
      li.dataset.id = l.p.id;
      itemsEl.appendChild(li);
    });
    lastAdded = null;

    emptyEl.hidden = ls.length > 0;
    cartFoot.hidden = ls.length === 0;
    if (!ls.length) renderQuickAdd();
    $$("[data-subtotal]", dialog).forEach(function (el) { el.textContent = money(subtotal()); });
    $$("[data-total]", dialog).forEach(function (el) { el.textContent = money(subtotal() + (catalog.deliveryFee || 0)); });
  }

  function refocus(id, sel) {
    var li = $('.line[data-id="' + id + '"]', itemsEl);
    var el = li && $(sel, li);
    if (el) el.focus(); else title.focus();
  }

  function goStep(name) {
    step = name;
    Object.keys(steps).forEach(function (k) { steps[k].hidden = k !== name; });
    backBtn.hidden = name !== "details";
    title.textContent = { cart: "Your basket", details: "Delivery details", upi: "Pay by UPI", done: "Thank you" }[name];
    title.focus();
  }

  function openBasket() {
    if (step === "done") goStep("cart");
    renderBasket();
    if (!dialog.open) {
      dialog.classList.remove("is-closing");
      dialog.showModal();
      document.body.classList.add("is-locked");
    }
    title.focus();
  }
  function closeBasket() {
    if (!dialog.open) return;
    if (reduceMotion.matches) { finishClose(); return; }
    dialog.classList.add("is-closing");
    setTimeout(finishClose, 250);
  }
  function finishClose() {
    dialog.classList.remove("is-closing");
    dialog.close();
  }
  dialog.addEventListener("close", function () {
    document.body.classList.remove("is-locked");
    if (step === "done") goStep("cart");
  });
  $$('input[name="payment"]').forEach(function (r) { r.addEventListener("change", function () { indexCatalog.picked = true; }); });
  dialog.addEventListener("cancel", function (e) { e.preventDefault(); closeBasket(); });
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeBasket(); });
  $$("[data-close-basket]").forEach(function (b) { b.addEventListener("click", closeBasket); });
  $$("[data-open-basket]").forEach(function (b) { b.addEventListener("click", openBasket); });
  backBtn.addEventListener("click", function () { goStep("cart"); });
  $("[data-go-checkout]", dialog).addEventListener("click", function () {
    if (!count()) return;
    goStep("details");
  });

  // Product cards: pack size picker + add to basket
  $$("[data-product]").forEach(function (card) {
    var photo = $("[data-photo]", card);
    var picked = function () { return $("input[type=radio]:checked", card).value; };
    $$("input[type=radio]", card).forEach(function (r) {
      r.addEventListener("change", function () {
        var p = byId[r.value];
        if (!p) return;
        if (reduceMotion.matches) { photo.src = p.image; return; }
        photo.classList.add("is-swapping");
        setTimeout(function () {
          photo.src = p.image;
          photo.onload = function () { photo.classList.remove("is-swapping"); };
        }, 180);
      });
    });
    $("[data-add]", card).addEventListener("click", function () {
      add(picked());
      openBasket();
    });
  });
  $$("[data-add-id]").forEach(function (b) {
    b.addEventListener("click", function () { add(b.getAttribute("data-add-id")); openBasket(); });
  });

  // ---------- Fit finder ----------
  var fits = {
    light: { size: "xl", why: "Light day? XL is ultra thin, so it barely feels like anything." },
    regular: { size: "xl", why: "Regular day, regular pad. Thin enough for jeans, comfy enough for a full day." },
    medium: { size: "xl", why: "XL looks after regular to medium flow without the bulk." },
    heavy: { size: "xxl", why: "For heavier days, XXL gives you extra length and stays ultra thin." },
    overnight: { size: "xxl", why: "XXL's extra length keeps you comfortable all night." }
  };
  var fitCard = $(".fit__card");
  if (fitCard) {
    var fitCta = $(".fit__cta", fitCard);
    $$('input[name="flow"]').forEach(function (input) {
      input.addEventListener("change", function () {
        var fit = fits[input.value];
        var p = byId[fit.size + "-6"];
        fitCard.dataset.size = fit.size;
        $(".fit__size", fitCard).textContent = "Pookie " + p.size;
        $(".fit__why", fitCard).textContent = fit.why;
        $(".fit__img", fitCard).src = p.image;
        fitCta.textContent = "Add " + p.size + " to basket";
        fitCta.setAttribute("data-add-id", p.id);
        fitCta.classList.toggle("btn--xl", fit.size === "xl");
        fitCta.classList.toggle("btn--xxl", fit.size === "xxl");
        fitCard.classList.remove("is-swapping");
        void fitCard.offsetWidth;
        fitCard.classList.add("is-swapping");
      });
    });
    fitCard.addEventListener("animationend", function () { fitCard.classList.remove("is-swapping"); });
  }

  // ---------- Checkout ----------
  var form = steps.details;
  var summary = $("[data-error-summary]", form);
  var formError = $("[data-form-error]", form);
  var placeBtn = $("[data-place]", form);
  var fieldNames = { name: "Full name", phone: "Mobile number", address: "Delivery address", city: "City", pincode: "PIN code" };

  function cleanPhone(v) { return String(v).replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""); }

  function validate(data) {
    var e = {};
    if (data.name.length < 2) e.name = "Enter your full name.";
    if (!/^[6-9]\d{9}$/.test(cleanPhone(data.phone))) e.phone = "Enter a 10-digit Indian mobile number.";
    if (data.address.length < 10) e.address = "Enter your full address: house number, street and area.";
    if (data.city.length < 2) e.city = "Enter your city.";
    if (!/^[1-9]\d{5}$/.test(data.pincode)) e.pincode = "Enter a 6-digit PIN code.";
    return e;
  }

  function showFieldError(name, msg) {
    var input = form.elements[name];
    var err = $("#c-" + name + "-err");
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    err.textContent = msg || "";
  }

  function showErrors(errors) {
    Object.keys(fieldNames).forEach(function (k) { showFieldError(k, errors[k]); });
    var keys = Object.keys(errors).filter(function (k) { return fieldNames[k]; });
    if (!keys.length) { summary.hidden = true; return; }
    summary.innerHTML = "<p>Please fix " + (keys.length === 1 ? "this" : "these " + keys.length) + " to place your order:</p><ul>" +
      keys.map(function (k) { return '<li><a href="#c-' + k + '">' + errors[k] + "</a></li>"; }).join("") + "</ul>";
    summary.hidden = false;
    $$("a", summary).forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); $(a.getAttribute("href")).focus(); });
    });
    if (keys.length > 1) summary.focus(); else form.elements[keys[0]].focus();
  }

  // Validate a field once the customer leaves it, then live while they fix it
  Object.keys(fieldNames).forEach(function (k) {
    var input = form.elements[k];
    input.addEventListener("blur", function () {
      if (!input.value.trim()) return;
      var errs = validate(readForm());
      showFieldError(k, errs[k]);
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid")) showFieldError(k, validate(readForm())[k]);
    });
  });

  function readForm() {
    return {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      address: form.elements.address.value.trim(),
      city: form.elements.city.value.trim(),
      pincode: form.elements.pincode.value.trim()
    };
  }

  function busy(on, text) {
    placeBtn.setAttribute("aria-busy", String(on));
    placeBtn.textContent = on ? text : "Place order";
  }

  function postJson(url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (!r.ok) { var err = new Error(data.error || "Something went wrong. Try again."); err.fields = data.fields; throw err; }
          return data;
        });
      });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    formError.textContent = "";
    var data = readForm();
    var errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) return;
    if (!count()) { goStep("cart"); return; }

    var choice = form.elements.payment.value;
    var payment = (choice === "online" && catalog.onlinePayments) ? "online" : (choice === "upi" && catalog.upi) ? "upi" : "cod";
    busy(true, "Placing your order…");
    postJson("/api/orders", {
      customer: { name: data.name, phone: cleanPhone(data.phone), address: data.address, city: data.city, pincode: data.pincode },
      items: lines().map(function (l) { return { id: l.p.id, qty: l.qty }; }),
      payment: payment
    }).then(function (res) {
      if (res.razorpay) return payOnline(res);
      if (res.upi) { showUpi(res); return null; }
      return res;
    }).then(function (res) {
      if (!res) return;
      orderDone(res);
    }).catch(function (err) {
      busy(false);
      if (err.fields) showErrors(err.fields);
      formError.textContent = err.message === "Failed to fetch" ? "We couldn't reach our server. Check your connection and try again." : err.message;
    });
  });

  function loadRazorpay() {
    return new Promise(function (resolve, reject) {
      if (window.Razorpay) return resolve();
      var s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Online payment couldn't load. Choose cash on delivery or try again.")); };
      document.head.appendChild(s);
    });
  }

  function payOnline(res) {
    busy(true, "Opening payment…");
    return loadRazorpay().then(function () {
      return new Promise(function (resolve, reject) {
        var rz = new window.Razorpay({
          key: res.razorpay.key,
          order_id: res.razorpay.orderId,
          amount: res.razorpay.amount,
          currency: "INR",
          name: res.razorpay.name,
          description: "Order " + res.orderId,
          prefill: res.razorpay.prefill,
          theme: { color: "#D61F69" },
          handler: function (payment) {
            busy(true, "Confirming payment…");
            postJson("/api/orders/" + res.orderId + "/verify", payment).then(resolve, reject);
          },
          modal: { ondismiss: function () { reject(new Error("Payment cancelled. Your basket is saved, so you can try again or choose cash on delivery.")); } }
        });
        rz.on("payment.failed", function (r) { reject(new Error((r.error && r.error.description) || "Payment failed. Try again or choose cash on delivery.")); });
        rz.open();
      });
    });
  }

  // ---------- UPI ----------
  var upiForm = steps.upi;
  var upiOrder = null;
  var utrInput = $("#c-utr", upiForm);
  var utrErr = $("#c-utr-err", upiForm);
  var upiError = $("[data-upi-error]", upiForm);
  var upiConfirm = $("[data-upi-confirm]", upiForm);

  function loadQrLib() {
    return new Promise(function (resolve, reject) {
      if (window.qrcode) return resolve();
      var s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function showUpi(res) {
    busy(false);
    upiOrder = res;
    $("[data-upi-amount]", upiForm).textContent = money(res.total);
    $("[data-upi-order]", upiForm).textContent = res.orderId;
    $("[data-upi-id]", upiForm).textContent = res.upi.id;
    $("[data-upi-link]", upiForm).href = res.upi.link;
    utrInput.value = "";
    utrErr.textContent = "";
    upiError.textContent = "";
    utrInput.removeAttribute("aria-invalid");
    var box = $("[data-upi-qr]", upiForm);
    box.innerHTML = "";
    loadQrLib().then(function () {
      var qr = window.qrcode(0, "M");
      qr.addData(res.upi.link);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    }).catch(function () {
      box.textContent = "QR couldn't load. Pay to the UPI ID below.";
    });
    goStep("upi");
  }

  $("[data-copy-upi]", upiForm).addEventListener("click", function () {
    var id = $("[data-upi-id]", upiForm).textContent;
    var done = function () { toast("UPI ID copied"); };
    if (navigator.clipboard) navigator.clipboard.writeText(id).then(done, function () { toast("Copy failed. Select the UPI ID and copy it."); });
  });

  function validUtr(v) { return /^\d{12}$/.test(v); }
  utrInput.addEventListener("input", function () {
    utrInput.value = utrInput.value.replace(/\D/g, "").slice(0, 12);
    if (utrInput.getAttribute("aria-invalid") && validUtr(utrInput.value)) {
      utrInput.removeAttribute("aria-invalid");
      utrErr.textContent = "";
    }
  });

  upiForm.addEventListener("submit", function (e) {
    e.preventDefault();
    upiError.textContent = "";
    var utr = utrInput.value.trim();
    if (!validUtr(utr)) {
      utrInput.setAttribute("aria-invalid", "true");
      utrErr.textContent = utr ? "A UPI transaction ID has exactly 12 digits. Check your payment app." : "Enter the 12-digit UPI transaction ID from your payment app.";
      utrInput.focus();
      return;
    }
    upiConfirm.setAttribute("aria-busy", "true");
    upiConfirm.textContent = "Confirming…";
    postJson("/api/orders/" + upiOrder.orderId + "/upi", { utr: utr }).then(orderDone).catch(function (err) {
      upiError.textContent = err.message === "Failed to fetch" ? "We couldn't reach our server. Check your connection and try again." : err.message;
    }).then(function () {
      upiConfirm.removeAttribute("aria-busy");
      upiConfirm.textContent = "I've paid, confirm order";
    });
  });

  $("[data-upi-cod]", upiForm).addEventListener("click", function () {
    postJson("/api/orders/" + upiOrder.orderId + "/cod", {}).then(orderDone).catch(function (err) {
      upiError.textContent = err.message;
    });
  });

  function orderDone(res) {
    busy(false);
    basket = {};
    persist();
    renderBasket();
    form.reset();
    summary.hidden = true;
    $("[data-order-id]", dialog).textContent = res.orderId;
    var phone = "+91 " + String(res.phone).replace(/(\d{5})(\d{5})/, "$1 $2");
    var paid = res.status === "paid" ? "Your payment of " + money(res.total) + " is received. "
      : res.status === "upi_submitted" ? "Your UPI payment of " + money(res.total) + " is being verified. "
      : "Please keep " + money(res.total) + " ready for cash on delivery. ";
    $("[data-done-msg]", dialog).textContent = paid + (res.smsSent
      ? "A confirmation SMS is on its way to " + phone + "."
      : "We'll confirm your order on " + phone + ".");
    goStep("done");
  }

  // ---------- Toast ----------
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3500);
  }

  // ---------- Pookie club ----------
  var club = $(".club__form");
  if (club) {
    var email = $("#email", club);
    var msg = $(".club__msg", club);
    var btn = $("button", club);
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    club.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = email.value.trim();
      if (!value) return clubError("Enter your email to join.");
      if (!valid.test(value)) return clubError("That email doesn't look right. Check for typos.");
      email.removeAttribute("aria-invalid");
      btn.setAttribute("aria-busy", "true");
      btn.textContent = "Joining…";
      postJson("/api/subscribe", { email: value }).then(function (res) {
        msg.textContent = !res.isNew ? "You're already in the club. Thanks for being here."
          : res.emailSent ? "You're in. We've sent a welcome email to " + value + "."
          : "You're in. Watch your inbox for Pookie club news.";
        club.reset();
      }).catch(function (err) {
        clubError(err.message === "Failed to fetch" ? "We couldn't reach our server. Check your connection and try again." : err.message);
      }).then(function () {
        btn.removeAttribute("aria-busy");
        btn.textContent = "Join the club";
      });
    });
    email.addEventListener("input", function () {
      if (email.getAttribute("aria-invalid")) { email.removeAttribute("aria-invalid"); msg.textContent = ""; }
    });
    function clubError(text) {
      email.setAttribute("aria-invalid", "true");
      msg.textContent = text;
      email.focus();
    }
  }

  renderBasket();
})();
