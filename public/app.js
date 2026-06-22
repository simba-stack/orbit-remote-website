// Orbit Remote — landing page behaviour: theme toggle + footer year.
// Download buttons link directly to the latest GitHub release assets.
(function () {
  "use strict";

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

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
