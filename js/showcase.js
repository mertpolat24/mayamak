/* Products page – 4 expanding full-photo cards */
window.MayamakProductShowcase = (function () {
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

  function renderGrid(container) {
    var products = getProducts();
    container.innerHTML = products.map(function (p, i) {
      return (
        '<article class="product-showcase-card' + (i === current ? " active" : "") + '" data-index="' + i + '" tabindex="0">' +
          MayamakImages.buildImg(p.image, productName(p), { priority: i === 0, sizes: "product" }) +
          '<div class="product-showcase-shade"></div>' +
          '<div class="product-showcase-caption">' +
            '<h2>' + productName(p) + '</h2>' +
            '<p>' + productDesc(p) + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    container.querySelectorAll(".product-showcase-card").forEach(function (card) {
      card.addEventListener("click", function () {
        goTo(parseInt(card.getAttribute("data-index"), 10));
      });
    });
  }

  function goTo(index) {
    var products = getProducts();
    if (index < 0 || index >= products.length) return;
    current = index;

    document.querySelectorAll(".product-showcase-card").forEach(function (c, i) {
      c.classList.toggle("active", i === current);
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
    var grid = document.getElementById("product-showcase-grid");
    if (!grid) return;
    current = 0;
    renderGrid(grid);
    resetTimer();
  }

  function refresh() {
    var grid = document.getElementById("product-showcase-grid");
    if (!grid) return;
    renderGrid(grid);
  }

  return { init: init, refresh: refresh, goTo: goTo };
})();

document.addEventListener("mayamak:langchange", function () {
  if (document.getElementById("product-showcase")) {
    MayamakProductShowcase.refresh();
  }
});
