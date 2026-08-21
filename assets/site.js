document.documentElement.classList.add("js");

const acceleratorLabels = new Map([
  ["Reuse:", "What the template gives you:"],
  ["Adapt:", "What your team adds:"],
  ["Keep outside:", "What stays with people and existing systems:"]
]);

document.querySelectorAll(".accelerator-fit-copy strong").forEach((label) => {
  const replacement = acceleratorLabels.get(label.textContent.trim());
  if (replacement) label.textContent = replacement;
});

document.querySelectorAll(".story-card img").forEach((image) => {
  image.loading = "lazy";
  image.decoding = "async";
});

const canTrackPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

const bindCursorGradient = (control) => {
  if (!canTrackPointer || control.dataset.cursorGradientBound === "true") return;
  control.dataset.cursorGradientBound = "true";
  let pointerFrame;

  const updatePointer = (event) => {
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = window.requestAnimationFrame(() => {
      const bounds = control.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      control.style.setProperty("--pointer-x", `${Math.max(0, Math.min(100, x))}%`);
      control.style.setProperty("--pointer-y", `${Math.max(0, Math.min(100, y))}%`);
    });
  };

  control.addEventListener("pointerenter", updatePointer);
  control.addEventListener("pointermove", updatePointer);
  control.addEventListener("pointerleave", () => {
    control.style.setProperty("--pointer-x", "50%");
    control.style.setProperty("--pointer-y", "50%");
  });
};

const setCursorGradient = (control, enabled) => {
  control.classList.toggle("cursor-gradient", enabled);
  if (enabled) bindCursorGradient(control);
};

document.querySelectorAll(".button, .template-button").forEach((control) => {
  setCursorGradient(control, window.getComputedStyle(control).backgroundImage !== "none");
});

const syncSelectedFilterGradients = () => {
  document.querySelectorAll(".filter-button").forEach((button) => {
    setCursorGradient(button, button.getAttribute("aria-pressed") === "true");
  });
};

syncSelectedFilterGradients();

const prefetchedPages = new Set();

const questionsButtonMarkup = `
  Questions?
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"></path></svg>
`;
const questionsPanelMarkup = `
  <aside class="questions-panel" id="questions-panel" role="dialog" aria-modal="true" aria-labelledby="questions-title" hidden>
    <button class="questions-close" id="questions-close" type="button" aria-label="Close questions panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
    </button>
    <p class="questions-eyebrow">Site update</p>
    <h2 id="questions-title">Publishing in progress</h2>
    <p class="questions-status">We're still working through publishing information on this site. Stay tuned, and reach out if you have questions in the meantime.</p>
    <p class="questions-list-label">You may be wondering:</p>
    <ul class="questions-list">
      <li>Can't find what you're looking for?</li>
      <li>Unsure which use case fits your mission?</li>
      <li>Want to discuss a technical proof of concept?</li>
    </ul>
    <p class="questions-contact-line">Reach out to <strong>Supawit Ket-udom</strong>, Industry Director, Public Health, Microsoft.</p>
    <p class="questions-contact-links">
      <a href="mailto:supaketu@microsoft.com">Email</a>
      <span aria-hidden="true">·</span>
      <a href="https://www.linkedin.com/in/supawitket/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </p>
  </aside>
`;

if (!document.getElementById("questions-trigger") && document.body.classList.contains("detail-page")) {
  const trigger = document.createElement("button");
  trigger.className = "questions-trigger";
  trigger.id = "questions-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "questions-panel");
  trigger.innerHTML = questionsButtonMarkup;
  document.querySelector(".detail-page .site-header .nav-row")?.appendChild(trigger);
}

if (!document.getElementById("questions-panel")) {
  document.body.insertAdjacentHTML("beforeend", questionsPanelMarkup);
}

const questionsTrigger = document.getElementById("questions-trigger");
const questionsPanel = document.getElementById("questions-panel");
const questionsClose = document.getElementById("questions-close");

