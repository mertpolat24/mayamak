/* Responsive WebP – srcset/sizes; desktop quality preserved via full webp in srcset */
window.MayamakImages = (function () {
  var manifest = window.MAYAMAK_IMAGE_MANIFEST || {};
  var WIDTHS = [480, 768, 1200];

  var SIZES = {
    hero: "(max-width: 768px) 100vw, 100vw",
    product: "(max-width: 768px) 92vw, 420px",
    reference: "(max-width: 768px) 33vw, 190px",
    machine: "(max-width: 768px) 92vw, 400px",
    cert: "(max-width: 768px) 45vw, 360px",
    program: "(max-width: 768px) 22vw, 96px",
    company: "(max-width: 768px) 40vw, 200px",
    default: "(max-width: 768px) 92vw, 420px"
  };

  function toWebp(src) {
    if (!src) return src;
    if (/\.webp$/i.test(src)) return src;
    var entry = manifest[src];
    if (entry && entry.webp) return entry.webp;
    return src.replace(/\.(png|jpe?g|avif)$/i, ".webp");
  }

  function entryFor(src) {
    var webp = toWebp(src);
    return manifest[webp] || manifest[src] || null;
  }

  function mobileWebp(src) {
    var entry = entryFor(src);
    if (entry && entry.srcset && entry.srcset["480"]) return entry.srcset["480"];
    if (entry && entry.mobileWebp) return entry.mobileWebp;
    return toWebp(src);
  }

  function dims(src) {
    var entry = entryFor(src);
    if (!entry) return { width: "", height: "" };
    return { width: entry.width, height: entry.height };
  }

  function displayDims(entry, options) {
    if (options.width && options.height) {
      return { width: options.width, height: options.height };
    }
    var tw = options.sizes === "hero" ? 1200 : 768;
    if (!entry || !entry.width || !entry.height) {
      return { width: tw, height: "" };
    }
    return {
      width: tw,
      height: Math.max(1, Math.round((entry.height / entry.width) * tw))
    };
  }

  function buildSrcset(entry) {
    if (!entry || !entry.srcset) return "";
    var parts = WIDTHS.map(function (w) {
      var path = entry.srcset[String(w)];
      if (!path) return null;
      return encodeURI(path) + " " + w + "w";
    }).filter(Boolean);
    if (entry.webp && entry.width > 1200) {
      parts.push(encodeURI(entry.webp) + " " + entry.width + "w");
    }
    return parts.join(", ");
  }

  function defaultSrc(entry, options) {
    if (!entry || !entry.srcset) return entry ? entry.webp : toWebp("");
    if (options.sizes === "hero") {
      return entry.srcset["768"] || entry.srcset["480"] || entry.webp;
    }
    return entry.srcset["768"] || entry.srcset["480"] || entry.webp;
  }

  function buildImg(src, alt, options) {
    options = options || {};
    var entry = entryFor(src);
    var webp = entry ? entry.webp : toWebp(src);
    var srcset = entry ? buildSrcset(entry) : "";
    var sizesKey = options.sizes || "default";
    var sizes = SIZES[sizesKey] || sizesKey;
    var scaled = displayDims(entry, options);
    var width = options.width || scaled.width;
    var height = options.height || scaled.height;

    var attrs = 'alt="' + alt + '" decoding="async"';
    if (width) attrs += ' width="' + width + '"';
    if (height) attrs += ' height="' + height + '"';
    if (options.priority) {
      attrs += ' fetchpriority="high" loading="eager"';
    } else {
      attrs += ' loading="lazy"';
    }
    if (options.className) attrs += ' class="' + options.className + '"';

    if (srcset) {
      var imgSrc = defaultSrc(entry, options);
      attrs += ' srcset="' + srcset + '" sizes="' + sizes + '"';
      return '<img src="' + encodeURI(imgSrc) + '" ' + attrs + ">";
    }

    var mobile = mobileWebp(src);
    var html = "<picture>";
    if (mobile !== webp) {
      html += '<source media="(max-width: 768px)" srcset="' + encodeURI(mobile) + '" type="image/webp">';
    }
    html += '<source srcset="' + encodeURI(webp) + '" type="image/webp">';
    html += '<img src="' + encodeURI(webp) + '" ' + attrs + ">";
    html += "</picture>";
    return html;
  }

  return {
    toWebp: toWebp,
    buildImg: buildImg,
    dims: dims,
    SIZES: SIZES
  };
})();
