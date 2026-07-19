const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const mainNavLinks = document.querySelectorAll(".nav-links a");
const samePageHashLinks = document.querySelectorAll("a[href*='#']");
const imageButtons = document.querySelectorAll(".image-open");
const siteHeader = document.querySelector(".site-header");
const sectionNavLinks = document.querySelectorAll(".section-nav a[href^='#']");
const scrollTopButton = document.createElement("button");
const sectionNavTargets = Array.from(sectionNavLinks)
  .map((link) => {
    const hash = link.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;
    return target ? { hash, link, target } : null;
  })
  .filter(Boolean);

scrollTopButton.className = "scroll-top";
scrollTopButton.type = "button";
scrollTopButton.setAttribute("aria-label", "Scroll to top");
scrollTopButton.innerHTML = '<span aria-hidden="true">↑</span>';
document.body.appendChild(scrollTopButton);

function disableNativeImageDragging(root = document) {
  root.querySelectorAll("img").forEach((image) => {
    image.draggable = false;
    image.addEventListener("dragstart", (event) => event.preventDefault());
  });
}

disableNativeImageDragging();

function tokenizeSelectableText() {
  const textBlocks = document.querySelectorAll(
    ".prose p:not(.eyebrow), .card p, .reference-item p, .contact-panel p, .lead, .muted-note"
  );

  textBlocks.forEach((block) => {
    if (block.classList.contains("selection-tokenized")) return;

    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeValue ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const parts = node.nodeValue.split(/(\s+)/);
      const fragment = document.createDocumentFragment();

      parts.forEach((part) => {
        if (!part) return;
        const token = document.createElement("span");
        token.className = "selection-token";
        token.textContent = part;
        fragment.appendChild(token);
      });

      node.parentNode.replaceChild(fragment, node);
    });

    block.classList.add("selection-tokenized");
  });
}

tokenizeSelectableText();

function updateHeaderOffset() {
  if (!siteHeader) return;
  const offset = Math.ceil(siteHeader.getBoundingClientRect().height + 18);
  document.documentElement.style.setProperty("--header-offset", `${offset}px`);
}

updateHeaderOffset();
window.addEventListener("resize", updateHeaderOffset);
window.addEventListener("orientationchange", updateHeaderOffset);

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(updateHeaderOffset);
}

function normalizePageName(pathname) {
  const segment = pathname.split("/").filter(Boolean).pop() || "index";
  return segment.replace(/\.html$/, "") || "index";
}

function setActivePageNav(activeHash = window.location.hash) {
  const currentPage = normalizePageName(window.location.pathname);
  const hasActiveHashLink = Array.from(mainNavLinks).some((link) => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.href);
    return normalizePageName(linkUrl.pathname) === currentPage && linkUrl.hash && linkUrl.hash === activeHash;
  });

  mainNavLinks.forEach((link) => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.href);
    const linkPage = normalizePageName(linkUrl.pathname);
    const isSamePage = linkPage === currentPage;
    const isActive = isSamePage && (linkUrl.hash ? linkUrl.hash === activeHash : !hasActiveHashLink);

    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

setActivePageNav();

function updateScrollTopButton() {
  scrollTopButton.classList.toggle("is-visible", window.scrollY > 420);
}

scrollTopButton.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: getMotionBehavior(),
  });
});

window.addEventListener("scroll", updateScrollTopButton, { passive: true });
updateScrollTopButton();

function getMotionBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function scrollToSectionContent(target, hash) {
  const anchor = target.querySelector(".section-head, .two-col, .contact-panel") || target;
  const headerHeight = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
  const top = anchor.getBoundingClientRect().top + window.scrollY - headerHeight - 22;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: getMotionBehavior(),
  });

  if (hash) {
    window.history.pushState(null, "", hash);
  }
}

