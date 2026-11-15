import { useEffect, useRef } from "react";

/* The word DARCX in the footer, made of a few thousand tiny dots. Move the pointer (or a finger) over it and the dots scatter,
   then spring back into the letters. Drawn on one canvas; it only runs while it is on screen.
   Reduced motion: the word is drawn once, nothing moves. */
const STEP = 4;   // px between dots
const REACH = 70; // px: how far from the pointer dots are pushed away

export default function FooterWord() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, dots = [], raf = 0, visible = true;
    const pointer = { x: 0, y: 0, on: false };

    function build() {
      const ratio = Math.min(2, devicePixelRatio || 1);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const off = document.createElement("canvas");
      off.width = width; off.height = height;
      const g = off.getContext("2d");
      const size = Math.min(height * 0.9, width / 3.4);
      g.font = `800 ${size}px "Plus Jakarta Sans", Arial, sans-serif`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("DARCX", width / 2, height / 2 + size * 0.04);
      const data = g.getImageData(0, 0, off.width, off.height).data;
      dots = [];
      for (let y = 0; y < height; y += STEP) for (let x = 0; x < width; x += STEP) {
        if (data[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 128) dots.push({ tx: x, ty: y, x: still ? x : Math.random() * width, y: still ? y : Math.random() * height, vx: 0, vy: 0 });
      }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#a7b4a8";
      for (const dot of dots) ctx.fillRect(dot.x, dot.y, 2.6, 2.6);
    }

    function frame() {
      raf = 0;
      if (!visible) return;
      for (const dot of dots) {
        let ax = (dot.tx - dot.x) * 0.07, ay = (dot.ty - dot.y) * 0.07;
        if (pointer.on) {
          const dx = dot.x - pointer.x, dy = dot.y - pointer.y, d = Math.hypot(dx, dy);
          if (d < REACH) { const push = ((REACH - d) / REACH) * 9; ax += (dx / (d || 1)) * push; ay += (dy / (d || 1)) * push; }
        }
        dot.vx = (dot.vx + ax) * 0.82; dot.vy = (dot.vy + ay) * 0.82;
        dot.x += dot.vx; dot.y += dot.vy;
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    const place = event => { const box = canvas.getBoundingClientRect(); pointer.x = event.clientX - box.left; pointer.y = event.clientY - box.top; pointer.on = true; };
    const leave = () => { pointer.on = false; };
    const onUp = event => { if (event.pointerType !== "mouse") pointer.on = false; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible && !still && !raf) raf = requestAnimationFrame(frame); });
    const resizer = new ResizeObserver(() => build());

    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      build();
      resizer.observe(canvas);
      observer.observe(canvas);
      if (!still) {
        canvas.addEventListener("pointermove", place);
        canvas.addEventListener("pointerdown", place);
        canvas.addEventListener("pointerleave", leave);
        canvas.addEventListener("pointerup", onUp);
      }
    });
    return () => {
      observer.disconnect(); resizer.disconnect();
      canvas.removeEventListener("pointermove", place); canvas.removeEventListener("pointerdown", place);
      canvas.removeEventListener("pointerleave", leave); canvas.removeEventListener("pointerup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas className="foot-word" ref={canvasRef} aria-hidden="true" />;
}
