/* ==========================================================================
   script.js — Site-wide JavaScript
   Sections:
   1. Mobile navigation (hamburger) toggle
   2. Dark / light mode with localStorage
   3. Current year in footer
   4. Scroll reveal animations
   5. Contact form validation
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  /* ------------------------------------------------------------------ *
   * 1. MOBILE NAVIGATION TOGGLE
   * Opens/closes the nav-links list on small screens and animates
   * the hamburger icon into an "X".
   * ------------------------------------------------------------------ */
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    hamburger.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("is-open");
      hamburger.classList.toggle("is-active", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
    });

    // Close the mobile menu whenever a nav link is clicked
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        hamburger.classList.remove("is-active");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * 2. DARK / LIGHT MODE TOGGLE
   * Adds/removes the "dark-theme" class on <body> and remembers the
   * user's choice in localStorage so it persists across page loads.
   * ------------------------------------------------------------------ */
  const themeToggleButtons = document.querySelectorAll(".theme-toggle");
  const savedTheme = localStorage.getItem("theme");

  // Apply saved preference as soon as the page loads
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }

  function updateToggleLabels() {
    const isDark = document.body.classList.contains("dark-theme");
    themeToggleButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", isDark);
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }
  updateToggleLabels();

  themeToggleButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme");
      const isDark = document.body.classList.contains("dark-theme");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateToggleLabels();
    });
  });

  /* ------------------------------------------------------------------ *
   * 3. CURRENT YEAR IN FOOTER
   * Fills in every element with [data-current-year] so the copyright
   * line never needs to be updated by hand.
   * ------------------------------------------------------------------ */
  const yearEls = document.querySelectorAll("[data-current-year]");
  const currentYear = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = currentYear;
  });

  /* ------------------------------------------------------------------ *
   * 4. SCROLL REVEAL ANIMATIONS
   * Elements with the "reveal" class fade/slide into view the first
   * time they enter the viewport, using IntersectionObserver.
   * ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: just show everything if IntersectionObserver isn't supported
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------ *
   * 5. CONTACT FORM VALIDATION
   * Simple beginner-friendly validation that checks each field and
   * shows an inline error message instead of relying only on the
   * browser's default validation bubbles.
   * ------------------------------------------------------------------ */
  const contactForm = document.querySelector("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      let isValid = true;

      const fields = [
        { input: contactForm.querySelector("#name"), rule: (v) => v.trim().length > 1, message: "Please enter your name." },
        { input: contactForm.querySelector("#email"), rule: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), message: "Please enter a valid email address." },
        { input: contactForm.querySelector("#subject"), rule: (v) => v.trim().length > 2, message: "Please enter a subject." },
        { input: contactForm.querySelector("#message"), rule: (v) => v.trim().length > 9, message: "Message should be at least 10 characters." },
      ];

      fields.forEach(function (field) {
        if (!field.input) return;
        const errorEl = field.input.parentElement.querySelector(".form-error");
        const valid = field.rule(field.input.value);

        field.input.classList.toggle("input-invalid", !valid);
        if (errorEl) {
          errorEl.textContent = valid ? "" : field.message;
        }
        if (!valid) isValid = false;
      });

      const statusEl = contactForm.querySelector(".form-status");

      if (isValid) {
        if (statusEl) {
          statusEl.textContent = "Thanks! Your message is ready to send — connect this form to an email service to go live.";
          statusEl.classList.remove("form-status-error");
          statusEl.classList.add("form-status-success");
        }
        contactForm.reset();
      } else if (statusEl) {
        statusEl.textContent = "Please fix the highlighted fields and try again.";
        statusEl.classList.remove("form-status-success");
        statusEl.classList.add("form-status-error");
      }
    });
  }
});
