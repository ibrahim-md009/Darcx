/* A soft light that follows the pointer across a card (desktop with a mouse only).
   Cards listed in SELECTOR get --gx / --gy (the pointer's place inside the card); the CSS paints a faint radial glow there.
   One listener for the whole page; nothing runs on touch screens or with reduced motion. */
const SELECTOR = ".stk-card, .pcard, .scard";

export function startGlow() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let card = null;
  const onMove = event => {
    const target = event.target.closest?.(SELECTOR);
    if (card && card !== target) { card.style.removeProperty("--gx"); card.style.removeProperty("--gy"); }
    card = target || null;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--gx", event.clientX - box.left + "px");
    card.style.setProperty("--gy", event.clientY - box.top + "px");
  };
  addEventListener("pointermove", onMove, { passive: true });
  return () => removeEventListener("pointermove", onMove);
}
