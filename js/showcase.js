/* Products page – 4 expanding full-photo cards */
window.MayamakProductShowcase = (function () {
  function getLangProp(obj, prop) {
    if (!obj) return "";
    var lang = window.MayamakI18n ? window.MayamakI18n.getLang() : "tr";
    if (prop) {
      if (lang === "de" && obj[prop + "De"]) return obj[prop + "De"];
      if (lang === "en" && obj[prop + "En"]) return obj[prop + "En"];
      if (lang === "tr" && obj[prop + "Tr"]) return obj[prop + "Tr"];
      if (obj[prop + "Tr"]) return obj[prop + "Tr"];
      if (obj[prop]) return obj[prop];
    }
    if (obj[lang]) return obj[lang];
    var langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
    if (obj[langCap]) return obj[langCap];
    return obj.tr || obj.Tr || obj.en || obj.En || obj.de || obj.De || "";
  }

  var current = 0;
  var timer = null;
  var INTERVAL = 8000;

  function getProducts() {
    return window.MAYAMAK_DATA.products;
  }

  function productName(p) {
    return getLangProp(p, "name");
  }

  function productDesc(p) {
    return getLangProp(p, "desc");
  }

  function renderGrid(container) {
    var products = getProducts();
    container.innerHTML = products.map(function (p, i) {
      return (
        '<article class="product-showcase-card' + (i === current ? " active" : "") + '" data-index="' + i + '" tabindex="0">' +
          MayamakImages.buildImg(p.image, productName(p), { priority: i === 0, eager: true, sizes: "showcase" }) +
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
