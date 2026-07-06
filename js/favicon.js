/* Theme-aware favicon – light: dark icon, dark: light icon */
(function () {
  var LIGHT = "/favicon-light.ico";
  var DARK = "/favicon-dark.ico";
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function apply() {
    var href = mq.matches ? DARK : LIGHT;
    var link = document.querySelector('link[rel="icon"][data-favicon-dynamic]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.sizes = "any";
      link.setAttribute("data-favicon-dynamic", "");
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) {
      link.href = href;
    }
  }

  apply();
  if (mq.addEventListener) {
    mq.addEventListener("change", apply);
  } else if (mq.addListener) {
    mq.addListener(apply);
  }
})();
