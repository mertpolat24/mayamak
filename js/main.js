/* Mayamak main interactions */
window.MayamakApp = (function () {
  function initHeader() {
    var header = document.getElementById("site-header");
    if (!header) return;

    window.addEventListener("scroll", function () {
      header.classList.toggle("scrolled", window.scrollY > 40);
    });

    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("main-nav");
    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
        toggle.classList.toggle("active");
        document.body.classList.toggle("nav-open");
      });
      nav.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          nav.classList.remove("open");
          toggle.classList.remove("active");
          document.body.classList.remove("nav-open");
        });
      });
    }

    var dropdowns = document.querySelectorAll(".nav-dropdown");
    dropdowns.forEach(function (dd) {
      var trigger = dd.querySelector(".nav-dropdown-trigger");
      if (trigger) {
        trigger.addEventListener("click", function (e) {
          if (window.innerWidth <= 992) {
            e.preventDefault();
            dd.classList.toggle("open");
          }
        });
      }
    });
  }

  function initScrollReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) { observer.observe(el); });
  }

  function initContactLinks() {
    var c = window.MAYAMAK_DATA.contact;
    if (!c) return;

    document.querySelectorAll("[data-contact=\"whatsapp\"]").forEach(function (el) {
      el.href = c.whatsapp;
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      if (el.hasAttribute("data-contact-text")) {
        el.textContent = c.phoneDisplay;
      }
    });

    document.querySelectorAll("[data-contact=\"email\"]").forEach(function (el) {
      el.href = "mailto:" + c.email;
      if (el.hasAttribute("data-contact-text")) {
        el.textContent = c.email;
      }
    });

    document.querySelectorAll("[data-contact=\"map\"]").forEach(function (el) {
      el.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.mapQuery);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });

    var mapFrame = document.getElementById("contact-map-frame");
    if (mapFrame) {
      mapFrame.src = "https://maps.google.com/maps?q=" + encodeURIComponent(c.mapQuery) + "&z=16&output=embed";
    }

    var socialEl = document.getElementById("top-bar-social");
    if (socialEl && c.social) {
      socialEl.innerHTML =
        '<a href="' + c.social.facebook + '" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Facebook">' +
          '<svg viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg></a>' +
        '<a href="' + c.social.instagram + '" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">' +
          '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>' +
        '<a href="' + c.social.linkedin + '" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">' +
          '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.062 2.062 0 012.063-2.063 2.063 2.063 0 012.063 2.063 2.062 2.062 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>';
    }
  }

  function initHeroSlider() {
    /* replaced by MayamakHero on homepage */
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute("data-count"), 10);
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 2000;
          var start = 0;
          var startTime = null;

          function step(ts) {
            if (!startTime) startTime = ts;
            var p = Math.min((ts - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (target - start) * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (c) { observer.observe(c); });
  }

  function renderProducts(container, limit) {
    if (!container) return;
    var lang = MayamakI18n.getLang();
    var products = window.MAYAMAK_DATA.products;
    if (limit) products = products.slice(0, limit);

    container.innerHTML = products.map(function (p, i) {
      var name = lang === "en" ? p.nameEn : p.nameTr;
      var desc = lang === "en" ? p.descEn : p.descTr;
      return (
        '<article class="product-page-card reveal">' +
          '<img src="' + p.image + '" alt="' + name + '" loading="lazy">' +
          '<div class="product-page-shade"></div>' +
          '<div class="product-page-caption">' +
            '<h3>' + name + '</h3>' +
            '<p>' + desc + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    initScrollReveal();
  }

  function renderReferences(container) {
    if (!container) return;
    var refs = window.MAYAMAK_DATA.references;

    container.innerHTML = refs.map(function (r, i) {
      return (
        '<div class="ref-item reveal" style="animation-delay:' + (i * 0.05) + 's">' +
          '<div class="ref-item-img">' +
            '<img src="' + encodeURI(r.image) + '" alt="' + r.name + '" loading="lazy" title="' + r.name + '">' +
          '</div>' +
        '</div>'
      );
    }).join("");

    initScrollReveal();
  }

  function renderMachines(container, filter) {
    if (!container) return;
    var lang = MayamakI18n.getLang();
    var machines = window.MAYAMAK_DATA.machines;
    if (filter && filter !== "all") {
      machines = machines.filter(function (m) { return m.category === filter; });
    }

    container.innerHTML = machines.map(function (m, i) {
      var name = lang === "en" ? m.nameEn : m.nameTr;
      var desc = lang === "en" ? m.descEn : m.descTr;
      var catLabel = window.MAYAMAK_DATA.categoryLabels[m.category];
      var cat = lang === "en" ? catLabel.en : catLabel.tr;

      return (
        '<article class="machine-card reveal" data-category="' + m.category + '" style="animation-delay:' + (i * 0.05) + 's">' +
          '<div class="machine-card-img">' +
            '<img src="' + encodeURI(m.image) + '" alt="' + name + '" loading="lazy">' +
            '<span class="machine-cat-badge">' + cat + '</span>' +
          '</div>' +
          '<div class="machine-card-body">' +
            '<h3>' + name + '</h3>' +
            '<p>' + desc + '</p>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    initScrollReveal();
  }

  function initMachineFilters() {
    var filters = document.getElementById("machine-filters");
    var grid = document.getElementById("machines-grid");
    if (!filters || !grid) return;

    filters.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filters.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      renderMachines(grid, btn.getAttribute("data-filter"));
    });
  }

  function setActiveNav() {
    var page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll(".main-nav a[data-nav]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-nav") === page);
    });
  }

  function init() {
    MayamakI18n.init();
    initContactLinks();
    initHeader();
    initScrollReveal();
    initCounters();
    initMachineFilters();
    setActiveNav();

    if (document.getElementById("product-hero-single") && window.MayamakHero) {
      MayamakHero.init();
    }

    if (document.getElementById("product-showcase") && window.MayamakProductShowcase) {
      MayamakProductShowcase.init();
    }

    var homeRefs = document.getElementById("home-references");
    if (homeRefs) renderReferences(homeRefs);

    var allRefs = document.getElementById("references-grid");
    if (allRefs) renderReferences(allRefs);

    var machinesGrid = document.getElementById("machines-grid");
    if (machinesGrid) renderMachines(machinesGrid, "all");

    var occGrid = document.getElementById("occupancy-grid");
    if (occGrid) MayamakOccupancy.renderOccupancyGrid(occGrid);
  }

  document.addEventListener("mayamak:langchange", function () {
    var homeRefs = document.getElementById("home-references");
    if (homeRefs) renderReferences(homeRefs);
    var allRefs = document.getElementById("references-grid");
    if (allRefs) renderReferences(allRefs);
    var machinesGrid = document.getElementById("machines-grid");
    if (machinesGrid) {
      var active = document.querySelector("#machine-filters .filter-btn.active");
      renderMachines(machinesGrid, active ? active.getAttribute("data-filter") : "all");
    }
  });

  return { init: init, renderProducts: renderProducts, renderMachines: renderMachines };
})();

document.addEventListener("DOMContentLoaded", function () {
  MayamakApp.init();
});
