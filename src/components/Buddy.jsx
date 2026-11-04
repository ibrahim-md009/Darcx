import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "../context.jsx";
import Alien from "./Alien.jsx";

/* The Darcx creature's round button, fixed at the bottom of every page.
   - on each page a notice pops out of it: "Did you know what this page does?" + an emoji (texts: data.js → buddy.tips)
   - tapping the button lets the creature climb out of it, wherever you are on the site, and answer with a sentence (data.js → buddy.replies)
   - tapping the creature again gets another sentence; tapping the button, outside, or pressing Esc sends it back in */

const TIP_DELAY = 2200;   // ms after arriving on a page until the notice pops out
const TIP_TIME = 9000;    // ms the notice stays
const OPEN_TIME = 10000;  // ms the creature stays out without being touched
const TALK_TIME = 1800;   // ms its mouth moves after a sentence

/* which entry of buddy.tips belongs to the current URL */
function tipKey(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (/^\/projects\/[^/]+$/.test(path)) return "project";
  return ["services", "projects", "about", "contact"].find(name => path === "/" + name) || "notfound";
}

export default function Buddy() {
  const { data, localize } = useApp();
  const { pathname } = useLocation();
  const key = tipKey(pathname);

  const [tipShown, setTipShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [say, setSay] = useState({ index: -1, n: 0 });
  const [talking, setTalking] = useState(false);
  const rootRef = useRef(null);
  const lastReply = useRef(-1);
  const closeTimer = useRef(0);
  const talkTimer = useRef(0);

  /* a new page: send the creature back in, then let the page's notice pop out after a moment */
  useEffect(() => {
    setOpen(false);
    setTipShown(false);
    const show = setTimeout(() => setTipShown(true), TIP_DELAY);
    const hide = setTimeout(() => setTipShown(false), TIP_DELAY + TIP_TIME);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [pathname]);

  const speak = useCallback(() => {
    const replies = data.buddy.replies;
    let next = Math.floor(Math.random() * replies.length);
    if (replies.length > 1 && next === lastReply.current) next = (next + 1) % replies.length;
    lastReply.current = next;
    setSay(previous => ({ index: next, n: previous.n + 1 }));
    setTalking(true);
    clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setTalking(false), TALK_TIME);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), OPEN_TIME);
  }, [data]);

  const toggle = () => {
    setTipShown(false);
    if (open) { setOpen(false); return; }
    setOpen(true);
    speak();
  };

  /* outside tap / Esc send it back in; timers are cleaned up with the component */
  useEffect(() => {
    if (!open) { clearTimeout(closeTimer.current); return; }
    const onDown = event => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(talkTimer.current); }, []);

  const buddy = data.buddy;
  const tip = localize(buddy.tips[key]);
  const reply = say.index < 0 ? "" : localize(buddy.replies[say.index]);

  return (
    <div className="bd" ref={rootRef}>
      {/* the notice: "Did you know …?" */}
      <div className={"bd-tip" + (tipShown && !open ? " is-on" : "")} role="status" aria-live="polite">
        {tipShown && !open && (
          <>
            <button type="button" className="bd-tip-text" onClick={toggle}>{tip}</button>
            <button type="button" className="bd-tip-x" aria-label={localize(buddy.dismiss)} onClick={() => setTipShown(false)}>
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </>
        )}
      </div>
      {tipShown && !open && <span className="bd-dot" aria-hidden="true" />}

      {/* the creature, climbing out of the button */}
      <div className={"bd-pop" + (open ? " is-open" : "")} aria-hidden={!open}>
        <div className="bd-say" role="status" aria-live="polite">
          {open && <p key={say.n}>{reply}</p>}
        </div>
        <button type="button" className="bd-body" tabIndex={open ? 0 : -1} onClick={speak} aria-label={localize(buddy.label)}>
          <span key={say.n} className="bd-hop"><Alien variant="full" enabled={open} talking={talking} /></span>
        </button>
      </div>

      <button type="button" className={"bd-btn" + (open ? " is-open" : "")} onClick={toggle} aria-expanded={open} aria-label={localize(buddy.label)}>
        <span className="bd-face"><Alien variant="face" enabled={!open} /></span>
        <span className="bd-hole" aria-hidden="true">
          <svg viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </span>
      </button>
    </div>
  );
}
