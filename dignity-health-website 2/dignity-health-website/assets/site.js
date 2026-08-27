// ===================== DIGNITY HEALTH SITE JS =====================
// Client-side cart using localStorage. This is a front-end prototype:
// it demonstrates full add/remove/qty/checkout UX. Wiring it to real
// inventory + payments happens in the Shopify build step.

(function () {
  var CART_KEY = "dh_cart_v1";

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return window.__dhCartMem || [];
    }
  }
  function writeCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      window.__dhCartMem = cart;
    }
  }

  function money(n) {
    return "\u20b9" + n.toLocaleString("en-IN");
  }

  function addToCart(item) {
    var cart = readCart();
    var existing = cart.find(function (c) { return c.id === item.id; });
    if (existing) {
      existing.qty += 1;
    } else {
      item.qty = 1;
      cart.push(item);
    }
    writeCart(cart);
    renderCart();
    openCart();
    showToast(item.name + " added to cart");
  }

  function removeFromCart(id) {
    var cart = readCart().filter(function (c) { return c.id !== id; });
    writeCart(cart);
    renderCart();
  }

  function changeQty(id, delta) {
    var cart = readCart();
    var item = cart.find(function (c) { return c.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function (c) { return c.id !== id; });
    }
    writeCart(cart);
    renderCart();
  }

  function cartCount() {
    return readCart().reduce(function (sum, c) { return sum + c.qty; }, 0);
  }
  function cartSubtotal() {
    return readCart().reduce(function (sum, c) { return sum + c.qty * c.price; }, 0);
  }

  function renderCart() {
    var countEls = document.querySelectorAll("[data-cart-count]");
    countEls.forEach(function (el) { el.textContent = cartCount(); });

    var itemsEl = document.getElementById("cartItems");
    var subtotalEl = document.getElementById("cartSubtotal");
    if (!itemsEl) return;

    var cart = readCart();
    if (cart.length === 0) {
      itemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.<br>Tere se nahi hoga? Prove it \u2014 add something.</div>';
    } else {
      itemsEl.innerHTML = cart.map(function (c) {
        return '' +
          '<div class="cart-line">' +
          '<img src="' + c.img + '" alt="' + c.name + '">' +
          '<div class="cart-line-info">' +
          '<div class="cart-line-name">' + c.name + '</div>' +
          '<div class="cart-line-meta">' + (c.variant || "") + '</div>' +
          '<div class="cart-line-row">' +
          '<div class="cart-line-qty">' +
          '<button onclick="DH.changeQty(\'' + c.id + '\',-1)" aria-label="Decrease">\u2212</button>' +
          '<span>' + c.qty + '</span>' +
          '<button onclick="DH.changeQty(\'' + c.id + '\',1)" aria-label="Increase">+</button>' +
          '</div>' +
          '<div class="cart-line-price">' + money(c.price * c.qty) + '</div>' +
          '</div>' +
          '<button class="cart-line-remove" onclick="DH.removeFromCart(\'' + c.id + '\')">Remove</button>' +
          '</div></div>';
      }).join("");
    }
    if (subtotalEl) subtotalEl.textContent = money(cartSubtotal());
  }

  function openCart() {
    var d = document.getElementById("cartDrawer");
    var o = document.getElementById("dhOverlay");
    if (d) d.classList.add("open");
    if (o) o.classList.add("open");
    closeAccount();
  }
  function closeCart() {
    var d = document.getElementById("cartDrawer");
    var o = document.getElementById("dhOverlay");
    if (d) d.classList.remove("open");
    if (o) o.classList.remove("open");
  }

  function toggleAccount(e) {
    if (e) e.stopPropagation();
    var d = document.getElementById("accountDropdown");
    if (d) d.classList.toggle("open");
  }
  function closeAccount() {
    var d = document.getElementById("accountDropdown");
    if (d) d.classList.remove("open");
  }

  function openMobileNav() {
    var m = document.getElementById("mobileNav");
    var o = document.getElementById("dhOverlay");
    if (m) m.classList.add("open");
    if (o) o.classList.add("open");
  }
  function closeMobileNav() {
    var m = document.getElementById("mobileNav");
    var o = document.getElementById("dhOverlay");
    if (m) m.classList.remove("open");
    if (o) o.classList.remove("open");
  }

  var toastTimer;
  function showToast(msg) {
    var t = document.getElementById("dhToast");
    if (!t) return;
    t.innerHTML = '<span class="dot"></span>' + msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ---- product tabs ----
  function initTabs() {
    var tabs = document.querySelectorAll(".pd-tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        document.querySelectorAll(".pd-tab").forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".pd-tab-panel").forEach(function (p) { p.classList.remove("active"); });
        tab.classList.add("active");
        var panel = document.getElementById(target);
        if (panel) panel.classList.add("active");
      });
    });
  }

  // ---- FAQ accordion ----
  function initFaq() {
    document.querySelectorAll(".faq-q").forEach(function (q) {
      q.addEventListener("click", function () {
        var item = q.closest(".faq-item");
        var wasOpen = item.classList.contains("open");
        item.parentElement.querySelectorAll(".faq-item").forEach(function (i) { i.classList.remove("open"); });
        if (!wasOpen) item.classList.add("open");
      });
    });
  }

  // ---- flavour / size chip switching (visual only, non-navigating chips) ----
  function initChips() {
    document.querySelectorAll(".flavor-row").forEach(function (row) {
      row.querySelectorAll(".flavor-chip[data-novigate]").forEach(function (chip) {
        chip.addEventListener("click", function (e) {
          e.preventDefault();
          row.querySelectorAll(".flavor-chip").forEach(function (c) { c.classList.remove("active"); });
          chip.classList.add("active");
        });
      });
    });
  }

  // ---- qty stepper on product page (pre-cart, local only) ----
  function initPdQty() {
    document.querySelectorAll(".qty-stepper").forEach(function (stepper) {
      var span = stepper.querySelector("span");
      var minus = stepper.querySelectorAll("button")[0];
      var plus = stepper.querySelectorAll("button")[1];
      if (!span) return;
      minus.addEventListener("click", function () {
        var v = parseInt(span.textContent, 10);
        if (v > 1) span.textContent = v - 1;
      });
      plus.addEventListener("click", function () {
        span.textContent = parseInt(span.textContent, 10) + 1;
      });
    });
  }

  // ---- account mock login/register/dashboard ----
  function authTab(which) {
    document.querySelectorAll(".auth-tab-btn").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".auth-panel").forEach(function (p) { p.classList.remove("active"); });
    var btn = document.getElementById("authTabBtn-" + which);
    var panel = document.getElementById("authPanel-" + which);
    if (btn) btn.classList.add("active");
    if (panel) panel.classList.add("active");
  }
  function mockLogin(e, name) {
    if (e) e.preventDefault();
    try { localStorage.setItem("dh_user_name", name || "Ajeet"); } catch (err) {}
    showDashboard();
  }
  function mockLogout() {
    try { localStorage.removeItem("dh_user_name"); } catch (err) {}
    location.reload();
  }
  function showDashboard() {
    var name = "Ajeet";
    try { name = localStorage.getItem("dh_user_name") || "Ajeet"; } catch (e) {}
    var gate = document.getElementById("authGate");
    var dash = document.getElementById("dashboard");
    if (gate) gate.style.display = "none";
    if (dash) dash.classList.add("active");
    var nameEls = document.querySelectorAll("[data-user-name]");
    nameEls.forEach(function (el) { el.textContent = name; });
    var initialEls = document.querySelectorAll("[data-user-initial]");
    initialEls.forEach(function (el) { el.textContent = name.charAt(0).toUpperCase(); });
  }
  function dashNav(section) {
    document.querySelectorAll(".dash-nav a").forEach(function (a) { a.classList.remove("active"); });
    document.querySelectorAll(".dash-section").forEach(function (s) { s.style.display = "none"; });
    var link = document.getElementById("dashlink-" + section);
    var sec = document.getElementById("dashsec-" + section);
    if (link) link.classList.add("active");
    if (sec) sec.style.display = "block";
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCart();
    initTabs();
    initFaq();
    initChips();
    initPdQty();

    document.addEventListener("click", function (e) {
      var accWrap = document.querySelector(".account-wrap");
      if (accWrap && !accWrap.contains(e.target)) closeAccount();
    });

    var loggedIn = false;
    try { loggedIn = !!localStorage.getItem("dh_user_name"); } catch (e) {}
    if (loggedIn && document.getElementById("dashboard")) showDashboard();
  });

  window.DH = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    changeQty: changeQty,
    openCart: openCart,
    closeCart: closeCart,
    toggleAccount: toggleAccount,
    closeAccount: closeAccount,
    openMobileNav: openMobileNav,
    closeMobileNav: closeMobileNav,
    authTab: authTab,
    mockLogin: mockLogin,
    mockLogout: mockLogout,
    dashNav: dashNav
  };
})();
