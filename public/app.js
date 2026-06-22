// Orbit Remote — landing page behaviour: theme toggle + live release data.
(function () {
  "use strict";

  // ---- Theme toggle -------------------------------------------------
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var html = document.documentElement;
      var next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      html.setAttribute("data-theme", next);
      try {
        localStorage.setItem("orbit-theme", next);
      } catch (e) {}
    });
  }

  // ---- Footer year --------------------------------------------------
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---- Release data -------------------------------------------------
  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "";
    var units = ["Б", "КБ", "МБ", "ГБ"];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    i = Math.min(i, units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + units[i];
  }

  function renderPlatform(card, info) {
    var meta = card.querySelector('[data-role="meta"]');
    var button = card.querySelector('[data-role="button"]');
    var note = card.querySelector('[data-role="note"]');

    if (info && info.available) {
      var parts = [];
      if (info.version) parts.push("v" + info.version);
      if (info.size) parts.push(formatBytes(info.size));
      meta.textContent = parts.join(" · ") || "Доступно для скачивания";
      button.setAttribute("aria-disabled", "false");
      button.removeAttribute("aria-disabled");
      note.textContent = info.sha256 ? "SHA‑256: " + info.sha256.slice(0, 16) + "…" : "";
    } else {
      meta.textContent = "Сборка готовится к публикации";
      button.setAttribute("aria-disabled", "true");
      note.textContent = "Файл появится здесь после первой публикации релиза.";
    }
  }

  function loadReleases() {
    fetch("/api/releases", { headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        var cards = document.querySelectorAll(".download-card");
        cards.forEach(function (card) {
          var platform = card.getAttribute("data-platform");
          var info = data.platforms ? data.platforms[platform] : null;
          renderPlatform(card, info);
        });
      })
      .catch(function () {
        document.querySelectorAll(".download-card").forEach(function (card) {
          var meta = card.querySelector('[data-role="meta"]');
          if (meta) meta.textContent = "Не удалось загрузить данные о релизах";
        });
      });
  }

  loadReleases();
})();
