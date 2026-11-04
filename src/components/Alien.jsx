import { useEffect, useId, useRef } from "react";

/* The Darcx creature: a sage-green alien with three eyes and two glowing antennae.
   - variant "face": only the head, cropped for the round badge / the site icon
   - variant "full": head, little body and a waving arm (the one that climbs out of the badge)
   Eyes follow the pointer (phones: they glance around by themselves) and blink every 5 s (CSS: .al-blink in styles.css).
   All colours are fixed brand colours (they do not depend on the light/dark theme), so the same drawing also works as the site icon. */

const INK = "#0e1116";
const SAGE_LIGHT = "#cbd6cb";
const SAGE_DARK = "#97a698";
const HEAD = "M50 12C76 12 91 32 90 54C89 76 72 92 50 92C28 92 11 76 10 54C9 32 24 12 50 12Z";
const BODY = "M31 86C29 106 31 119 37 124C41 128 45 125 47 121C49 126 51 126 53 121C55 125 59 128 63 124C69 119 71 106 69 86Z";

/* two big eyes and one small eye in the forehead. `look` = how far the pupil may travel, `lashes` = directions (degrees) */
const EYES = [
  { cx: 33, cy: 52, rx: 11, ry: 12.5, pr: 6.4, look: 4.3, lashes: [-152, -126, -100] },
  { cx: 67, cy: 52, rx: 11, ry: 12.5, pr: 6.4, look: 4.3, lashes: [-28, -54, -80] },
  { cx: 50, cy: 27, rx: 5.2, ry: 5.6, pr: 3, look: 1.6, lashes: [] },
];
const f = n => n.toFixed(1);
function lash(eye, deg) {
  const a = (deg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
  const x1 = dx * eye.rx * 0.96, y1 = dy * eye.ry * 0.96, x2 = x1 + dx * 5, y2 = y1 + dy * 5;
  const qx = (x1 + x2) / 2 - dy * 1.4, qy = (y1 + y2) / 2 + dx * 1.4;
  return `M${f(x1)} ${f(y1)}Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}`;
}

const REACH = 170;         // px: a pupil is fully turned when the pointer is at least this far away
const GLANCE_AFTER = 6000; // ms without pointer movement before the eyes start looking around by themselves

/* pupils follow the pointer; `enabled` = false detaches everything (for an alien that is not visible) */
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

export default function Alien({ variant = "face", enabled = true, talking = false, className = "" }) {
  const id = useId().replace(/:/g, "");
  const eyeRefs = useRef([]);
  const pupilRefs = useRef([]);
  useGaze(enabled, eyeRefs, pupilRefs);
  const full = variant === "full";

  return (
    <svg
      viewBox={full ? "0 -6 100 136" : "6 -4 88 88"}
      className={"al " + (talking ? "is-talking " : "") + className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id + "h"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SAGE_LIGHT} />
          <stop offset="1" stopColor={SAGE_DARK} />
        </linearGradient>
        <linearGradient id={id + "b"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b7aa" />
          <stop offset="1" stopColor="#85947f" />
        </linearGradient>
      </defs>

      {full && (
        <>
          {/* body and arms stand behind the head */}
          <path d={BODY} fill={`url(#${id}b)`} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
          <g>
            <path d="M33 97Q21 100 15 110" fill="none" stroke={INK} strokeWidth="8.4" strokeLinecap="round" />
            <path d="M33 97Q21 100 15 110" fill="none" stroke="#9eac9f" strokeWidth="5.4" strokeLinecap="round" />
          </g>
          <g className="al-wave">
            <path d="M67 97Q79 94 87 82" fill="none" stroke={INK} strokeWidth="8.4" strokeLinecap="round" />
            <path d="M67 97Q79 94 87 82" fill="none" stroke="#9eac9f" strokeWidth="5.4" strokeLinecap="round" />
          </g>
        </>
      )}

      {/* antennae with glowing tips */}
      <path d="M39 14Q31 8 26 3.5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M61 14Q69 8 74 3.5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <circle className="al-halo" cx="26" cy="3" r="8" fill="#e6f0e6" opacity="0.5" />
      <circle className="al-halo al-halo-2" cx="74" cy="3" r="8" fill="#e6f0e6" opacity="0.5" />
      <circle cx="26" cy="3" r="4.2" fill="#f4f9f4" stroke={INK} strokeWidth="1.1" />
      <circle cx="74" cy="3" r="4.2" fill="#f4f9f4" stroke={INK} strokeWidth="1.1" />

      {/* head */}
      <path d={HEAD} fill={`url(#${id}h)`} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="34" cy="26" rx="14" ry="6" fill="#fff" opacity="0.22" transform="rotate(-24 34 26)" />

      {EYES.map((eye, i) => (
        <g key={i} transform={`translate(${eye.cx} ${eye.cy})`}>
          <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" fill="none">
            {eye.lashes.map(deg => <path key={deg} d={lash(eye, deg)} />)}
          </g>
          <g className="al-blink">
            <ellipse rx={eye.rx} ry={eye.ry} fill="#fff" stroke={INK} strokeWidth="1.1" ref={el => { eyeRefs.current[i] = el; }} />
            <g ref={el => { pupilRefs.current[i] = el; }}>
              <circle r={eye.pr} fill={INK} />
              <circle r={eye.pr * 0.32} cx={-eye.pr * 0.32} cy={-eye.pr * 0.38} fill="#fff" />
              <circle r={eye.pr * 0.15} cx={eye.pr * 0.3} cy={eye.pr * 0.32} fill="#fff" />
            </g>
          </g>
        </g>
      ))}

      <path className="al-mouth" d="M43 74Q50 81 57 74" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
