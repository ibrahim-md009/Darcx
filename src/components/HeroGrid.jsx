import { useEffect, useRef, useState } from "react";

/* The empty half of the home page's first screen: a fine field of tiny squares that covers it edge to edge
   (it fades out toward the text so it never gets in its way). Drawn on two canvases: the resting field once, and only the
   few squares that are lit on a second one, so thousands of cells stay cheap.
   Desktop only (the media query below); on phones and small windows nothing is created.
   Hover (anywhere on the first screen): the pointer sinks into a pit. The squares around it are pulled in, shrink and swirl
   like water draining (a slow vortex), a dark hole sits under the pointer, and calm sage ripples spread out from it now and then.
   The pit follows the pointer with a heavy lag. Click: a faint ring of light spreads out. Reduced motion: the field is drawn, nothing reacts.
   Colours come from the page's own variables (--sage, --fg), so light and dark themes both work. */

const QUERY = "(min-width: 1024px) and (hover: hover)";
const CELL = 3;        // px, side of a square
const GAP = 2;         // px between squares
const PIT = 96;        // px, radius of the pit around the pointer
const HOLE = 10;       // px, radius of the empty hole right under the pointer
const SWIRL = 1.25;    // radians the squares turn at the edge of the hole (the vortex)
const PULL = 0.62;     // 0–1: how far squares slide toward the pointer at the hole's edge
const RIPPLE_EVERY = 520; // ms between ripples while the pointer moves
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
    let dirty = null, lastRipple = 0;
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
      if (follow) { // the dark hole under the pointer
        const g = live.createRadialGradient(follow.x, follow.y, 0, follow.x, follow.y, PIT * 0.5);
        g.addColorStop(0, ink); g.addColorStop(1, "transparent");
        live.globalAlpha = 0.3; live.fillStyle = g;
        live.fillRect(follow.x - PIT, follow.y - PIT, PIT * 2, PIT * 2);
        live.globalAlpha = 1;
      }
    }

    /* repaint the resting squares around the pointer, pulled into the pit; `at` = where the pit is (null = put them back) */
    function paintPit(at) {
      const { sage, ink } = colours();
      const reach = PIT + pitch;
      const c0 = at ? Math.max(0, Math.floor((at.x - reach - left) / pitch)) : dirty ? dirty.c0 : 0;
      const c1 = at ? Math.min(cols - 1, Math.ceil((at.x + reach - left) / pitch)) : dirty ? dirty.c1 : -1;
      const r0 = at ? Math.max(0, Math.floor((at.y - reach - top) / pitch)) : dirty ? dirty.r0 : 0;
      const r1 = at ? Math.min(rows - 1, Math.ceil((at.y + reach - top) / pitch)) : dirty ? dirty.r1 : -1;
      const span = box => box && box.c1 >= box.c0 ? box : null;
      const area = span(dirty), now = at ? { c0, c1, r0, r1 } : null;
      const merged = area && now ? { c0: Math.min(area.c0, now.c0), c1: Math.max(area.c1, now.c1), r0: Math.min(area.r0, now.r0), r1: Math.max(area.r1, now.r1) } : area || now;
      if (!merged) return;
      rest.clearRect(left + merged.c0 * pitch - pitch, top + merged.r0 * pitch - pitch, (merged.c1 - merged.c0 + 3) * pitch, (merged.r1 - merged.r0 + 3) * pitch);
      for (let row = Math.max(0, merged.r0 - 1); row <= Math.min(rows - 1, merged.r1 + 1); row++) {
        for (let col = Math.max(0, merged.c0 - 1); col <= Math.min(cols - 1, merged.c1 + 1); col++) {
          let x = left + col * pitch + CELL / 2, y = top + row * pitch + CELL / 2, size = CELL, alpha = 0.09, colour = ink;
          if (at) {
            const dx = x - at.x, dy = y - at.y, d = Math.hypot(dx, dy);
            if (d < PIT) {
              if (d < HOLE) continue; // the hole itself stays empty
              const t = 1 - d / PIT, depth = t * t;
              const turn = depth * SWIRL, k = 1 - depth * PULL; // turn around the pointer and slide toward it
              const rx = dx * Math.cos(turn) - dy * Math.sin(turn), ry = dx * Math.sin(turn) + dy * Math.cos(turn);
              x = at.x + rx * k; y = at.y + ry * k;
              size = CELL * (1 - 0.5 * depth);
              alpha = 0.09 + depth * 0.55;
              colour = depth > 0.15 ? sage : ink;
            }
          }
          rest.globalAlpha = alpha; rest.fillStyle = colour;
          rest.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
      rest.globalAlpha = 1;
      dirty = at ? now : null;
    }

    const resize = () => {
      const ratio = Math.min(2, devicePixelRatio || 1);
      width = box.clientWidth; height = box.clientHeight;
      for (const canvas of [restRef.current, liveRef.current]) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
      rest.setTransform(ratio, 0, 0, ratio, 0, 0); live.setTransform(ratio, 0, 0, ratio, 0, 0);
      cols = Math.max(1, Math.floor((width + GAP) / pitch)); rows = Math.max(1, Math.floor((height + GAP) / pitch));
      left = (width - (cols * pitch - GAP)) / 2; top = (height - (rows * pitch - GAP)) / 2;
      level = new Float32Array(cols * rows);
      dirty = null;
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
      for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].at > (rings[i].soft ? 1500 : RING_LIFE)) rings.splice(i, 1);
      if (rings.length) busy = true;
      if (follow) {
        if (now - lastRipple > RIPPLE_EVERY && Math.hypot(pointer.x - follow.x, pointer.y - follow.y) < 40) { rings.push({ x: follow.x, y: follow.y, at: now, soft: true }); lastRipple = now; }
        paintPit(follow);
      } else if (dirty) paintPit(null);
      if (dirty) busy = true;
      for (let index = 0; index < level.length; index++) {
        let value = level[index] * keep;
        if (rings.length) {
          const col = index % cols, row = (index - col) / cols;
          const cx = left + col * pitch + CELL / 2, cy = top + row * pitch + CELL / 2;
          for (const ring of rings) {
            const age = now - ring.at;
            const speed = ring.soft ? 0.09 : RING_SPEED, life = ring.soft ? 1500 : RING_LIFE, radius = age * speed;
            if (ring.soft && radius < PIT * 0.5) continue; // ripples appear at the rim of the pit
            const band = 1 - Math.abs(Math.hypot(cx - ring.x, cy - ring.y) - radius) / (ring.soft ? 14 : 40);
            if (band > 0) value = Math.max(value, band * (1 - age / life) * (ring.soft ? 0.7 : 1));
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
