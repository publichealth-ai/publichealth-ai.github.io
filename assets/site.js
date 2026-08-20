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
