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

  function renderVisual(container) {
    var products = getProducts();
    container.innerHTML = products.map(function (p, i) {
      return (
        '<article class="product-hero-item' + (i === current ? " active" : "") + '" data-index="' + i + '">' +
          MayamakImages.buildImg(p.image, productName(p), { priority: i === 0 }) +
          '<div class="product-hero-shade"></div>' +
          '<div class="product-hero-caption">' +
            '<h2>' + productName(p) + '</h2>' +
            '<p>' + productDesc(p) + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");
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

  function init() {
    var slides = document.getElementById("product-hero-slides");
    var nav = document.getElementById("product-hero-nav-names");
    if (!slides || !nav) return;
    current = 0;
    renderVisual(slides);
    renderNameNav(nav);
    resetTimer();
  }

  function refresh() {
    var slides = document.getElementById("product-hero-slides");
    var nav = document.getElementById("product-hero-nav-names");
    if (!slides || !nav) return;
    renderVisual(slides);
    renderNameNav(nav);
  }

  return { init: init, refresh: refresh, goTo: goTo };
})();

document.addEventListener("mayamak:langchange", function () {
  if (document.getElementById("product-hero-single")) {
    MayamakHero.refresh();
  }
});
