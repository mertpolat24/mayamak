/* Responsive WebP image helpers */
window.MayamakImages = (function () {
  var manifest = window.MAYAMAK_IMAGE_MANIFEST || {};

  function toWebp(src) {
    if (!src) return src;
    if (/\.webp$/i.test(src)) return src;
    var entry = manifest[src];
    if (entry && entry.webp) return entry.webp;
    return src.replace(/\.(png|jpe?g|avif)$/i, ".webp");
  }

  function mobileWebp(src) {
    var entry = manifest[src];
    if (entry && entry.mobileWebp) return entry.mobileWebp;
    return toWebp(src);
  }

  function dims(src) {
    var entry = manifest[src] || manifest[toWebp(src)];
    if (!entry) return { width: "", height: "" };
    return { width: entry.width, height: entry.height };
  }

  function buildImg(src, alt, options) {
    options = options || {};
    var webp = toWebp(src);
    var mobile = mobileWebp(src);
    var size = dims(src);
    var width = options.width || size.width;
    var height = options.height || size.height;
    var attrs = 'alt="' + alt + '" decoding="async"';
    if (width) attrs += ' width="' + width + '"';
    if (height) attrs += ' height="' + height + '"';
    if (options.priority) {
      attrs += ' fetchpriority="high" loading="eager"';
    } else {
      attrs += ' loading="lazy"';
    }
    if (options.className) attrs += ' class="' + options.className + '"';

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
    mobileWebp: mobileWebp,
    buildImg: buildImg,
    dims: dims
  };
})();
