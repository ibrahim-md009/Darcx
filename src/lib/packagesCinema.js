/* Cinematic entrance for the packages section (Services page).

   Sequence, played once each time the section is reached from above (about 3.3 s in total):
     0.00 s  a dark shadow rises from the bottom of the screen as a dome and covers the whole page
     0.60 s  a thin sage light line sweeps across the dark
     0.90 s  while the page is completely covered, it jumps to the packages (centred on tall screens, under the top bar otherwise)
     1.20 s  the shadow dissolves; the heading appears out of it
     1.45 s  the package cards rise one after another from below the screen
   Cards that are still below the fold (stacked layouts) rise when they scroll into view instead.
   Positions are measured without the hiding transform (offsetTop), because a hidden card sits a screen-height lower.

   The state lives in one attribute on the wrapper, `data-fx`:
     idle  cards and heading are hidden, waiting for the visitor to arrive
     play  the sequence is running
     done  everything is visible and no animation rules apply any more
   All visuals are CSS (see "packages cinematic entrance" in styles.css); this file only decides when to start
   (and creates the full-screen shadow element).
   Reduced motion: nothing is hidden and nothing plays (the attribute is never set). */

const ZONE = 0.78;       // start when the section's top edge is higher than this fraction of the viewport height
const RESET = 1.1;       // re-arm once the section is completely below the screen again (scrolled back up)
const ALIGN_AT = 900;    // ms after the start when the page moves to the packages (the shadow fully covers the screen from 0.86 s)
const CARDS_AT = 1450;   // ms after the start when the first card begins to rise
const STAGGER = 260;     // ms between cards
const FINISH_AFTER = 1800; // ms after the last card has started rising until the state becomes "done"
const AUTO_AFTER = 2500; // if the section is already on screen at load, start after this long unless the visitor scrolls first

export function startPackagesCinema(flow, band) {
  if (!flow || !band) return () => {};
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  let state = "idle", frame = 0, waiting = false, started = false, finishing = false, autoStart = false, locked = null;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const cards = () => [...band.querySelectorAll(".pk-card")];
  /* The shadow is attached straight to <body>: inside <main> it would sit under the fixed top and bottom bars. */
  const veil = document.createElement("div");
  veil.className = "pk-veil";
  veil.setAttribute("aria-hidden", "true");
  veil.append(document.createElement("i"));
  document.body.append(veil);
  const set = value => { state = value; flow.dataset.fx = value; veil.dataset.fx = value; };

  const settle = () => {
    if (finishing || state !== "play" || !cards().every(card => card.classList.contains("is-up"))) return;
    finishing = true;
    later(() => set("done"), FINISH_AFTER);
  };
  const rise = (card, delay) => { card.style.setProperty("--dl", delay + "ms"); card.classList.add("is-up"); };
  /* where the card sits in the viewport when it is not displaced (transforms are ignored by offsetTop) */
  const naturalTop = el => { let y = 0; for (let node = el; node; node = node.offsetParent) y += node.offsetTop; return y - scrollY; };

  /* releases the cards that are on screen: the first batch one after another, later ones as they scroll into view */
  const release = stagger => {
    let order = 0;
    cards().forEach(card => {
      if (card.classList.contains("is-up") || naturalTop(card) > innerHeight * 0.92) return;
      rise(card, stagger ? order++ * STAGGER : 0);
    });
    settle();
  };
  const startCards = () => { started = true; release(true); };

  /* While the entrance runs the page cannot be scrolled (this also stops a touch fling that would carry the page past the packages) */
  const lock = () => {
    if (locked) return;
    const root = document.documentElement;
    locked = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
    root.style.scrollbarGutter = "stable"; // keeps the page width unchanged when the scrollbar disappears
    root.style.overflow = "hidden";
  };
  const unlock = () => {
    if (!locked) return;
    const root = document.documentElement;
    root.style.overflow = locked.overflow;
    root.style.scrollbarGutter = locked.gutter;
    locked = null;
  };

  /* Moves the page so the packages are framed: centred between the bars when the whole section fits on screen,
     otherwise its top edge just below the top bar. Instant on purpose: the shadow hides the jump. */
  const align = () => {
    const rect = band.getBoundingClientRect();
    const top = document.querySelector(".nav")?.offsetHeight || 64;
    const bar = document.querySelector(".bnav");
    const bottom = bar && getComputedStyle(bar).display !== "none" ? bar.offsetHeight : 0;
    const free = innerHeight - top - bottom;
    const offset = rect.height <= free ? top + (free - rect.height) / 2 : top;
    const target = scrollY + rect.top - offset;
    if (Math.abs(target - scrollY) > 2) scrollTo({ top: target, behavior: "instant" });
  };

  const play = () => {
    set("play");
    if (!autoStart) { lock(); later(align, ALIGN_AT); }   // when it started by itself the page is already where it should be
    later(() => { unlock(); startCards(); }, CARDS_AT);
  };

  const reset = () => {
    timers.forEach(clearTimeout); timers.clear();
    unlock();
    started = false; finishing = false; autoStart = false;
    cards().forEach(card => { card.classList.remove("is-up"); card.style.removeProperty("--dl"); });
    set("idle");
  };

  const check = () => {
    frame = 0;
    const viewport = innerHeight, rect = band.getBoundingClientRect();
    if (state === "idle") {
      if (rect.bottom < 0) set("done");                       // page opened below the section: just show it
      else if (rect.top < viewport * ZONE && !waiting) play();
    } else if (state === "play" && started) release(false);
    else if (state === "done" && rect.top > viewport * RESET) reset();
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(check); };
  const onScroll = () => { if (waiting && scrollY > 4) { waiting = false; autoStart = false; } request(); };

  set("idle");
  /* the section is already on screen at the top of the page (tall screens): let the visitor scroll first */
  waiting = scrollY < 4 && band.getBoundingClientRect().top < innerHeight * ZONE;
  if (waiting) later(() => { waiting = false; autoStart = true; request(); }, AUTO_AFTER);
  check();

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", request);
  return () => {
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", request);
    if (frame) cancelAnimationFrame(frame);
    timers.forEach(clearTimeout); timers.clear();
    unlock();
    cards().forEach(card => { card.classList.remove("is-up"); card.style.removeProperty("--dl"); });
    delete flow.dataset.fx;
    veil.remove();
  };
}
