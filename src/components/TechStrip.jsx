import { useEffect, useRef } from "react";
import { useApp } from "../context.jsx";

/* A band of big words (the technologies we use) that drifts sideways, and leans with the speed of your scrolling.
   Always runs left to right in both languages (the words are Latin). Reduced motion: it stands still. */
export default function TechStrip() {
  const { data } = useApp();
  const stripRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const strip = stripRef.current, track = trackRef.current;
    if (!strip || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let x = 0, velocity = 0, lastY = scrollY, raf = 0, visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
    observer.observe(strip);
    function frame() {
      raf = 0;
      if (!visible) return;
      velocity += (scrollY - lastY - velocity) * 0.18;
      lastY = scrollY;
      const half = track.scrollWidth / 2;
      x -= 0.7 + Math.abs(velocity) * 0.35;
      if (x < -half) x += half;
      const lean = Math.max(-12, Math.min(12, -velocity * 0.6));
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0) skewX(${lean.toFixed(2)}deg)`;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => { observer.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const words = data.stack || [];
  const run = [...words, ...words];
  return (
    <div className="tech" ref={stripRef} aria-label={words.join(", ")} role="img">
      <div className="tech-track" ref={trackRef} aria-hidden="true">
        {[...run, ...run].map((word, index) => <span key={index} className={index % 2 ? "is-line" : ""}>{word}</span>)}
      </div>
    </div>
  );
}
