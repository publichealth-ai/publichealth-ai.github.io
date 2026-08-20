document.documentElement.classList.add("js");

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

const filterButtons = document.querySelectorAll("[data-case-filter]");
const caseCards = document.querySelectorAll("[data-case-group]");
const filterCount = document.getElementById("filter-count");

if (filterButtons.length && caseCards.length) {
  const applyFilter = (filter) => {
    let visible = 0;

    caseCards.forEach((card) => {
      const show = filter === "all" || card.dataset.caseGroup === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });

    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.caseFilter === filter));
    });

    if (filterCount) {
      filterCount.textContent = `${visible} ${visible === 1 ? "use case" : "use cases"}`;
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.caseFilter));
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
    step: node.querySelector("span")?.textContent.trim() || String(index + 1),
    title: node.querySelector("strong")?.textContent.trim() || "",
    detail: node.querySelector("p")?.textContent.trim() || ""
  }));

  if (!data.length || !window.d3) return;

  const host = document.createElement("div");
  host.className = "dynamic-flow";
  flow.insertAdjacentElement("afterend", host);
  flow.classList.add("is-enhanced");

  const detail = document.createElement("div");
  detail.className = "dynamic-flow-detail";
  detail.setAttribute("aria-live", "polite");
  host.appendChild(detail);

  let resizeTimer;

  const render = () => {
    host.querySelector("svg")?.remove();
    const compact = host.clientWidth < 680;
    const width = compact ? 360 : 1000;
    const height = compact ? 520 : 150;
    const nodeWidth = compact ? 300 : 156;
    const nodeHeight = compact ? 62 : 66;
    const markerId = `flow-arrow-${chartIndex}`;
    const positions = data.map((item, index) => ({
      ...item,
      x: compact ? 30 : 24 + index * 199,
      y: compact ? 16 + index * 96 : 28
    }));

    const svg = window.d3
      .select(host)
      .insert("svg", ":first-child")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Interactive workflow process map");

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
      .attr("class", "dynamic-flow-node")
      .attr("transform", (item) => `translate(${item.x},${item.y})`)
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (item) => `${item.step}. ${item.title}. ${item.detail}`);

    nodes
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 8);

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
      .attr("y", 46)
      .text((item) => item.title);

    const activate = (item) => {
      nodes.classed("is-active", (candidate) => candidate.index === item.index);
      detail.textContent = `${item.step}. ${item.title} — ${item.detail}`;
    };

    nodes
      .on("click", (event, item) => activate(item))
      .on("mouseenter", (event, item) => activate(item))
      .on("keydown", (event, item) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        activate(item);
      });

    activate(positions[0]);
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
