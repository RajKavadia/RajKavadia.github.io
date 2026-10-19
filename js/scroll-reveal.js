/**
 * Scroll-to-reveal effect.
 * Elements with [data-reveal] start hidden only when <html> has .reveal-enabled
 * (set inline in <head> when IntersectionObserver is available and the user
 * has not requested reduced motion), then fade/slide in as they enter the viewport.
 */
(function () {
  function initScrollReveal() {
    var root = document.documentElement;

    // Tag dynamically rendered cards (projects, packages, experience, skills)
    // with a reveal variant and a small stagger so groups cascade in.
    function tagGroup(selector, variant, staggerStep) {
      document.querySelectorAll(selector).forEach(function (el, idx) {
        if (!el.hasAttribute("data-reveal")) {
          el.setAttribute("data-reveal", variant);
        }
        if (!el.style.getPropertyValue("--reveal-delay")) {
          el.style.setProperty("--reveal-delay", (idx % 3) * staggerStep + "ms");
        }
      });
    }

    tagGroup("#projects-list > div", "up", 90);
    tagGroup("#packages-list .pkg-card", "up", 90);
    tagGroup("#experience-list .timeline-item", "left", 70);
    tagGroup("#skills .lg\\:col-span-8 > div", "up", 60);

    var targets = document.querySelectorAll("[data-reveal]");

    // No IntersectionObserver support: show everything immediately.
    if (!("IntersectionObserver" in window) || !root.classList.contains("reveal-enabled")) {
      targets.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px"
      }
    );

    targets.forEach(function (el) {
      var delay = el.getAttribute("data-reveal-delay");
      if (delay && !el.style.getPropertyValue("--reveal-delay")) {
        el.style.setProperty("--reveal-delay", delay + "ms");
      }
      observer.observe(el);
    });

    // Fallback viewport check: guarantees in-view elements reveal even if
    // IntersectionObserver callbacks are delayed (e.g. throttled tabs).
    var pending = Array.prototype.slice.call(targets);
    function revealInViewport() {
      pending = pending.filter(function (el) {
        if (el.classList.contains("is-revealed")) return false;
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
          el.classList.add("is-revealed");
          observer.unobserve(el);
          return false;
        }
        return true;
      });
      if (pending.length === 0) {
        window.removeEventListener("scroll", onScrollOrResize);
        window.removeEventListener("resize", onScrollOrResize);
      }
    }
    var ticking = false;
    function onScrollOrResize() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () {
          ticking = false;
          revealInViewport();
        });
      }
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.requestAnimationFrame(revealInViewport);
    setTimeout(revealInViewport, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollReveal);
  } else {
    initScrollReveal();
  }
})();
