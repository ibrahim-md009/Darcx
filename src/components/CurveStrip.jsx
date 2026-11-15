import { useEffect, useRef } from "react";
import { useApp } from "../context.jsx";

/* The band right after the hero: a line of words (DARCX and the technologies we use) that runs along a wave.
   It drifts on its own and a little faster while you scroll. It always runs left to right (the words are Latin).
   Reduced motion: it stands still. */
const WAVE = "M-100 70 C 0 8, 100 132, 200 70 S 400 8, 500 70 S 700 132, 800 70 S 1000 8, 1100 70 S 1300 132, 1400 70";

export default function CurveStrip() {
  const { data } = useApp();
  const boxRef = useRef(null);
  const pathRef = useRef(null);
  const words = ["DARCX", ...(data.stack || []).map(word => word.toUpperCase())];
  const unit = words.join(" ✦ ") + " ✦ ";

  useEffect(() => {
    const box = boxRef.current, path = pathRef.current;
    if (!box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let width = 0, raf = 0, visible = true, ready = false;
    const start = performance.now();
    const measure = () => { width = path.getComputedTextLength() / 6 || 0; ready = width > 0; };   // the text is repeated 6 times
    (document.fonts?.ready ?? Promise.resolve()).then(measure);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
    observer.observe(box);
    function frame(now) {
      raf = 0;
      if (!visible) return;
      if (!ready) measure();
      if (ready) path.setAttribute("startOffset", String(-(((now - start) * 0.04 + scrollY * 0.35) % width)));
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { observer.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [unit]);

  return (
    <div className="curve" ref={boxRef} aria-label={words.join(", ")} role="img">
      <svg viewBox="0 0 1200 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d={WAVE + " L1400 400 L-100 400 Z"} fill="var(--band-sand)" stroke="none" />
        <path id="curve-wave" d={WAVE} fill="none" stroke="var(--line)" strokeWidth="2" />
        <text><textPath href="#curve-wave" ref={pathRef} startOffset="0">{unit.repeat(6)}</textPath></text>
      </svg>
    </div>
  );
}
