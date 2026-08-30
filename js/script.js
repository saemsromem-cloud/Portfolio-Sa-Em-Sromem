// =========================================================
// SA EM SROMEM — PORTFOLIO SCRIPT
// =========================================================

(function () {
  "use strict";

  /* ---- theme toggle (cyanotype / paper) ---- */
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  var stored = localStorage.getItem("theme");

  if (stored === "dark") root.classList.add("dark-mode");

  function setPressed() {
    if (!toggle) return;
    var isDark = root.classList.contains("dark-mode");
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  }
  setPressed();

  if (toggle) {
    toggle.addEventListener("click", function () {
      root.classList.toggle("dark-mode");
      localStorage.setItem(
        "theme",
        root.classList.contains("dark-mode") ? "dark" : "light",
      );
      setPressed();
    });
  }

  /* ---- mobile nav ---- */
  var hamburger = document.querySelector(".hamburger");
  var navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("is-open");
      hamburger.classList.toggle("is-open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("is-open");
        hamburger.classList.remove("is-open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- footer year ---- */
  document.querySelectorAll("[data-current-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- contact form: lightweight client-side check ---- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      var required = form.querySelectorAll("[required]");
      var firstInvalid = null;

      required.forEach(function (field) {
        var errorEl = field.parentElement.querySelector(".form-error");
        var isEmail = field.type === "email";
        var value = field.value.trim();
        var valid =
          value.length > 0 && (!isEmail || /^\S+@\S+\.\S+$/.test(value));

        field.classList.toggle("is-invalid", !valid);
        if (errorEl)
          errorEl.textContent = valid
            ? ""
            : isEmail
              ? "Enter a valid email address."
              : "This field is required.";
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
      }
    });
  }
})();
