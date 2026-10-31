/* =========================================================
   JC Layosa — Shared Website Interactions
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

  /* PROJECT IMAGE CAROUSELS */

  const projectCarousels = new Map();
  const projectGalleries = new Map();

  document.querySelectorAll(".project-case").forEach((project) => {
    const container = project.querySelector(".project-evidence");
    const mainLink = container?.querySelector("[data-preview]");
    const mainImage = mainLink?.querySelector("img");

    if (!container || !mainLink || !mainImage) {
      return;
    }

    const galleryName = mainLink.dataset.gallery;

    // Store the original images before changing the main preview.
    const items = [...project.querySelectorAll("[data-preview]")]
      .filter((link) => {
        return link.dataset.gallery === galleryName;
      })
      .map((link) => ({
        src: link.getAttribute("href"),
        title: link.dataset.title,
        alt: link.querySelector("img").alt
      }));

    if (items.length < 2) {
      return;
    }

    const name = project.querySelector("h2").textContent.trim();
    const caption = container.querySelector("figcaption");

    const state = {
      items,
      index: 0
    };

    projectCarousels.set(mainLink, state);
    projectGalleries.set(galleryName, items);

    container.setAttribute("role", "region");
    container.setAttribute("aria-roledescription", "carousel");
    container.setAttribute("aria-label", `${name} images`);

    const controls = document.createElement("div");

    controls.className = "carousel-controls";
    controls.style.justifyContent = "center";

    const previous = document.createElement("button");

    previous.type = "button";
    previous.textContent = "←";
    previous.setAttribute(
      "aria-label",
      `Previous ${name} image`
    );

    const counter = document.createElement("span");

    counter.setAttribute("aria-live", "polite");
    counter.setAttribute("aria-atomic", "true");

    const next = document.createElement("button");

    next.type = "button";
    next.textContent = "→";
    next.setAttribute(
      "aria-label",
      `Next ${name} image`
    );

    const render = () => {
      const item = items[state.index];

      mainImage.src = item.src;
      mainImage.alt = item.alt;

      mainLink.href = item.src;
      mainLink.dataset.title = item.title;

      if (caption) {
        caption.textContent = item.title;
      }

      counter.textContent =
        `${String(state.index + 1).padStart(2, "0")} / ` +
        String(items.length).padStart(2, "0");
    };

    const move = (step) => {
      state.index =
        (state.index + step + items.length) % items.length;

      render();
    };

    previous.addEventListener("click", () => {
      move(-1);
    });

    next.addEventListener("click", () => {
      move(1);
    });

    controls.append(previous, counter, next);
    container.append(controls);

    render();
  });

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

    const revealTargets = new Set(
      document.querySelectorAll("[data-reveal]")
    );

    if (
      document.querySelector(
        ".project-archive, .credential-archive, .contact-section"
      )
    ) {
      document
        .querySelectorAll(
          [
            ".page-intro",
            ".filter-toolbar",
            ".project-case-heading",
            ".project-description",
            ".project-evidence",
            ".carousel",
            ".screen-details",
            ".project-group-heading",
            ".project-archive + .closing",
            ".certificate-entry",
            ".contact-section > .eyebrow",
            ".contact-section > .contact-row",
            ".contact-note"
          ].join(", ")
        )
        .forEach((element) => {
          revealTargets.add(element);
        });
    }

    revealTargets.forEach((element) => {
      element.classList.add("reveal-ready");
      observer.observe(element);
    });
  }

  /* PROJECT AND CERTIFICATE FILTERS */

  document.querySelectorAll(".filter-toolbar").forEach((toolbar) => {
    const archive = toolbar.parentElement;

    const items = [
      ...archive.querySelectorAll("[data-category]")
    ];

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
    const carousel = slide.closest(".carousel");
    const controls = carousel.querySelector(".carousel-controls");

    controls.hidden = false;

    carousel.querySelectorAll("[data-slide]").forEach((button) => {
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

        carousel.querySelector("#slide-count").textContent =
          `0${slideIndex + 1} / 05`;
      });
    });
  }

  /* IMAGE PREVIEW DIALOG */

  const dialog = document.querySelector(".lightbox");

  // Keep normal image links usable without dialog support.
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
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      event.preventDefault();

      // Open project images using their original gallery order.
      const projectItems = projectGalleries.get(
        link.dataset.gallery
      );

      if (projectItems) {
        const state = projectCarousels.get(link);

        const index = state
          ? state.index
          : projectItems.findIndex((item) => {
              return item.src === link.getAttribute("href");
            });

        openPreview(projectItems, Math.max(0, index), link);
        return;
      }

      // Certificates and other image galleries.
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