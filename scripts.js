/* =========================================================
   JC Layosa — Shared Website Interactions
   No external libraries or API connections required.
   ========================================================= */

(() => {
  "use strict";

  /* MOBILE NAVIGATION */

  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");

  if (menu && nav) {
    menu.hidden = false;
    document.body.classList.add("nav-enhanced");

    const closeMenu = (restoreFocus = false) => {
      nav.classList.remove("is-open");
      menu.setAttribute("aria-expanded", "false");

      if (restoreFocus) {
        menu.focus();
      }
    };

    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";

      menu.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !nav.contains(event.target) &&
        !menu.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        nav.classList.contains("is-open")
      ) {
        closeMenu(true);
      }
    });

    document
      .querySelector(".site-header")
      .addEventListener("focusout", (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          closeMenu();
        }
      });

    window
      .matchMedia("(min-width: 721px)")
      .addEventListener("change", () => closeMenu());
  }

  /* SCROLL REVEALS */

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08
      }
    );

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("reveal-ready");
      observer.observe(element);
    });
  }

  /* PROJECT AND CERTIFICATE FILTERS */

  document.querySelectorAll(".filter-toolbar").forEach((toolbar) => {
    const archive = toolbar.parentElement;
    const items = [...archive.querySelectorAll("[data-category]")];
    const controls = toolbar.querySelector(".filter-buttons");
    const count = toolbar.querySelector(".result-count");
    const empty = archive.querySelector(".empty-state");

    if (!controls) {
      return;
    }

    controls.hidden = false;

    controls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");

      if (!button) {
        return;
      }

      controls.querySelectorAll("button").forEach((control) => {
        control.setAttribute(
          "aria-pressed",
          String(control === button)
        );
      });

      let visible = 0;

      items.forEach((item) => {
        const categories = item.dataset.category.split(" ");

        const matches =
          button.dataset.filter === "all" ||
          categories.includes(button.dataset.filter);

        item.hidden = !matches;

        if (matches) {
          visible++;
          item.classList.add("is-visible");
        }
      });

      const noun = archive.classList.contains("credential-archive")
        ? "credential"
        : "project";

      count.textContent =
        `${visible} ${noun}${visible === 1 ? "" : "s"}`;

      if (empty) {
        empty.hidden = visible !== 0;
      }
    });
  });

  /* DOMINOTES SLIDESHOW */

  const screenshots = Array.from({ length: 5 }, (_, index) => ({
    src: `DomiNotes${index + 1}.jpg`,
    title: `DomiNotes — Screenshot ${index + 1}`,
    alt: `DomiNotes screenshot ${index + 1} of 5`
  }));

  let slideIndex = 0;

  const slide = document.querySelector("#project-slide");
  const slideLink = document.querySelector("[data-carousel-preview]");

  if (slide && slideLink) {
    document.querySelector(".carousel-controls").hidden = false;

    document.querySelectorAll("[data-slide]").forEach((button) => {
      button.addEventListener("click", () => {
        slideIndex =
          (
            slideIndex +
            Number(button.dataset.slide) +
            screenshots.length
          ) % screenshots.length;

        slide.src = screenshots[slideIndex].src;
        slide.alt = screenshots[slideIndex].alt;
        slideLink.href = screenshots[slideIndex].src;

        document.querySelector("#slide-count").textContent =
          `0${slideIndex + 1} / 05`;
      });
    });
  }

  /* IMAGE PREVIEW DIALOG */

  const dialog = document.querySelector(".lightbox");

  // Normal image links remain usable in browsers without dialog support.
  if (!dialog || typeof dialog.showModal !== "function") {
    return;
  }

  const preview = dialog.querySelector(".preview-image");
  const title = dialog.querySelector("#preview-title");
  const original = dialog.querySelector(".preview-original");
  const counter = dialog.querySelector(".preview-count");

  let gallery = [];
  let current = 0;
  let opener = null;

  const renderPreview = () => {
    const item = gallery[current];

    preview.src = item.src;
    preview.alt = item.alt;
    title.textContent = item.title;
    original.href = item.src;

    counter.textContent = `${current + 1} / ${gallery.length}`;

    dialog.querySelector(".preview-prev").hidden =
      gallery.length < 2;

    dialog.querySelector(".preview-next").hidden =
      gallery.length < 2;
  };

  const openPreview = (items, index, trigger) => {
    gallery = items;
    current = index;
    opener = trigger;

    renderPreview();
    dialog.showModal();

    document.body.classList.add("modal-open");
  };

  const movePreview = (step) => {
    current =
      (current + step + gallery.length) % gallery.length;

    renderPreview();
  };

  document.querySelectorAll("[data-preview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      // Preserve opening links in a new tab with modifier keys.
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      const peers = [
        ...document.querySelectorAll("[data-preview]")
      ].filter((peer) => {
        return (
          peer.dataset.gallery === link.dataset.gallery &&
          !peer.closest("[hidden]")
        );
      });

      const items = peers.map((peer) => ({
        src: peer.getAttribute("href"),
        title: peer.dataset.title,
        alt: peer.querySelector("img").alt
      }));

      openPreview(items, peers.indexOf(link), link);
    });
  });

  if (slideLink) {
    slideLink.addEventListener("click", (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();
      openPreview(screenshots, slideIndex, slideLink);
    });
  }

  dialog
    .querySelector(".close-preview")
    .addEventListener("click", () => {
      dialog.close();
    });

  dialog
    .querySelector(".preview-prev")
    .addEventListener("click", () => {
      movePreview(-1);
    });

  dialog
    .querySelector(".preview-next")
    .addEventListener("click", () => {
      movePreview(1);
    });

  dialog.addEventListener("keydown", (event) => {
    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight"
    ) {
      event.preventDefault();

      movePreview(event.key === "ArrowLeft" ? -1 : 1);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) {
      return;
    }

    const rect = dialog.getBoundingClientRect();

    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutside) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");

    if (opener && document.contains(opener)) {
      opener.focus();
    }
  });
})();