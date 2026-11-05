import { useEffect, useRef, useState } from "react";

/* The empty half of the home page's first screen: a fine field of tiny squares that covers it edge to edge
   (it fades out toward the text so it never gets in its way). Drawn on two canvases: the resting field once, and only the
   few squares that are lit on a second one, so thousands of cells stay cheap.
   Desktop only (the media query below); on phones and small windows nothing is created.
   Hover (anywhere on the first screen): the pointer is followed (with a little lag) by DARCX's own shapes drawn in lit squares:
   a small sage quarter disc (the rounded corner used all over the site) with the thin slanted line rising from it
   (the one in the corner shapes), a compact mark that leaves a short fading trail. The shapes mirror in English (LTR) like the corner shapes do.
   Click: a faint ring of light spreads out. Reduced motion: the field is drawn, nothing reacts.
   Colours come from the page's own variables (--sage, --fg), so light and dark themes both work. */

const QUERY = "(min-width: 1024px) and (hover: hover)";
const CELL = 3;        // px, side of a square
const GAP = 2;         // px between squares
const DISC = 36;       // px, radius of the small quarter disc at the pointer
const LINE = 64;       // px, length of the thin slanted line that rises from the pointer
const LINE_WIDTH = 1.6; // px, half-thickness of the line
const TILT = 32 * Math.PI / 180; // the same 32° tilt as the line in the corner shapes
const FOLLOW = 0.22;   // 0–1: how quickly the shapes catch up with the pointer (low = more lag)
const STRENGTH = 0.4;  // 0–1: how strong a lit square gets (low = subtle)
const FADE_MS = 480;   // time for a lit square to fade out
const RING_SPEED = 0.3;  // px per ms
const RING_LIFE = 1600;  // ms

export default function HeroGrid() {
  const [show, setShow] = useState(() => matchMedia(QUERY).matches);
  const boxRef = useRef(null);
  const restRef = useRef(null);
  const liveRef = useRef(null);

  useEffect(() => {
    const query = matchMedia(QUERY);
    const update = () => setShow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!show) return;
    const box = boxRef.current, hero = box.parentElement;
    const rest = restRef.current.getContext("2d"), live = liveRef.current.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, cols = 0, rows = 0, left = 0, top = 0, level = new Float32Array(0);
    let pointer = null, follow = null, raf = 0, last = 0;
    const sign = getComputedStyle(hero).direction === "rtl" ? 1 : -1; // the corner shapes mirror between Arabic and English
    const rings = [];
    const pitch = CELL + GAP;
    const colours = () => {
      const style = getComputedStyle(document.documentElement);
      return { sage: style.getPropertyValue("--sage").trim() || "#a7b4a8", ink: style.getPropertyValue("--fg").trim() || "#0e1116" };
    };

    function drawRest() {
      const { ink } = colours();
      rest.clearRect(0, 0, width, height);
      rest.globalAlpha = 0.09;
      rest.fillStyle = ink;
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) rest.fillRect(left + col * pitch, top + row * pitch, CELL, CELL);
      rest.globalAlpha = 1;
    }

    function drawLive() {
      const { sage, ink } = colours();
      live.clearRect(0, 0, width, height);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lit = level[row * cols + col];
          if (lit < 0.02) continue;
          const x = left + col * pitch, y = top + row * pitch, grow = 0.6 * lit, size = CELL + grow;
          live.globalAlpha = lit * STRENGTH;
          live.fillStyle = sage;
          live.fillRect(x - grow / 2, y - grow / 2, size, size);
          live.globalAlpha = lit * STRENGTH * 0.5; // a touch of the text colour: deepens the sage on light pages, brightens it on dark ones
          live.fillStyle = ink;
          live.fillRect(x - grow / 2, y - grow / 2, size, size);
        }
      }
      live.globalAlpha = 1;
    }

    const resize = () => {
      const ratio = Math.min(2, devicePixelRatio || 1);
      width = box.clientWidth; height = box.clientHeight;
      for (const canvas of [restRef.current, liveRef.current]) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
      rest.setTransform(ratio, 0, 0, ratio, 0, 0); live.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.max(1, Math.floor((width + GAP) / pitch)); rows = Math.max(1, Math.floor((height + GAP) / pitch));
      left = (width - (cols * pitch - GAP)) / 2; top = (height - (rows * pitch - GAP)) / 2;
      level = new Float32Array(cols * rows);
      drawRest();
      drawLive();
    };

    function frame(now) {
      raf = 0;
      const dt = Math.min(64, now - (last || now));
      last = now;
      const keep = Math.pow(0.01, dt / FADE_MS);
      let busy = !!pointer;
      if (pointer) {
        follow = follow || { ...pointer };
        follow.x += (pointer.x - follow.x) * FOLLOW;
        follow.y += (pointer.y - follow.y) * FOLLOW;
      }
      for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].at > RING_LIFE) rings.splice(i, 1);
      if (rings.length) busy = true;
      const sin = Math.sin(TILT), cos = Math.cos(TILT);
      /* only squares near the pointer's shapes or a ring can light up; all of them keep fading */
      for (let index = 0; index < level.length; index++) {
        let value = level[index] * keep;
        if (follow || rings.length) {
          const col = index % cols, row = (index - col) / cols;
          const cx = left + col * pitch + CELL / 2, cy = top + row * pitch + CELL / 2;
          if (follow) {
            const dx = (cx - follow.x) * sign, dy = cy - follow.y;
            if (Math.abs(dx) < LINE && Math.abs(dy) < LINE) {
              if (dx >= -3 && dy >= -3) { // the quarter disc: round edge away from the pointer, like the corner disc
                const near = 1 - Math.hypot(dx, dy) / DISC;
                if (near > 0) value = Math.max(value, Math.pow(near, 0.8) * 0.85);
              }
              const along = -dx * sin + dy * cos, across = dx * cos + dy * sin; // the thin slanted line rising from the pointer
              if (Math.abs(across) < LINE_WIDTH && along < 3 && along > -LINE) value = Math.max(value, (1 + along / LINE) * 0.9);
            }
          }
          for (const ring of rings) {
            const age = now - ring.at;
            const band = 1 - Math.abs(Math.hypot(cx - ring.x, cy - ring.y) - age * RING_SPEED) / 40;
            if (band > 0) value = Math.max(value, band * (1 - age / RING_LIFE));
          }
        }
        if (value < 0.004) value = 0; else busy = true;
        level[index] = value;
      }
      drawLive();
      if (busy) raf = requestAnimationFrame(frame); else last = 0;
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const place = event => { const rect = box.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const onMove = event => { pointer = place(event); wake(); };
    const onLeave = () => { pointer = null; follow = null; wake(); };
    const onDown = event => { rings.push({ ...place(event), at: performance.now() }); wake(); };

    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();
    if (!still) { // the whole first screen listens (the field sits behind the text, which stays clickable)
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", onLeave);
      hero.addEventListener("pointerdown", onDown);
    }
    return () => {
      observer.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("pointerdown", onDown);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className="hg" ref={boxRef} aria-hidden="true">
      <canvas ref={restRef} />
      <canvas ref={liveRef} />
    </div>
  );
}