if (questionsTrigger && questionsPanel && questionsClose) {
  const questionMotionDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 240;
  let closeTimer;
  const setPageInert = (inert) => {
    Array.from(document.body.children)
      .filter((element) => element !== questionsPanel && element.tagName !== "SCRIPT")
      .forEach((element) => {
        element.inert = inert;
      });
  };

  const setQuestionsOpen = (open, restoreFocus = false) => {
    window.clearTimeout(closeTimer);
    questionsTrigger.setAttribute("aria-expanded", String(open));

    if (open) {
      document.body.classList.add("questions-open");
      setPageInert(true);
      questionsPanel.hidden = false;
      window.requestAnimationFrame(() => questionsPanel.classList.add("is-open"));
      questionsClose.focus();
      return;
    }

    questionsPanel.classList.remove("is-open");
    closeTimer = window.setTimeout(() => {
      questionsPanel.hidden = true;
      document.body.classList.remove("questions-open");
      setPageInert(false);
      if (restoreFocus) questionsTrigger.focus();
    }, questionMotionDuration);
  };

  questionsTrigger.addEventListener("click", () => {
    setQuestionsOpen(questionsPanel.hidden || !questionsPanel.classList.contains("is-open"));
  });
  questionsClose.addEventListener("click", () => setQuestionsOpen(false, true));
  document.addEventListener("pointerdown", (event) => {
    if (
      questionsPanel.hidden ||
      questionsPanel.contains(event.target) ||
      questionsTrigger.contains(event.target)
    ) {
      return;
    }
    setQuestionsOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !questionsPanel.hidden) {
      setQuestionsOpen(false, true);
      return;
    }
    if (event.key !== "Tab" || questionsPanel.hidden) return;

    const focusable = Array.from(
      questionsPanel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const questionsNoticeKey = "public-health-ai-publishing-notice-v1";
  let shouldAutoOpen = true;

  try {
    shouldAutoOpen = sessionStorage.getItem(questionsNoticeKey) !== "seen";
    if (shouldAutoOpen) sessionStorage.setItem(questionsNoticeKey, "seen");
  } catch {
    // The notice still opens when session storage is unavailable.
  }

  if (shouldAutoOpen) {
    window.setTimeout(() => setQuestionsOpen(true), questionMotionDuration ? 500 : 0);
  }
}

document.querySelectorAll(".case-card[href]").forEach((card) => {
  card.addEventListener(
    "mouseenter",
    () => {
      const href = card.getAttribute("href");
      if (!href || prefetchedPages.has(href)) return;

      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = href;
      document.head.appendChild(link);
      prefetchedPages.add(href);
    },
    { once: true }
  );
});

if (document.body.classList.contains("detail-page")) {
  const header = document.querySelector(".site-header");
  const topButton = document.createElement("button");
  topButton.className = "page-top-button";
  topButton.type = "button";
  topButton.setAttribute("aria-label", "Back to top");
  topButton.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"></path></svg>';
  document.body.appendChild(topButton);

  let scrollFrame;

  const updateScrollState = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const progress = available > 0 ? Math.min(window.scrollY / available, 1) : 0;
    header?.style.setProperty("--page-progress", String(progress));
    topButton.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.7);
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        updateScrollState();
        scrollFrame = undefined;
      });
    },
    { passive: true }
  );

  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  updateScrollState();
}

const caseContent = document.querySelector(".single-case-content");

