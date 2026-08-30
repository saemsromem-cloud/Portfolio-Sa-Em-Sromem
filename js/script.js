/* ==========================================================================
   script.js — Site-wide JavaScript

   Features:
   1. Mobile navigation
   2. Dark / light mode
   3. Current year
   4. Scroll reveal animations
   5. Contact form validation
   6. Accessibility improvements
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ================================================================
     1. MOBILE NAVIGATION
     ================================================================ */

  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  if (hamburger && navLinks) {
    const closeMenu = () => {
      navLinks.classList.remove("is-open");
      hamburger.classList.remove("is-active");
      hamburger.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      navLinks.classList.add("is-open");
      hamburger.classList.add("is-active");
      hamburger.setAttribute("aria-expanded", "true");
    };

    hamburger.addEventListener("click", () => {
      const isOpen = navLinks.classList.contains("is-open");

      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    /* Close when clicking navigation link */

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    /* Close when pressing Escape */

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
        closeMenu();

        hamburger.focus();
      }
    });

    /* Close when clicking outside */

    document.addEventListener("click", (event) => {
      if (
        navLinks.classList.contains("is-open") &&
        !navLinks.contains(event.target) &&
        !hamburger.contains(event.target)
      ) {
        closeMenu();
      }
    });

    /* Close menu when screen becomes desktop */

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });
  }

  /* ================================================================
     2. DARK / LIGHT MODE
     ================================================================ */

  const themeButtons = document.querySelectorAll(".theme-toggle");

  const THEME_KEY = "theme";

  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  };

  const applyTheme = (theme) => {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-theme", isDark);

    themeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(isDark));

      button.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode",
      );
    });
  };

  let currentTheme = getPreferredTheme();

  applyTheme(currentTheme);

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentTheme = document.body.classList.contains("dark-theme")
        ? "light"
        : "dark";

      localStorage.setItem(THEME_KEY, currentTheme);

      applyTheme(currentTheme);
    });
  });

  /* ================================================================
     3. SYSTEM THEME CHANGE
     ================================================================ */

  if (window.matchMedia) {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    systemTheme.addEventListener("change", (event) => {
      const savedTheme = localStorage.getItem(THEME_KEY);

      /*
       Only follow the system automatically
       when the user has not manually selected
       a theme.
      */

      if (!savedTheme) {
        applyTheme(event.matches ? "dark" : "light");
      }
    });
  }

  /* ================================================================
     4. CURRENT YEAR
     ================================================================ */

  const yearElements = document.querySelectorAll("[data-current-year]");

  const currentYear = new Date().getFullYear();

  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });

  /* ================================================================
     5. SCROLL REVEAL
     ================================================================ */

  const revealElements = document.querySelectorAll(".reveal");

  if (revealElements.length) {
    /*
     Respect users who prefer reduced motion.
    */

    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
    } else if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");

              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      revealElements.forEach((element) => {
        revealObserver.observe(element);
      });
    } else {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
    }
  }

  /* ================================================================
     6. CONTACT FORM
     ================================================================ */

  const contactForm = document.querySelector("#contact-form");

  if (contactForm) {
    const nameInput = contactForm.querySelector("#name");

    const emailInput = contactForm.querySelector("#email");

    const subjectInput = contactForm.querySelector("#subject");

    const messageInput = contactForm.querySelector("#message");

    const submitButton = contactForm.querySelector('button[type="submit"]');

    const statusElement = contactForm.querySelector(".form-status");

    /* ------------------------------------------------
       Helper: show field error
       ------------------------------------------------ */

    const showError = (input, message) => {
      if (!input) return;

      input.classList.add("input-invalid");

      input.setAttribute("aria-invalid", "true");

      const errorElement = input.parentElement.querySelector(".form-error");

      if (errorElement) {
        errorElement.textContent = message;

        if (!errorElement.id) {
          errorElement.id = `${input.id}-error`;
        }

        input.setAttribute("aria-describedby", errorElement.id);
      }
    };

    /* ------------------------------------------------
       Helper: clear field error
       ------------------------------------------------ */

    const clearError = (input) => {
      if (!input) return;

      input.classList.remove("input-invalid");

      input.setAttribute("aria-invalid", "false");

      const errorElement = input.parentElement.querySelector(".form-error");

      if (errorElement) {
        errorElement.textContent = "";
      }

      input.removeAttribute("aria-describedby");
    };

    /* ------------------------------------------------
       Helper: validate email
       ------------------------------------------------ */

    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    /* ------------------------------------------------
       Validate name
       ------------------------------------------------ */

    const validateName = () => {
      if (!nameInput) return true;

      const value = nameInput.value.trim();

      if (value.length < 2) {
        showError(nameInput, "Please enter your name.");

        return false;
      }

      clearError(nameInput);

      return true;
    };

    /* ------------------------------------------------
       Validate email
       ------------------------------------------------ */

    const validateEmail = () => {
      if (!emailInput) return true;

      const value = emailInput.value.trim();

      if (!isValidEmail(value)) {
        showError(emailInput, "Please enter a valid email address.");

        return false;
      }

      clearError(emailInput);

      return true;
    };

    /* ------------------------------------------------
       Validate subject
       ------------------------------------------------ */

    const validateSubject = () => {
      if (!subjectInput) return true;

      const value = subjectInput.value.trim();

      if (value.length < 3) {
        showError(subjectInput, "Please enter a subject.");

        return false;
      }

      clearError(subjectInput);

      return true;
    };

    /* ------------------------------------------------
       Validate message
       ------------------------------------------------ */

    const validateMessage = () => {
      if (!messageInput) return true;

      const value = messageInput.value.trim();

      if (value.length < 10) {
        showError(messageInput, "Message should be at least 10 characters.");

        return false;
      }

      clearError(messageInput);

      return true;
    };

    /* ------------------------------------------------
       Validate while typing
       ------------------------------------------------ */

    if (nameInput) {
      nameInput.addEventListener("input", () => {
        if (nameInput.classList.contains("input-invalid")) {
          validateName();
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener("input", () => {
        if (emailInput.classList.contains("input-invalid")) {
          validateEmail();
        }
      });
    }

    if (subjectInput) {
      subjectInput.addEventListener("input", () => {
        if (subjectInput.classList.contains("input-invalid")) {
          validateSubject();
        }
      });
    }

    if (messageInput) {
      messageInput.addEventListener("input", () => {
        if (messageInput.classList.contains("input-invalid")) {
          validateMessage();
        }
      });
    }

    /* =================================================
       FORM SUBMIT
       ================================================= */

    contactForm.addEventListener("submit", (event) => {
      const validName = validateName();

      const validEmail = validateEmail();

      const validSubject = validateSubject();

      const validMessage = validateMessage();

      const isValid = validName && validEmail && validSubject && validMessage;

      /*
       * IMPORTANT:
       *
       * If validation fails,
       * stop the form.
       */

      if (!isValid) {
        event.preventDefault();

        if (statusElement) {
          statusElement.textContent =
            "Please fix the highlighted fields and try again.";

          statusElement.classList.remove("form-status-success");

          statusElement.classList.add("form-status-error");
        }

        return;
      }

      /*
       * IMPORTANT:
       *
       * DO NOT use event.preventDefault()
       * when the form is valid.
       *
       * This allows:
       *
       * HTML
       *   ↓
       * Flask /contact
       *   ↓
       * SQLite
       *
       */

      if (submitButton) {
        submitButton.disabled = true;

        submitButton.setAttribute("aria-disabled", "true");

        const originalText = submitButton.innerHTML;

        submitButton.innerHTML = `
            <i
              class="fa-solid fa-spinner fa-spin"
              aria-hidden="true"
            ></i>
            Sending...
          `;

        /*
         * If Flask fails or browser
         * stays on the page, allow
         * the button again.
         */

        setTimeout(() => {
          submitButton.disabled = false;

          submitButton.removeAttribute("aria-disabled");

          submitButton.innerHTML = originalText;
        }, 10000);
      }
    });
  }
});
