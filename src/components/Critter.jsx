import { useEffect, useRef } from "react";
import { useApp } from "../context.jsx";

/* The corner shape of every page header, drawn as a small friendly creature peeking in from the corner of the screen.
   - the body is the same quarter disc as before (its centre is the screen corner), with two little ears
   - the eyes follow the mouse; on touch screens (or when nothing moves for a while) they glance around by themselves
   - both eyes blink every 5 seconds (CSS, see "critter" in styles.css)
   Reduced motion: the face is drawn but nothing moves.

   Geometry: everything is placed in polar coordinates around the corner (radius r, angle θ measured from the top edge of the
   screen towards the side edge), so the same face works in both directions: in Arabic (rtl) the corner is top-left,
   in English (ltr) it is top-right. The face's "up" points away from the corner, towards the middle of the screen. */

const EYE_R = 9;         // eyeball radius (viewBox is 100 × 100)
const PUPIL_R = 5.4;
const LOOK = 3.4;        // how far a pupil can travel from the centre of its eye
const REACH = 160;       // px: the pupil is fully turned when the pointer is at least this far away
const GLANCE_AFTER = 6000; // ms without pointer movement before the eyes start looking around by themselves

const rad = deg => (deg * Math.PI) / 180;

/* build all the shapes for one direction */
function buildFace(rtl) {
  const m = rtl ? 1 : -1;                                  // mirrors x for the ltr corner
  const point = (r, deg) => [rtl ? r * Math.cos(rad(deg)) : 100 - r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
  const vec = (x, y) => [m * x, y];
  const f = n => n.toFixed(1);

  const body = rtl ? "M0 0H100A100 100 0 0 1 0 100Z" : "M100 0H0A100 100 0 0 0 100 100Z";
  const up = vec(Math.SQRT1_2, Math.SQRT1_2);              // face "up" (away from the corner), screen coordinates
  const upAngle = (Math.atan2(up[1], up[0]) * 180) / Math.PI; // 45° (rtl) or 135° (ltr)

  /* ears: small rounded triangles standing on the rim near the two screen edges */
  const ears = [[10, -1], [80, 1]].map(([deg, side]) => {
    const a = point(97, deg - 9), b = point(97, deg + 9), tip = point(114, deg + side * 4);
    return {
      outer: `M${f(a[0])} ${f(a[1])}L${f(tip[0])} ${f(tip[1])}L${f(b[0])} ${f(b[1])}Z`,
      inner: (() => {
        const ia = point(98, deg - 4.5), ib = point(98, deg + 4.5), it = point(107, deg + side * 2.5);
        return `M${f(ia[0])} ${f(ia[1])}L${f(it[0])} ${f(it[1])}L${f(ib[0])} ${f(ib[1])}Z`;
      })(),
    };
  });

  /* eyes (symmetric around the diagonal) with three eyelashes each, fanning out on the outer side */
  const eyes = [[30, -1], [60, 1]].map(([deg, side]) => {
    const [cx, cy] = point(62, deg);
    const radial = vec(Math.cos(rad(deg)), Math.sin(rad(deg)));
    const outward = vec(side * -Math.sin(rad(deg)), side * Math.cos(rad(deg))); // along the rim, away from the diagonal
    const lashes = [[1, 0.3, 4.4], [0.78, 0.8, 5.2], [0.4, 1, 4.6]].map(([a, b, len]) => {
      let dx = radial[0] * a + outward[0] * b, dy = radial[1] * a + outward[1] * b;
      const n = Math.hypot(dx, dy); dx /= n; dy /= n;
      const x1 = dx * (EYE_R - 0.6), y1 = dy * (EYE_R - 0.6), x2 = dx * (EYE_R + len), y2 = dy * (EYE_R + len);
      /* a slight curve: control point pushed sideways, away from the eye's up direction */
      const qx = (x1 + x2) / 2 + -dy * 1.3 * side * m * -1, qy = (y1 + y2) / 2 + dx * 1.3 * side * m * -1;
      return `M${f(x1)} ${f(y1)}Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}`;
    });
    return { cx, cy, lashes };
  });

  /* cheeks, nose and mouth */
  const cheeks = [18, 72].map(deg => ({ at: point(82, deg), angle: rtl ? deg + 90 : 90 - deg }));
  const nose = point(52, 45);
  const mouth = point(42, 45);
  return { body, ears, eyes, cheeks, nose, mouth, up, upAngle, mouthAngle: upAngle + 90 /* turns the mouth/nose so they point from the eyes towards the corner */ };
}

export default function Critter() {
  const { lang } = useApp();
  const rtl = lang === "ar";
  const face = buildFace(rtl);

  const svgRef = useRef(null);
  const eyeRefs = useRef([]);
  const pupilRefs = useRef([]);

  /* pupils follow the pointer */
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const eyes = eyeRefs.current, pupils = pupilRefs.current;
    const current = [[0, 0], [0, 0]], target = [[0, 0], [0, 0]];
    let pointer = null, raf = 0, lastMove = performance.now(), glanceTimer = 0;

    const aim = () => {
      eyes.forEach((eye, i) => {
        if (!eye) return;
        if (!pointer) { target[i] = [0, 0]; return; }
        const box = eye.getBoundingClientRect();
        const dx = pointer.x - (box.left + box.width / 2), dy = pointer.y - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const travel = Math.min(1, distance / REACH) * LOOK;
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
    const onScroll = () => { if (pointer) update(); };       // the page moved under the pointer: look again
    const onLeave = () => { pointer = null; update(); };     // the pointer left the window: look straight ahead

    /* nobody is pointing (phones, idle desktop): glance somewhere now and then, then look back */
    const onGlanceTick = () => {
      if (performance.now() - lastMove < GLANCE_AFTER) return;
      const angle = Math.random() * Math.PI * 2, size = (0.5 + Math.random() * 0.5) * LOOK;
      const spot = [Math.cos(angle) * size, Math.sin(angle) * size];
      target[0] = spot.slice(); target[1] = spot.slice();
      if (!raf) raf = requestAnimationFrame(step);
      setTimeout(() => { if (!pointer) { target[0] = [0, 0]; target[1] = [0, 0]; if (!raf) raf = requestAnimationFrame(step); } }, 1100);
    };
    glanceTimer = setInterval(onGlanceTick, 4200);

    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onMove, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onMove);
      removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      clearInterval(glanceTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rtl]);

  const squashAngle = face.upAngle - 90; // blinking squashes the eye along the face's up/down axis

  return (
    <div className="critter" aria-hidden="true">
      <svg ref={svgRef} viewBox="0 0 100 100" className={"cr-all" + (rtl ? "" : " is-ltr")}>
        {/* body and ears share one group so the translucency is applied once (no darker overlaps) */}
        <g className="cr-body">
          <path d={face.body} />
          {face.ears.map((ear, i) => <path key={i} d={ear.outer} stroke="var(--sage)" strokeWidth="5" strokeLinejoin="round" />)}
        </g>
        {face.ears.map((ear, i) => <path key={"in" + i} className="cr-inner-ear" d={ear.inner} strokeWidth="3" strokeLinejoin="round" />)}

        {face.cheeks.map((cheek, i) => (
          <ellipse key={i} className="cr-cheek" cx={cheek.at[0]} cy={cheek.at[1]} rx="6.5" ry="3.6" transform={`rotate(${cheek.angle} ${cheek.at[0]} ${cheek.at[1]})`} />
        ))}

        {face.eyes.map((eye, i) => (
          <g key={i} transform={`translate(${eye.cx.toFixed(1)} ${eye.cy.toFixed(1)})`}>
            <g className="cr-lashes">{eye.lashes.map((d, k) => <path key={k} d={d} />)}</g>
            <g className="cr-blink" style={{ "--a": squashAngle + "deg" }}>
              <circle className="cr-eye" r={EYE_R} ref={el => { eyeRefs.current[i] = el; }} />
              <g ref={el => { pupilRefs.current[i] = el; }}>
                <circle className="cr-pupil" r={PUPIL_R} />
                <circle className="cr-shine" r="1.9" cx={face.up[0] * 2.4} cy={face.up[1] * 2.4 - 0.6} />
                <circle className="cr-shine" r="0.9" cx={-face.up[0] * 1.8} cy={-face.up[1] * 1.8 + 0.8} />
              </g>
            </g>
          </g>
        ))}

        <path className="cr-nose" d="M-2.4 -1.2H2.4L0 1.6Z" transform={`translate(${face.nose[0].toFixed(1)} ${face.nose[1].toFixed(1)}) rotate(${face.mouthAngle})`} />
        <path className="cr-mouth" d="M-5.4 -0.4Q-2.7 4.4 0 0.2Q2.7 4.4 5.4 -0.4" transform={`translate(${face.mouth[0].toFixed(1)} ${face.mouth[1].toFixed(1)}) rotate(${face.mouthAngle})`} />
      </svg>
    </div>
  );
}