if (caseContent) {
  const disclosureSections = [
    {
      selector: ".accelerator-stage",
      label: "01",
      title: "Where the accelerator fits"
    },
    {
      selector: ".outcome-section",
      label: "02",
      title: "Outcomes and approach"
    },
    {
      selector: ".workflow-application",
      label: "03",
      title: "How this applies across the workflow"
    },
    {
      selector: ".reflection-panel",
      label: "04",
      title: "Reflection questions"
    }
  ];
  const disclosureList = document.createElement("div");
  disclosureList.className = "case-disclosures";
  const firstDisclosureSection = caseContent.querySelector(".accelerator-stage");
  firstDisclosureSection?.insertAdjacentElement("beforebegin", disclosureList);

  disclosureSections.forEach(({ selector, label, title }, index) => {
    const section = caseContent.querySelector(selector);
    if (!section) return;

    const details = document.createElement("details");
    details.className = "case-disclosure reveal";
    details.style.setProperty("--reveal-delay", `${index * 70}ms`);
    const summary = document.createElement("summary");
    summary.className = "case-disclosure-summary";
    summary.innerHTML = `
      <span class="case-disclosure-label">${label}</span>
      <strong>${title}</strong>
      <span class="case-disclosure-toggle" aria-hidden="true"></span>
    `;

    details.append(summary, section);
    disclosureList.appendChild(details);

    details.addEventListener("toggle", () => {
      if (!details.open) return;
      disclosureList.querySelectorAll(".case-disclosure[open]").forEach((item) => {
        if (item !== details) item.open = false;
      });
    });
  });

  [
    document.querySelector(".single-case-header > div"),
    ...caseContent.querySelectorAll(".brief-row > .brief-block")
  ]
    .filter(Boolean)
    .forEach((item, index) => {
      item.classList.add("reveal");
      item.style.setProperty("--reveal-delay", `${index * 90}ms`);
    });
}

const menu = document.getElementById("site-menu");
const openMenu = document.getElementById("open-menu");
const closeMenu = document.getElementById("close-menu");

if (menu && openMenu && closeMenu) {
  openMenu.addEventListener("click", () => {
    menu.showModal();
    document.body.classList.add("menu-open");
  });

  closeMenu.addEventListener("click", () => menu.close());

  menu.addEventListener("close", () => {
    document.body.classList.remove("menu-open");
    openMenu.focus();
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => menu.close());
  });
}

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, activeObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        activeObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const businessFilterButtons = document.querySelectorAll("[data-case-filter]");
const technologyFilterButtons = document.querySelectorAll("[data-technology-filter]");
const caseCards = document.querySelectorAll("[data-case-group]");
const filterCount = document.getElementById("filter-count");
const filterEmptyState = document.getElementById("filter-empty-state");
const caseGrid = document.querySelector(".case-grid");
let selectedBusinessFilter = "all";
let selectedTechnologyFilter = "all";

if (caseGrid && caseCards.length) {
  Array.from(caseCards)
    .sort((left, right) => {
      const leftTitle = left.querySelector("h3")?.textContent.trim() || "";
      const rightTitle = right.querySelector("h3")?.textContent.trim() || "";
      return leftTitle.localeCompare(rightTitle, undefined, { sensitivity: "base" });
    })
    .forEach((card) => caseGrid.appendChild(card));
}

const storyGrid = document.querySelector(".story-grid");

if (storyGrid) {
  Array.from(storyGrid.querySelectorAll(".story-card"))
    .sort((left, right) => {
      const leftOrganization = left.querySelector(".story-org")?.textContent.trim() || "";
      const rightOrganization = right.querySelector(".story-org")?.textContent.trim() || "";
      return leftOrganization.localeCompare(rightOrganization, undefined, { sensitivity: "base" });
    })
    .forEach((card) => storyGrid.appendChild(card));
}

[".case-grid .case-card", ".story-grid .story-card"].forEach((selector) => {
  document.querySelectorAll(selector).forEach((card, index) => {
    card.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });
});

if (caseCards.length) {
  const applyFilters = () => {
    let visible = 0;

    caseCards.forEach((card) => {
      const groups = card.dataset.caseGroup.split(/\s+/);
      const technologies = card.dataset.technology.split(/\s+/);
      const matchesBusiness =
        selectedBusinessFilter === "all" || groups.includes(selectedBusinessFilter);
      const matchesTechnology =
        selectedTechnologyFilter === "all" || technologies.includes(selectedTechnologyFilter);
      const show = matchesBusiness && matchesTechnology;
      card.hidden = !show;
      if (show) visible += 1;
    });

    businessFilterButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.caseFilter === selectedBusinessFilter)
      );
    });

    technologyFilterButtons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.technologyFilter === selectedTechnologyFilter)
      );
    });

    if (filterCount) {
      filterCount.textContent = `${visible} ${visible === 1 ? "use case" : "use cases"}`;
    }

    if (filterEmptyState) {
      filterEmptyState.hidden = visible !== 0;
    }

    syncSelectedFilterGradients();
  };

  businessFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedBusinessFilter = button.dataset.caseFilter;
      applyFilters();
    });
  });

  technologyFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedTechnologyFilter = button.dataset.technologyFilter;
      applyFilters();
    });
  });
}

