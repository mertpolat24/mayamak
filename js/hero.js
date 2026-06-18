/* Homepage – single full-screen product with name buttons */
window.MayamakHero = (function () {
  var current = 0;
  var timer = null;
  var INTERVAL = 8000;

  function getProducts() {
    return window.MAYAMAK_DATA.products;
  }

  function productName(p) {
    return MayamakI18n.getLang() === "en" ? p.nameEn : p.nameTr;
  }

  function productDesc(p) {
    return MayamakI18n.getLang() === "en" ? p.descEn : p.descTr;
  }

  function renderVisual(container, keepStatic) {
    var products = getProducts();
    var start = 0;
    if (keepStatic && container.querySelector("[data-hero-static]")) {
      start = 1;
      container.querySelectorAll(".product-hero-item:not([data-hero-static])").forEach(function (el) {
        el.remove();
      });
    } else {
      container.innerHTML = "";
    }
    var html = products.slice(start).map(function (p, i) {
      var idx = i + start;
      return (
        '<article class="product-hero-item' + (idx === current ? " active" : "") + '" data-index="' + idx + '">' +
          MayamakImages.buildImg(p.image, productName(p), {
            priority: idx === 0 && !keepStatic,
            sizes: "hero"
          }) +
          '<div class="product-hero-shade"></div>' +
          '<div class="product-hero-caption">' +
            '<h2>' + productName(p) + '</h2>' +
            '<p>' + productDesc(p) + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");
    if (html) container.insertAdjacentHTML("beforeend", html);
    if (keepStatic && start === 1) {
      var staticEl = container.querySelector("[data-hero-static]");
      if (staticEl) staticEl.classList.toggle("active", current === 0);
    }
  }

  function renderNameNav(container) {
    var products = getProducts();
    container.innerHTML = products.map(function (p, i) {
      return (
        '<button type="button" class="product-name-btn' + (i === current ? " active" : "") + '" data-index="' + i + '">' +
          productName(p) +
        '</button>'
      );
    }).join("");

    container.querySelectorAll(".product-name-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(parseInt(btn.getAttribute("data-index"), 10));
      });
    });
  }

  function goTo(index) {
    var products = getProducts();
    if (index < 0 || index >= products.length) return;
    current = index;

    document.querySelectorAll(".product-hero-item").forEach(function (el, i) {
      el.classList.toggle("active", i === current);
    });
    document.querySelectorAll(".product-name-btn").forEach(function (btn, i) {
      btn.classList.toggle("active", i === current);
    });
    resetTimer();
  }

  function resetTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(function () {
      goTo((current + 1) % getProducts().length);
    }, INTERVAL);
  }

  function updateStaticCaption() {
    var staticEl = document.querySelector("[data-hero-static]");
    if (!staticEl) return;
    var p = getProducts()[0];
    if (!p) return;
    var h2 = staticEl.querySelector("h2");
    var desc = staticEl.querySelector("p");
    if (h2) h2.textContent = productName(p);
    if (desc) desc.textContent = productDesc(p);
  }

  function init() {
    var slides = document.getElementById("product-hero-slides");
    var nav = document.getElementById("product-hero-nav-names");
    if (!slides || !nav) return;
    current = 0;
    var hasStatic = !!slides.querySelector("[data-hero-static]");
    renderVisual(slides, hasStatic);
    if (hasStatic) updateStaticCaption();
    renderNameNav(nav);
    resetTimer();
  }

  function refresh() {
    var slides = document.getElementById("product-hero-slides");
    var nav = document.getElementById("product-hero-nav-names");
    if (!slides || !nav) return;
    var hasStatic = !!slides.querySelector("[data-hero-static]");
    if (hasStatic) {
      updateStaticCaption();
      renderVisual(slides, true);
    } else {
      renderVisual(slides, false);
    }
    renderNameNav(nav);
  }

  return { init: init, refresh: refresh, goTo: goTo };
})();

document.addEventListener("mayamak:langchange", function () {
  if (document.getElementById("product-hero-single")) {
    MayamakHero.refresh();
  }
});