function setActiveSectionNav(activeLink) {
  sectionNavLinks.forEach((link) => {
    const isActive = link === activeLink;

    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function getSectionContentAnchor(section) {
  return section.querySelector(".section-head, .two-col, .contact-panel") || section;
}

function updateActiveSectionNav() {
  if (!sectionNavTargets.length) return;

  const headerHeight = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
  const markerY = Math.max(headerHeight + 96, window.innerHeight * 0.5);
  const pageBottom = window.scrollY + window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  let activeLink = null;

  if (pageBottom >= documentHeight - 80) {
    activeLink = sectionNavTargets[sectionNavTargets.length - 1].link;
  } else {
    sectionNavTargets.forEach(({ link, target }) => {
      const anchor = getSectionContentAnchor(target);
      const anchorRect = anchor.getBoundingClientRect();
      const sectionRect = target.getBoundingClientRect();

      if (anchorRect.top <= markerY && sectionRect.bottom >= headerHeight + 20) {
        activeLink = link;
      }
    });
  }

  setActiveSectionNav(activeLink);
  setActivePageNav(activeLink ? activeLink.getAttribute("href") : null);
}

samePageHashLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const linkUrl = new URL(link.getAttribute("href"), window.location.href);
    const currentPage = normalizePageName(window.location.pathname);
    const linkPage = normalizePageName(linkUrl.pathname);
    const hash = linkUrl.hash;

    if (!hash || linkPage !== currentPage) return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    const sectionLink = Array.from(sectionNavLinks).find((sectionNavLink) => sectionNavLink.getAttribute("href") === hash);
    if (sectionLink) {
      setActiveSectionNav(sectionLink);
    }
    setActivePageNav(hash);
    scrollToSectionContent(target, hash);
    closeMenu();
  });
});

window.addEventListener("scroll", updateActiveSectionNav, { passive: true });
window.addEventListener("resize", updateActiveSectionNav);
window.addEventListener("orientationchange", updateActiveSectionNav);
updateActiveSectionNav();