document.querySelectorAll(".friendly-flow").forEach((flow) => {
  const nodes = Array.from(flow.querySelectorAll(".flow-node"));

  const activate = (selected) => {
    nodes.forEach((node) => {
      const active = node === selected;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-expanded", String(active));
    });
  };

  nodes.forEach((node) => {
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    node.setAttribute("aria-expanded", "false");
    node.addEventListener("click", () => activate(node));
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activate(node);
    });
  });

  if (nodes[0]) activate(nodes[0]);
});

const flowCharts = Array.from(document.querySelectorAll(".friendly-flow"));

const loadD3 = () => {
  if (window.d3) return Promise.resolve(window.d3);

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js";
    script.onload = () => resolve(window.d3);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const enhanceFlow = (flow, chartIndex) => {
  const data = Array.from(flow.querySelectorAll(".flow-node")).map((node, index) => ({
    index,
    step: node.querySelector("span")?.textContent.trim() || "",
    title: node.querySelector("strong")?.textContent.trim() || "",
    detail: node.querySelector("p")?.textContent.trim() || "",
    accelerator: node.dataset.accelerator === "true"
  }));

  if (!data.length || !window.d3) return;

  const host = document.createElement("div");
  host.className = "dynamic-flow dynamic-flow-enter";
  flow.insertAdjacentElement("afterend", host);
  flow.classList.add("is-enhanced");

  let resizeTimer;
  let lastCompact;

  const render = () => {
    const compact = host.clientWidth < 680;
    if (host.querySelector("svg") && compact === lastCompact) return;
    lastCompact = compact;
    host.querySelector("svg")?.remove();
    const width = compact ? 360 : 1000;
    const height = compact ? 660 : 178;
    const nodeWidth = compact ? 320 : 172;
    const nodeHeight = compact ? 104 : 116;
    const markerId = `flow-arrow-${chartIndex}`;
    const flowGradientId = `flow-gradient-${chartIndex}`;
    const acceleratorGradientId = `accelerator-gradient-${chartIndex}`;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const positions = data.map((item, index) => ({
      ...item,
      x: compact ? 20 : 10 + index * 202,
      y: compact ? 12 + index * 132 : 28
    }));

    const svg = window.d3
      .select(host)
      .insert("svg", ":first-child")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr(
        "aria-label",
        flow.getAttribute("aria-label") || "Business scenario sequence with accelerator fit"
      );

    const defs = svg.append("defs");
    const marker = defs
      .append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse");

    const flowGradient = defs
      .append("linearGradient")
      .attr("id", flowGradientId)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("spreadMethod", "repeat");

    if (compact) {
      flowGradient.attr("x1", 0).attr("x2", 0).attr("y1", -height / 2).attr("y2", 0);
    } else {
      flowGradient.attr("x1", -width / 2).attr("x2", 0).attr("y1", 0).attr("y2", 0);
    }

    [
      ["0%", "#071f3b"],
      ["48%", "#1877f2"],
      ["100%", "#071f3b"]
    ].forEach(([offset, color]) => {
      flowGradient.append("stop").attr("offset", offset).attr("stop-color", color);
    });

    if (!reduceMotion) {
      const firstAxis = compact ? "y1" : "x1";
      const secondAxis = compact ? "y2" : "x2";
      const distance = compact ? height / 2 : width / 2;
      flowGradient
        .append("animate")
        .attr("attributeName", firstAxis)
        .attr("values", `${-distance};0`)
        .attr("dur", "3.2s")
        .attr("repeatCount", "indefinite");
      flowGradient
        .append("animate")
        .attr("attributeName", secondAxis)
        .attr("values", `0;${distance}`)
        .attr("dur", "3.2s")
        .attr("repeatCount", "indefinite");
    }

    const acceleratorGradient = defs
      .append("linearGradient")
      .attr("id", acceleratorGradientId)
      .attr("x1", "-100%")
      .attr("x2", "0%")
      .attr("y1", "0%")
      .attr("y2", "0%")
      .attr("spreadMethod", "repeat");

    [
      ["0%", "#fff4c2"],
      ["25%", "#ffe99a"],
      ["50%", "#ffd54f"],
      ["75%", "#ffe99a"],
      ["100%", "#fff4c2"]
    ].forEach(([offset, color]) => {
      acceleratorGradient.append("stop").attr("offset", offset).attr("stop-color", color);
    });

    if (!reduceMotion) {
      acceleratorGradient
        .append("animate")
        .attr("attributeName", "x1")
        .attr("values", "-100%;0%")
        .attr("dur", "4.8s")
        .attr("calcMode", "linear")
        .attr("repeatCount", "indefinite");
      acceleratorGradient
        .append("animate")
        .attr("attributeName", "x2")
        .attr("values", "0%;100%")
        .attr("dur", "4.8s")
        .attr("calcMode", "linear")
        .attr("repeatCount", "indefinite");
    }

    marker
      .append("path")
      .attr("class", "dynamic-flow-marker")
      .attr("d", "M 0 0 L 10 5 L 0 10 z");

    const links = positions.slice(0, -1).map((source, index) => ({
      source,
      target: positions[index + 1]
    }));

    svg
      .append("g")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("class", "dynamic-flow-link")
      .style("--flow-index", (_, index) => index)
      .attr("marker-end", `url(#${markerId})`)
      .style("stroke", `url(#${flowGradientId})`)
      .attr("d", ({ source, target }) =>
        compact
          ? `M ${source.x + nodeWidth / 2} ${source.y + nodeHeight} L ${target.x + nodeWidth / 2} ${target.y - 6}`
          : `M ${source.x + nodeWidth} ${source.y + nodeHeight / 2} L ${target.x - 8} ${target.y + nodeHeight / 2}`
      );

    const nodes = svg
      .append("g")
      .selectAll("g")
      .data(positions)
      .join("g")
      .attr("class", (item) => `dynamic-flow-node${item.accelerator ? " is-accelerator" : ""}`)
      .attr("transform", (item) => `translate(${item.x},${item.y})`)
      .attr("aria-label", (item) => [item.step, item.title, item.detail].filter(Boolean).join(". "));

    nodes
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 10)
      .style("fill", (item) => (item.accelerator ? `url(#${acceleratorGradientId})` : null));

    nodes
      .append("text")
      .attr("class", "dynamic-flow-step")
      .attr("x", 14)
      .attr("y", 21)
      .text((item) => item.step);

    nodes
      .append("text")
      .attr("class", "dynamic-flow-title")
      .attr("x", 14)
      .attr("y", (item) => (item.step || item.accelerator ? 45 : 27))
      .text((item) => item.title);

    nodes
      .filter((item) => item.accelerator)
      .append("text")
      .attr("class", "dynamic-flow-badge")
      .attr("x", nodeWidth - 12)
      .attr("y", 20)
      .attr("text-anchor", "end")
      .text("Accelerator fit");

    nodes
      .append("foreignObject")
      .attr("x", 14)
      .attr("y", (item) => (item.step || item.accelerator ? 57 : 39))
      .attr("width", nodeWidth - 28)
      .attr("height", (item) => nodeHeight - (item.step || item.accelerator ? 65 : 47))
      .append("xhtml:div")
      .attr("class", "dynamic-flow-copy")
      .text((item) => item.detail);
  };

  render();

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(render, 120);
    }).observe(host);
  }
};

if (flowCharts.length) {
  loadD3()
    .then(() => flowCharts.forEach((flow, index) => enhanceFlow(flow, index)))
    .catch(() => {
      // The accessible HTML flow remains available if the visualization library cannot load.
    });
}
