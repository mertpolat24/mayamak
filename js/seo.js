/* Mayamak – JSON-LD structured data */
window.MayamakSEO = (function () {
  var SITE = "https://www.mayamak.com";

  var PAGE_PATHS = {
    home: "",
    about: "hakkimizda.html",
    products: "urunler.html",
    machines: "makine-parki.html",
    occupancy: "makine-doluluk.html",
    references: "referanslar.html",
    certificates: "sertifikalar.html",
    contact: "iletisim.html",
    companies: "sirketlerimiz.html"
  };

  var BREADCRUMB_KEYS = {
    about: "nav.about",
    products: "nav.products",
    machines: "nav.machines",
    occupancy: "nav.occupancy",
    references: "nav.references",
    certificates: "nav.certificates",
    companies: "nav.companies",
    contact: "nav.contact"
  };

  var FAQ_KEYS = [
    { q: "faq.q1", a: "faq.a1" },
    { q: "faq.q2", a: "faq.a2" },
    { q: "faq.q3", a: "faq.a3" },
    { q: "faq.q4", a: "faq.a4" }
  ];

  function inject(id, data) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function organizationSchema() {
    var c = window.MAYAMAK_DATA.contact;
    return {
      "@context": "https://schema.org",
      "@type": "ManufacturingBusiness",
      name: "Mayamak",
      url: SITE + "/",
      logo: SITE + "/images/logo/logo.png",
      image: SITE + "/images/logo/logo.png",
      telephone: c.phoneDisplay,
      email: c.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "KOBİ OSB 21 CADDE NO46",
        addressLocality: "Dilovası",
        addressRegion: "Kocaeli",
        postalCode: "41455",
        addressCountry: "TR"
      },
      sameAs: [c.social.facebook, c.social.instagram, c.social.linkedin].filter(Boolean),
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "18:00"
      }
    };
  }

  function breadcrumbSchema(page) {
    var key = BREADCRUMB_KEYS[page];
    if (!key) return null;
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: MayamakI18n.t("nav.home"),
          item: SITE + "/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: MayamakI18n.t(key),
          item: SITE + "/" + PAGE_PATHS[page]
        }
      ]
    };
  }

  function faqSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_KEYS.map(function (item) {
        return {
          "@type": "Question",
          name: MayamakI18n.t(item.q),
          acceptedAnswer: {
            "@type": "Answer",
            text: MayamakI18n.t(item.a)
          }
        };
      })
    };
  }

  function render() {
    inject("schema-organization", organizationSchema());

    var page = document.body.getAttribute("data-page");
    var breadcrumb = breadcrumbSchema(page);
    if (breadcrumb) inject("schema-breadcrumb", breadcrumb);

    if (page === "contact") inject("schema-faq", faqSchema());
  }

  var bound = false;

  function init() {
    render();
    if (!bound) {
      document.addEventListener("mayamak:langchange", render);
      bound = true;
    }
  }

  return { init: init };
})();
