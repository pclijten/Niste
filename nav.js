/**
 * nav.js — Niste gedeelde navigatie
 *
 * Gebruik in elk HTML-bestand:
 *   1. Voeg toe als eerste element in <body>: <div id="nav-root"></div>
 *   2. Voeg toe voor </body>: <script src="nav.js"></script>
 *
 * Nieuwe pagina toevoegen?
 *   Voeg één object toe aan NAV_ITEMS hieronder — klaar.
 */

const NAV_ITEMS = [
  { label: "Hoe het werkt",  href: "index.html",        id: "hoe"          },
  { label: "Over Niste",     href: "over.html",         id: "over"         },
  { label: "Het matchmodel", href: "lvi_model.html",    id: "lvi"          },
  { label: "Onderbouwing",   href: "onderbouwing.html", id: "onderbouwing" },
  { label: "Privacy",        href: "privacy.html",      id: "privacy"      },
];

const NAV_CTA = {
  label: "Aanmelden",
  href:  "aanmelden.html",
  id:    "aanmelden",
};

function getActivePage() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  return file;
}

function buildNav() {
  const activePage = getActivePage();

  const links = NAV_ITEMS.map(item => {
    const isActive = activePage === item.href ||
                     (activePage === "" && item.href === "index.html");
    return `<a href="${item.href}" class="nav-link${isActive ? " active" : ""}" data-page="${item.id}">${item.label}</a>`;
  }).join("");

  const ctaActive = activePage === NAV_CTA.href;

  return `
    <nav id="niste-nav">
      <a href="index.html" class="nav-logo" aria-label="Niste home">
        niste<span class="logo-dot"></span>
      </a>
      <div class="nav-links" id="nav-desktop-links">
        ${links}
        <a href="${NAV_CTA.href}" class="nav-cta${ctaActive ? " active" : ""}" data-page="${NAV_CTA.id}">${NAV_CTA.label}</a>
      </div>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Menu openen" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="nav-mobile-menu" id="nav-mobile-menu" aria-hidden="true">
      <div class="nav-mobile-links">
        ${NAV_ITEMS.map(item => {
          const isActive = activePage === item.href;
          return `<a href="${item.href}" class="nav-mobile-link${isActive ? " active" : ""}">${item.label}</a>`;
        }).join("")}
        <a href="${NAV_CTA.href}" class="nav-mobile-cta">${NAV_CTA.label}</a>
      </div>
    </div>
  `;
}

function injectNavStyles() {
  if (document.getElementById("niste-nav-styles")) return;
  const css = `
    #niste-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.3rem 3rem;
      border-bottom: 1px solid rgba(42,74,62,.08);
      background: rgba(246,241,233,.97);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #2A4A3E;
      text-decoration: none;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      letter-spacing: -.01em;
    }
    .logo-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #C49A4A; display: inline-block;
      margin-left: 2px;
      animation: nav-pulse 2.2s ease-in-out infinite;
    }
    @keyframes nav-pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.5); opacity: .6; }
    }
    .nav-links {
      display: flex; align-items: center; gap: 2rem;
    }
    .nav-link {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .07em;
      text-transform: uppercase;
      color: #5A5A50;
      text-decoration: none;
      transition: color .2s;
      white-space: nowrap;
    }
    .nav-link:hover  { color: #2A4A3E; }
    .nav-link.active { color: #2A4A3E; }
    .nav-cta {
      background: #2A4A3E; color: #F6F1E9;
      border-radius: 100px; padding: .6rem 1.4rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .75rem; font-weight: 800;
      letter-spacing: .07em; text-transform: uppercase;
      text-decoration: none;
      transition: background .2s, transform .2s;
      box-shadow: 0 4px 14px rgba(42,74,62,.22);
      white-space: nowrap;
    }
    .nav-cta:hover  { background: #3D6B5C; transform: translateY(-1px); }
    .nav-cta.active { background: #3D6B5C; }
    .nav-hamburger {
      display: none; flex-direction: column; gap: 5px;
      background: none; border: none; cursor: pointer; padding: .4rem;
    }
    .nav-hamburger span {
      display: block; width: 22px; height: 2px;
      background: #2A4A3E; border-radius: 2px; transition: all .25s;
    }
    .nav-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .nav-hamburger.open span:nth-child(2) { opacity: 0; }
    .nav-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }
    .nav-mobile-menu {
      display: none; position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(246,241,233,.98);
      z-index: 99; flex-direction: column;
      align-items: center; justify-content: center;
    }
    .nav-mobile-menu.open { display: flex; }
    .nav-mobile-links {
      display: flex; flex-direction: column;
      align-items: center; gap: 1.8rem;
    }
    .nav-mobile-link {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem; font-weight: 400;
      color: #5A5A50; text-decoration: none; transition: color .2s;
    }
    .nav-mobile-link:hover  { color: #2A4A3E; }
    .nav-mobile-link.active { color: #2A4A3E; font-style: italic; }
    .nav-mobile-cta {
      margin-top: 1rem; background: #2A4A3E; color: #F6F1E9;
      border-radius: 100px; padding: .9rem 2.2rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: .85rem; font-weight: 800;
      letter-spacing: .07em; text-transform: uppercase;
      text-decoration: none; transition: background .2s;
      box-shadow: 0 5px 20px rgba(42,74,62,.26);
    }
    .nav-mobile-cta:hover { background: #3D6B5C; }
    @media (max-width: 768px) {
      #niste-nav { padding: 1rem 1.4rem; }
      .nav-links  { display: none; }
      .nav-hamburger { display: flex; }
    }
  `;
  const style = document.createElement("style");
  style.id = "niste-nav-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

function bindHamburger() {
  const btn  = document.getElementById("nav-hamburger");
  const menu = document.getElementById("nav-mobile-menu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const isOpen = btn.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen);
    menu.classList.toggle("open", isOpen);
    menu.setAttribute("aria-hidden", !isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  });
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      btn.classList.remove("open");
      menu.classList.remove("open");
      document.body.style.overflow = "";
    });
  });
}

function initNav() {
  const root = document.getElementById("nav-root");
  if (!root) { console.warn("[nav.js] Geen #nav-root gevonden."); return; }
  injectNavStyles();
  root.innerHTML = buildNav();
  bindHamburger();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNav);
} else {
  initNav();
}
