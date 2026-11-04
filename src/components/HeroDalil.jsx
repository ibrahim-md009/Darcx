import { useEffect, useRef, useState } from "react";
import { useApp } from "../context.jsx";
import Dalil from "./Dalil.jsx";
import { sfx } from "../lib/sfx.js";

/* Dalil's big head in the empty part of the home page's first screen. Desktop only: it is not even created on phones,
   tablets and small windows (the media query below).
   Interaction 1 (tickle): while the pointer moves over it, the head leans toward the pointer and wobbles, the eyes turn into
   laughing arcs, the mouth opens, the antenna flashes, a "hehehe" floats up and it giggles (sound, after the first tap on the site).
   When the pointer stops, it calms down; when it leaves, the head straightens up.
   Visuals: styles.css → "Dalil on the home page" */

const QUERY = "(min-width: 1024px) and (hover: hover)";
const CALM_AFTER = 420;   // ms without pointer movement until the laughing stops
const GIGGLE_EVERY = 260; // ms between giggle sounds while being tickled
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export default function HeroDalil() {
  const { data, localize } = useApp();
  const [show, setShow] = useState(() => matchMedia(QUERY).matches);
  const [laugh, setLaugh] = useState(false);
  const rootRef = useRef(null);
  const calmTimer = useRef(0);
  const lastGiggle = useRef(0);

  useEffect(() => {
    const query = matchMedia(QUERY);
    const update = () => setShow(query.matches);
    query.addEventListener("change", update);
    return () => { query.removeEventListener("change", update); clearTimeout(calmTimer.current); };
  }, []);

  if (!show) return null;

  const lean = event => {
    const box = rootRef.current.getBoundingClientRect();
    rootRef.current.style.setProperty("--lx", clamp((event.clientX - (box.left + box.width / 2)) / (box.width / 2), -1, 1).toFixed(2));
    rootRef.current.style.setProperty("--ly", clamp((event.clientY - (box.top + box.height / 2)) / (box.height / 2), -1, 1).toFixed(2));
  };
  const onMove = event => {
    lean(event);
    setLaugh(true);
    clearTimeout(calmTimer.current);
    calmTimer.current = setTimeout(() => setLaugh(false), CALM_AFTER);
    const now = performance.now();
    if (now - lastGiggle.current > GIGGLE_EVERY) { lastGiggle.current = now; sfx.giggle(); }
  };
  const onLeave = () => {
    clearTimeout(calmTimer.current);
    setLaugh(false);
    rootRef.current.style.setProperty("--lx", "0");
    rootRef.current.style.setProperty("--ly", "0");
  };

  return (
    <div className={"hd" + (laugh ? " is-laugh" : "")} ref={rootRef} aria-hidden="true" onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="hd-glow" />
      <div className="hd-lean">
        <div className="hd-wob">
          <Dalil mood={laugh ? "laugh" : "calm"} className="hd-svg" />
        </div>
      </div>
      <span className="hd-ha">{localize(data.buddy.laugh)}</span>
    </div>
  );
}
