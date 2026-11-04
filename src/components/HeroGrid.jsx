import { useEffect, useRef, useState } from "react";

/* The empty part of the home page's first screen: a field of small squares (a canvas, so hundreds of cells stay cheap).
   Desktop only (the media query below); on phones and small windows nothing is created.
   Hover: squares near the pointer light up in the brand sage, swell a little and fade out behind it, leaving a trail.
   Click: a ring of light spreads out from the click.
   Reduced motion: the field is drawn, but nothing reacts.
   Colours come from the page's own variables (--sage, --fg), so light and dark themes both work. */

const QUERY = "(min-width: 1024px) and (hover: hover)";
const CELL = 7;       // px, side of a square
const GAP = 3;        // px between squares
const REACH = 95;     // px around the pointer that lights up
const FADE_MS = 650;  // time for a lit square to fade out
const RING_SPEED = 0.34; // px per ms
const RING_LIFE = 1700;  // ms

export default function HeroGrid() {
  const [show, setShow] = useState(() => matchMedia(QUERY).matches);
  const boxRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const query = matchMedia(QUERY);
    const update = () => setShow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!show) return;
    const box = boxRef.current, canvas = canvasRef.current, context = canvas.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, cols = 0, rows = 0, left = 0, top = 0, level = new Float32Array(0);
    let pointer = null, raf = 0, last = 0;
    const rings = [];
    const pitch = CELL + GAP;

    const resize = () => {
      const ratio = Math.min(2, devicePixelRatio || 1);
      width = box.clientWidth; height = box.clientHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.max(1, Math.floor((width + GAP) / pitch)); rows = Math.max(1, Math.floor((height + GAP) / pitch));
      left = (width - (cols * pitch - GAP)) / 2; top = (height - (rows * pitch - GAP)) / 2;
      level = new Float32Array(cols * rows);
      draw();
    };

    const colours = () => {
      const style = getComputedStyle(document.documentElement);
      return { sage: style.getPropertyValue("--sage").trim() || "#a7b4a8", ink: style.getPropertyValue("--fg").trim() || "#0e1116" };
    };

    function draw() {
      const { sage, ink } = colours();
      context.clearRect(0, 0, width, height);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lit = level[row * cols + col];
          const x = left + col * pitch, y = top + row * pitch;
          if (lit < 0.01) { // resting square: a faint outline-like tile
            context.globalAlpha = 0.1;
            context.fillStyle = ink;
            context.fillRect(x, y, CELL, CELL);
            continue;
          }
          const grow = 1 + 0.32 * lit, size = CELL * grow, shift = (size - CELL) / 2;
          context.globalAlpha = 0.1 + 0.9 * lit;
          context.fillStyle = sage;
          if (lit > 0.35) { context.shadowColor = sage; context.shadowBlur = 14 * lit; } else { context.shadowBlur = 0; }
          context.fillRect(x - shift, y - shift, size, size);
          context.shadowBlur = 0;
          context.globalAlpha = 0.3 * lit; // a touch of the text colour: deepens the sage on light pages, brightens it on dark ones
          context.fillStyle = ink;
          context.fillRect(x - shift, y - shift, size, size);
          if (lit > 0.6) { // bright core
            context.globalAlpha = (lit - 0.6) * 1.6;
            context.fillStyle = "#ffffff";
            context.fillRect(x + CELL * 0.28, y + CELL * 0.28, CELL * 0.44, CELL * 0.44);
          }
        }
      }
      context.globalAlpha = 1;
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(64, now - (last || now));
      last = now;
      const keep = Math.pow(0.01, dt / FADE_MS);
      let busy = !!pointer;
      for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].at > RING_LIFE) rings.splice(i, 1);
      if (rings.length) busy = true;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col;
          const cx = left + col * pitch + CELL / 2, cy = top + row * pitch + CELL / 2;
          let value = level[index] * keep;
          if (pointer) {
            const near = 1 - Math.hypot(cx - pointer.x, cy - pointer.y) / REACH;
            if (near > 0) value = Math.max(value, Math.pow(near, 1.4));
          }
          for (const ring of rings) {
            const age = now - ring.at;
            const edge = Math.abs(Math.hypot(cx - ring.x, cy - ring.y) - age * RING_SPEED);
            const band = 1 - edge / 46;
            if (band > 0) value = Math.max(value, band * (1 - age / RING_LIFE));
          }
          if (value < 0.004) value = 0; else busy = true;
          level[index] = value;
        }
      }
      draw();
      if (busy) raf = requestAnimationFrame(frame); else last = 0;
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const place = event => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const onMove = event => { pointer = place(event); wake(); };
    const onLeave = () => { pointer = null; wake(); };
    const onDown = event => { const point = place(event); rings.push({ ...point, at: performance.now() }); wake(); };

    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();
    if (!still) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerdown", onDown);
    }
    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className="hg" ref={boxRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
