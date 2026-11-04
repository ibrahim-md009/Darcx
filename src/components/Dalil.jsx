import { useEffect, useId, useRef } from "react";

/* Dalil's face: a friendly little round robot in the Darcx colours (sage head, dark visor, one glowing antenna).
   The eyes follow the pointer (on phones they glance around by themselves) and blink every 5 s (CSS: .dl-blink in styles.css).
   Colours are fixed brand colours, so the same drawing also works as the site icon (public/assets/dalil.svg). */

const INK = "#0e1116";
const SAGE_LIGHT = "#d3ddd3";
const SAGE_DARK = "#97a698";

/* two eyes inside the dark visor. `look` = how far a pupil may travel */
const EYES = [
  { cx: 38, cy: 52, rx: 8.6, ry: 10, pr: 5, look: 3.2 },
  { cx: 62, cy: 52, rx: 8.6, ry: 10, pr: 5, look: 3.2 },
];

const REACH = 170;         // px: a pupil is fully turned when the pointer is at least this far away
const GLANCE_AFTER = 6000; // ms without pointer movement before the eyes start looking around by themselves

/* pupils follow the pointer; `enabled` = false detaches everything (for a face that is not visible) */
function useGaze(enabled, eyeRefs, pupilRefs) {
  useEffect(() => {
    if (!enabled || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const eyes = eyeRefs.current, pupils = pupilRefs.current;
    const current = EYES.map(() => [0, 0]), target = EYES.map(() => [0, 0]);
    let pointer = null, raf = 0, lastMove = performance.now(), backTimer = 0;

    const aim = () => {
      eyes.forEach((eye, i) => {
        if (!eye) return;
        if (!pointer) { target[i] = [0, 0]; return; }
        const box = eye.getBoundingClientRect();
        const dx = pointer.x - (box.left + box.width / 2), dy = pointer.y - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const travel = Math.min(1, distance / REACH) * EYES[i].look;
        target[i] = [(dx / distance) * travel, (dy / distance) * travel];
      });
    };
    const step = () => {
      raf = 0;
      let moving = false;
      pupils.forEach((pupil, i) => {
        if (!pupil) return;
        const cur = current[i], tgt = target[i];
        cur[0] += (tgt[0] - cur[0]) * 0.2;
        cur[1] += (tgt[1] - cur[1]) * 0.2;
        if (Math.abs(tgt[0] - cur[0]) > 0.01 || Math.abs(tgt[1] - cur[1]) > 0.01) moving = true;
        pupil.setAttribute("transform", `translate(${cur[0].toFixed(2)} ${cur[1].toFixed(2)})`);
      });
      if (moving) raf = requestAnimationFrame(step);
    };
    const update = () => { aim(); if (!raf) raf = requestAnimationFrame(step); };

    const onMove = event => { pointer = { x: event.clientX, y: event.clientY }; lastMove = performance.now(); update(); };
    const onScroll = () => { if (pointer) update(); };   // the page moved under the pointer: look again
    const onLeave = () => { pointer = null; update(); }; // the pointer left the window: look straight ahead

    /* nobody is pointing (phones, idle desktop): glance somewhere now and then, then look back */
    const glance = setInterval(() => {
      if (performance.now() - lastMove < GLANCE_AFTER) return;
      const angle = Math.random() * Math.PI * 2, size = 0.5 + Math.random() * 0.5;
      EYES.forEach((eye, i) => { target[i] = [Math.cos(angle) * size * eye.look, Math.sin(angle) * size * eye.look]; });
      if (!raf) raf = requestAnimationFrame(step);
      clearTimeout(backTimer);
      backTimer = setTimeout(() => { if (!pointer) { EYES.forEach((_, i) => { target[i] = [0, 0]; }); if (!raf) raf = requestAnimationFrame(step); } }, 1100);
    }, 4200);

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onMove);
      removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      clearInterval(glance);
      clearTimeout(backTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);
}

export default function Dalil({ enabled = true, talking = false, className = "" }) {
  const id = useId().replace(/:/g, "");
  const eyeRefs = useRef([]);
  const pupilRefs = useRef([]);
  useGaze(enabled, eyeRefs, pupilRefs);

  return (
    <svg viewBox="2 -4 96 100" className={"dl " + (talking ? "is-talking " : "") + className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id + "h"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SAGE_LIGHT} />
          <stop offset="1" stopColor={SAGE_DARK} />
        </linearGradient>
      </defs>

      {/* antenna with a glowing tip */}
      <path d="M50 17V8" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle className="dl-halo" cx="50" cy="5" r="9" fill="#e6f0e6" opacity="0.5" />
      <circle cx="50" cy="5" r="4.6" fill="#f4f9f4" stroke={INK} strokeWidth="1.3" />

      {/* ears */}
      <rect x="3" y="44" width="9" height="22" rx="4.5" fill={SAGE_DARK} stroke={INK} strokeWidth="1.4" />
      <rect x="88" y="44" width="9" height="22" rx="4.5" fill={SAGE_DARK} stroke={INK} strokeWidth="1.4" />

      {/* head, visor, shine */}
      <rect x="9" y="16" width="82" height="74" rx="34" fill={`url(#${id}h)`} stroke={INK} strokeWidth="1.5" />
      <rect x="19" y="32" width="62" height="40" rx="20" fill={INK} />
      <ellipse cx="33" cy="24" rx="13" ry="4.4" fill="#fff" opacity="0.28" transform="rotate(-12 33 24)" />

      {EYES.map((eye, i) => (
        <g key={i} transform={`translate(${eye.cx} ${eye.cy})`}>
          <g className="dl-blink">
            <ellipse rx={eye.rx} ry={eye.ry} fill="#f4f9f4" ref={el => { eyeRefs.current[i] = el; }} />
            <g ref={el => { pupilRefs.current[i] = el; }}>
              <circle r={eye.pr} fill={INK} />
              <circle r={eye.pr * 0.34} cx={-eye.pr * 0.32} cy={-eye.pr * 0.38} fill="#fff" />
            </g>
          </g>
        </g>
      ))}

      {/* cheeks and a smile */}
      <circle cx="26" cy="79" r="4" fill="#f0627a" opacity="0.35" />
      <circle cx="74" cy="79" r="4" fill="#f0627a" opacity="0.35" />
      <path className="dl-mouth" d="M43 79Q50 85 57 79" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