function closeMenu() {
  if (!menuToggle || !navLinks) return;
  menuToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

if (imageButtons.length) {
  const modal = document.createElement("div");
  modal.className = "image-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Expanded chart image");
  modal.innerHTML = `
    <div class="image-modal-inner">
      <div class="image-modal-head">
        <div class="image-modal-controls" aria-label="Image zoom controls">
          <button class="image-modal-control image-modal-zoom-out" type="button" aria-label="Zoom out">−</button>
          <button class="image-modal-control image-modal-zoom-reset" type="button" aria-label="Reset zoom">100%</button>
          <button class="image-modal-control image-modal-zoom-in" type="button" aria-label="Zoom in">+</button>
        </div>
        <button class="image-modal-close" type="button" aria-label="Close expanded image">×</button>
      </div>
      <div class="image-modal-viewport">
        <img alt="">
      </div>
      <p class="image-modal-caption"></p>
    </div>
  `;
  document.body.appendChild(modal);

  const modalImage = modal.querySelector("img");
  const modalViewport = modal.querySelector(".image-modal-viewport");
  const modalCaption = modal.querySelector(".image-modal-caption");
  const closeButton = modal.querySelector(".image-modal-close");
  const zoomOutButton = modal.querySelector(".image-modal-zoom-out");
  const zoomResetButton = modal.querySelector(".image-modal-zoom-reset");
  const zoomInButton = modal.querySelector(".image-modal-zoom-in");
  disableNativeImageDragging(modal);
  let zoomScale = 1;
  let imageX = 0;
  let imageY = 0;
  let isDraggingImage = false;
  let dragStartX = 0;
  let dragStartY = 0;
  const activeImagePointers = new Map();
  let pinchStartDistance = 0;
  let pinchStartScale = 1;

  function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  function updateImageTransform() {
    modalImage.style.transform = `translate3d(${imageX}px, ${imageY}px, 0) scale(${zoomScale})`;
    modalViewport.classList.toggle("is-zoomed", zoomScale > 1.01);
    zoomResetButton.textContent = `${Math.round(zoomScale * 100)}%`;
  }

  function getPointerDistance() {
    const points = Array.from(activeImagePointers.values());
    if (points.length < 2) return 0;

    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  function setImageZoom(nextZoom) {
    zoomScale = clamp(nextZoom, 1, 3);

    if (zoomScale <= 1.01) {
      zoomScale = 1;
      imageX = 0;
      imageY = 0;
    }

    updateImageTransform();
  }

  function resetImageZoom() {
    zoomScale = 1;
    imageX = 0;
    imageY = 0;
    updateImageTransform();
  }

  function openImage(button) {
    const image = button.querySelector("img");
    resetImageZoom();
    modalImage.src = button.dataset.full;
    modalImage.alt = image ? image.alt : "";
    modalCaption.textContent = button.dataset.caption || "";
    modal.classList.add("is-open");
    document.body.classList.add("menu-open");
    closeButton.focus();
  }

  function closeImage() {
    modal.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    modalImage.removeAttribute("src");
    activeImagePointers.clear();
    isDraggingImage = false;
    pinchStartDistance = 0;
    resetImageZoom();
  }

  imageButtons.forEach((button) => {
    button.addEventListener("click", () => openImage(button));
  });

  closeButton.addEventListener("click", closeImage);
  zoomOutButton.addEventListener("click", () => setImageZoom(zoomScale - 0.25));
  zoomResetButton.addEventListener("click", resetImageZoom);
  zoomInButton.addEventListener("click", () => setImageZoom(zoomScale + 0.25));

  modalViewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      setImageZoom(zoomScale + direction * 0.16);
    },
    { passive: false }
  );

  modalViewport.addEventListener("dblclick", () => {
    setImageZoom(zoomScale > 1.01 ? 1 : 2);
  });

  modalViewport.addEventListener("pointerdown", (event) => {
    activeImagePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (modalViewport.setPointerCapture) {
      modalViewport.setPointerCapture(event.pointerId);
    }

    if (activeImagePointers.size >= 2) {
      isDraggingImage = false;
      modalViewport.classList.remove("is-dragging");
      pinchStartDistance = getPointerDistance();
      pinchStartScale = zoomScale;
      return;
    }

    if (zoomScale <= 1.01) return;

    isDraggingImage = true;
    dragStartX = event.clientX - imageX;
    dragStartY = event.clientY - imageY;
    modalViewport.classList.add("is-dragging");
  });

  modalViewport.addEventListener("pointermove", (event) => {
    if (activeImagePointers.has(event.pointerId)) {
      activeImagePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (activeImagePointers.size >= 2) {
      event.preventDefault();
      const pointerDistance = getPointerDistance();

      if (pinchStartDistance > 0 && pointerDistance > 0) {
        setImageZoom(pinchStartScale * (pointerDistance / pinchStartDistance));
      }

      return;
    }

    if (!isDraggingImage) return;

    imageX = event.clientX - dragStartX;
    imageY = event.clientY - dragStartY;
    updateImageTransform();
  });

  function stopDraggingImage(event) {
    if (event && activeImagePointers.has(event.pointerId)) {
      activeImagePointers.delete(event.pointerId);
    }

    if (activeImagePointers.size < 2) {
      pinchStartDistance = 0;
      pinchStartScale = zoomScale;
    }

    isDraggingImage = false;
    modalViewport.classList.remove("is-dragging");

    if (
      event &&
      modalViewport.hasPointerCapture &&
      modalViewport.hasPointerCapture(event.pointerId)
    ) {
      modalViewport.releasePointerCapture(event.pointerId);
    }
  }

  modalViewport.addEventListener("pointerup", stopDraggingImage);
  modalViewport.addEventListener("pointercancel", stopDraggingImage);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeImage();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeImage();
    }

    if (!modal.classList.contains("is-open")) return;

    if (event.key === "+" || event.key === "=") {
      setImageZoom(zoomScale + 0.25);
    }

    if (event.key === "-" || event.key === "_") {
      setImageZoom(zoomScale - 0.25);
    }

    if (event.key === "0") {
      resetImageZoom();
    }
  });
}
