/* Daily machine occupancy – 60-80%, regenerated at 09:00 */
window.MayamakOccupancy = (function () {
  var STORAGE_PREFIX = "mayamak_occ_";

  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  function getEffectiveDateKey() {
    var now = new Date();
    var d = new Date(now);
    if (now.getHours() < 9) {
      d.setDate(d.getDate() - 1);
    }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function hashString(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function getCncMachines() {
    return window.MAYAMAK_DATA.machines.filter(function (m) {
      return m.category === "cnc";
    });
  }

  function generateRates(machines, dateKey) {
    var rates = {};
    machines.forEach(function (m) {
      var seed = hashString(dateKey + "_" + m.id);
      rates[m.id] = 60 + (seed % 21);
    });
    return rates;
  }

  function getRates() {
    var machines = getCncMachines();
    var dateKey = getEffectiveDateKey();
    var storageKey = STORAGE_PREFIX + dateKey;
    var stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        return { dateKey: dateKey, rates: JSON.parse(stored) };
      } catch (e) { /* fall through */ }
    }

    var rates = generateRates(machines, dateKey);
    localStorage.setItem(storageKey, JSON.stringify(rates));
    return { dateKey: dateKey, rates: rates };
  }

  function getRate(machineId) {
    return getRates().rates[machineId] || 70;
  }

  function getLevelClass(rate) {
    if (rate >= 75) return "occ-high";
    if (rate >= 65) return "occ-medium";
    return "occ-low";
  }

  function animateCounter(el, target, duration) {
    duration = duration || 1800;
    var start = 0;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(start + (target - start) * eased);
      el.textContent = current + "%";
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function animateBar(barEl, target, duration) {
    duration = duration || 1800;
    barEl.style.width = "0%";
    setTimeout(function () {
      barEl.style.width = target + "%";
    }, 100);
  }

  function renderOccupancyGrid(container) {
    if (!container) return;
    var lang = MayamakI18n.getLang();
    var data = getRates();
    var machines = window.MAYAMAK_DATA.machines.filter(function (m) {
      return m.category === "cnc";
    });

    container.innerHTML = "";

    var updateEl = document.getElementById("occ-update-time");
    if (updateEl) {
      var displayDate = data.dateKey.split("-").reverse().join(".");
      updateEl.textContent = displayDate + " 09:00";
    }

    machines.forEach(function (m, idx) {
      var rate = data.rates[m.id] || 70;
      var name = lang === "en" ? m.nameEn : m.nameTr;
      var card = document.createElement("article");
      card.className = "occ-card";
      card.style.animationDelay = (idx * 0.06) + "s";
      card.innerHTML =
        '<div class="occ-card-img">' +
          MayamakImages.buildImg(m.image, name, { sizes: "machine" }) +
          '<div class="occ-card-overlay"></div>' +
        '</div>' +
        '<div class="occ-card-body">' +
          '<h3 class="occ-card-title">' + name + '</h3>' +
          '<div class="occ-bar-wrap">' +
            '<div class="occ-bar-track">' +
              '<div class="occ-bar-fill" data-rate="' + rate + '"></div>' +
            '</div>' +
            '<span class="occ-percent" data-rate="' + rate + '">0%</span>' +
          '</div>' +
          '<p class="occ-available">' +
            MayamakI18n.t("occupancy.available") + ': <strong>' + (100 - rate) + '%</strong>' +
          '</p>' +
        '</div>';

      container.appendChild(card);
    });

    requestAnimationFrame(function () {
      container.querySelectorAll(".occ-bar-fill").forEach(function (bar) {
        animateBar(bar, parseInt(bar.getAttribute("data-rate"), 10));
      });
      container.querySelectorAll(".occ-percent").forEach(function (el) {
        animateCounter(el, parseInt(el.getAttribute("data-rate"), 10));
      });
    });
  }

  return {
    getRates: getRates,
    getRate: getRate,
    getLevelClass: getLevelClass,
    renderOccupancyGrid: renderOccupancyGrid
  };
})();

document.addEventListener("mayamak:langchange", function () {
  var grid = document.getElementById("occupancy-grid");
  if (grid) MayamakOccupancy.renderOccupancyGrid(grid);
});
