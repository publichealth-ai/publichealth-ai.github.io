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

const prefetchedPages = new Set();

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
  host.className = "dynamic-flow";
  flow.insertAdjacentElement("afterend", host);
  flow.classList.add("is-enhanced");

  let resizeTimer;

  const render = () => {
    host.querySelector("svg")?.remove();
    const compact = host.clientWidth < 680;
    const width = compact ? 360 : 1000;
    const height = compact ? 660 : 178;
    const nodeWidth = compact ? 320 : 172;
    const nodeHeight = compact ? 104 : 116;
    const markerId = `flow-arrow-${chartIndex}`;
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

    const marker = svg
      .append("defs")
      .append("marker")
      .attr("id", markerId)
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse");

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
      .attr("marker-end", `url(#${markerId})`)
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
      .attr("aria-label", (item) => `${item.step}. ${item.title}. ${item.detail}`);

    nodes
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 10);

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
