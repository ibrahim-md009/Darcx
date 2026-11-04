import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context.jsx";
import Dalil from "./Dalil.jsx";
import { isMuted, setMuted, sfx, unlock } from "../lib/sfx.js";
import { makeGuide } from "../lib/guide.js";
import { Flyer } from "../lib/flyer.js";

/* Dalil (دليل), the site's little guide: a round button fixed at the bottom of every page.
   - on each page a notice pops out of it: "Did you know what this page does?" + an emoji (data.js → buddy.tips)
   - tapping the button opens a small chat: the visitor types (or taps) a short question about the site and Dalil answers
     (lib/guide.js builds the answers from data.js: packages, extras, every project and buddy.faq; answers can open a page, a link or WhatsApp)
   - sound effects: lib/sfx.js (can be muted from the panel) */

const TIP_DELAY = 2200;  // ms after arriving on a page until the notice pops out
const TIP_TIME = 9000;   // ms the notice stays
const THINK_TIME = 750;  // ms Dalil "types" before answering
const TALK_TIME = 1400;  // ms its mouth moves after an answer
const MAX_MESSAGES = 40;

/* which entry of buddy.tips belongs to the current URL */
function tipKey(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (/^\/projects\/[^/]+$/.test(path)) return "project";
  return ["services", "projects", "about", "contact"].find(name => path === "/" + name) || "notfound";
}

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const ICON_X = "M6 6l12 12M18 6L6 18";
const ICON_SEND = "M4 12l16-8-6 16-2.6-6.4L4 12z";
const ICON_SOUND_ON = "M4 9v6h4l5 4V5L8 9H4zM17 8.5a5 5 0 010 7M19.5 6a8.5 8.5 0 010 12";
const ICON_SOUND_OFF = "M4 9v6h4l5 4V5L8 9H4zM17 9.5l5 5M22 9.5l-5 5";

export default function Buddy() {
  const { data, localize, lang } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const buddy = data.buddy;
  const guide = useMemo(() => makeGuide(data, lang), [data, lang]);
  const key = tipKey(pathname);

  const [tipShown, setTipShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);   // { id, from: "me" | "bot", text? (mine), reply? (Dalil: { text, acts, follow }), typing? }
  const [talking, setTalking] = useState(false);
  const [draft, setDraft] = useState("");
  const [muted, setMutedState] = useState(isMuted());
  const [away, setAway] = useState(false);     // the head is out travelling: the dock button is empty
  const rootRef = useRef(null);
  const flyRef = useRef(null);
  const flyer = useRef(null);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const nextId = useRef(1);
  const timers = useRef(new Set());

  const later = useCallback((fn, ms) => {
    const id = setTimeout(() => { timers.current.delete(id); fn(); }, ms);
    timers.current.add(id);
    return id;
  }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);

  /* the first tap anywhere lets the browser play sound */
  useEffect(() => {
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  /* ---------- the head travels with the visitor ----------
     Every page change: the little head flies from the page's tab in the bottom bar to the new page's heading, hops there,
     says hello, and flies back to its place. When Dalil's own button took the visitor there, the trip starts earlier:
     the head leaves the chat, flies to the tab, "presses" it, the page changes, and the same trip continues. */
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const dockPoint = () => centre(rootRef.current.querySelector(".bd-btn"));
  const tabPoint = path => {
    const links = [...document.querySelectorAll(".bnav a[href]")].filter(a => {
      const href = a.getAttribute("href");
      return href === path || (href !== "/" && path.startsWith(href + "/"));
    });
    links.sort((a, b) => b.getAttribute("href").length - a.getAttribute("href").length);
    return links[0] ? centre(links[0].querySelector("svg") || links[0]) : null;
  };
  /* beside the page's main heading (above it when the text fills the width), kept clear of the bars */
  const landingPoint = () => {
    const heading = document.querySelector("main h1") || document.querySelector("main h2");
    const topBar = document.querySelector(".nav")?.offsetHeight || 64;
    const bottomBar = document.querySelector(".bnav")?.offsetHeight || 0;
    const minY = topBar + 36, maxY = innerHeight - bottomBar - 110;
    if (!heading) return { x: innerWidth / 2, y: Math.min(maxY, Math.max(minY, 140)) };
    const range = document.createRange();
    range.selectNodeContents(heading);
    const box = range.getBoundingClientRect();
    const rtl = getComputedStyle(heading).direction === "rtl";
    const x = rtl ? box.left - 40 : box.right + 40;
    const y = Math.min(maxY, Math.max(minY, box.top + box.height / 2));
    if (x > 34 && x < innerWidth - 34) return { x, y };
    return { x: rtl ? box.right - 30 : box.left + 30, y: Math.min(maxY, Math.max(minY, box.top - 34)) };
  };

  const guided = useRef(false);      // the trip was started by a button in the chat
  const firstPage = useRef(true);
  const tipTimers = useRef([]);
  const showTipLater = delay => {
    tipTimers.current.forEach(clearTimeout);
    tipTimers.current = [
      setTimeout(() => { setTipShown(true); sfx.notice(); }, delay),
      setTimeout(() => setTipShown(false), delay + TIP_TIME),
    ];
  };

  useEffect(() => {
    flyer.current = new Flyer(flyRef.current);
    return () => { flyer.current.stop(); tipTimers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    const f = flyer.current;
    setOpen(false);
    setTipShown(false);
    if (firstPage.current || reduce()) {
      firstPage.current = false;
      guided.current = false;
      f.stop(); f.hide(); setAway(false);
      showTipLater(TIP_DELAY);
      return;
    }
    let alive = true;
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 180)); // the new page has drawn
      if (!alive) return;
      const comesFromChat = guided.current;
      guided.current = false;
      if (!comesFromChat) {
        const start = tabPoint(pathname) || dockPoint();
        f.show(start, 1);
        setAway(true);
        sfx.go();
      }
      const landed = await f.move(landingPoint(), { ms: 850, lift: 90, scale: 1.25 });
      if (!landed || !alive) return;
      setTalking(true);
      sfx.talk(16);
      await f.hop(2, 460);
      setTalking(false);
      if (!alive) return;
      const home = await f.move(dockPoint(), { ms: 700, lift: 70, scale: 1 });
      if (!home || !alive) return;
      f.hide();
      setAway(false);
      sfx.pop();
      showTipLater(500);
    })();
    return () => {
      alive = false;
      setTalking(false);
      if (!guided.current) { f.stop(); f.hide(); setAway(false); } // a trip that Dalil started keeps flying across the page change
      tipTimers.current.forEach(clearTimeout);
    };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  /* the id is taken here, not inside the state updater (which React runs later), so the caller can find the message again */
  const push = useCallback(message => {
    const id = nextId.current++;
    setMessages(list => [...list, { id, ...message }].slice(-MAX_MESSAGES));
    return id;
  }, []);

  /* greeting the first time the panel opens */
  const greeted = useRef(false);
  useEffect(() => {
    if (open && !greeted.current) { greeted.current = true; push({ from: "bot", reply: { text: localize(buddy.hello), acts: [], follow: [] } }); sfx.hello(); }
  }, [open, push]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (away) return;
    unlock();
    setTipShown(false);
    setOpen(wasOpen => {
      (wasOpen ? sfx.close : sfx.open)();
      return !wasOpen;
    });
  };
  const close = () => { if (open) { sfx.close(); setOpen(false); } };

  /* outside tap / Esc close the panel */
  useEffect(() => {
    if (!open) return;
    const onDown = event => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    if (matchMedia("(hover: hover)").matches) inputRef.current?.focus({ preventScroll: true }); // no keyboard pop-up on phones
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  /* newest message in view */
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [messages, open]);

  const ask = question => {
    const text = question.trim().slice(0, 140);
    if (!text) return;
    unlock();
    push({ from: "me", text });
    setDraft("");
    sfx.send();
    const typingId = push({ from: "bot", typing: true });
    later(sfx.think, 120);
    later(() => {
      const answer = guide.reply(text);
      const failed = answer.text === localize(buddy.fallback);
      setMessages(list => list.map(m => m.id === typingId ? { id: typingId, from: "bot", reply: answer } : m));
      if (failed) sfx.oops(); else { sfx.reply(); sfx.talk(answer.text.length); }
      if (answer.follow.length) later(sfx.pop, 450);
      setTalking(true);
      later(() => setTalking(false), Math.min(TALK_TIME + answer.text.length * 12, 2600));
    }, THINK_TIME);
  };
  const tapAsk = question => { sfx.tap(); ask(question); };

  const go = async to => {
    sfx.go();
    if (to === pathname) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const f = flyer.current, tab = tabPoint(to);
    setOpen(false);
    if (!tab || reduce()) { navigate(to); return; }
    f.stop();
    f.show(dockPoint(), 1);
    setAway(true);
    const arrived = await f.move(tab, { ms: 650, lift: 70, scale: 1.1 });
    if (!arrived) return;
    await f.press();
    guided.current = true;
    navigate(to);
  };
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) { unlock(); sfx.on(); }
  };

  const whatsapp = data.contact?.whatsapp;
  const tip = localize(buddy.tips[key]);
  const chips = guide.chips();

  return (
    <div className="bd" ref={rootRef}>
      {/* the head that travels between pages (moved by lib/flyer.js) */}
      <div className="bd-fly" ref={flyRef} hidden aria-hidden="true"><Dalil enabled={away} talking={talking} /></div>
      {/* the notice: "Did you know …?" */}
      <div className={"bd-tip" + (tipShown && !open ? " is-on" : "")} role="status" aria-live="polite">
        {tipShown && !open && (
          <>
            <button type="button" className="bd-tip-text" onClick={toggle}>{tip}</button>
            <button type="button" className="bd-tip-x" aria-label={localize(buddy.dismiss)} onClick={() => setTipShown(false)}><Icon d={ICON_X} /></button>
          </>
        )}
      </div>
      {tipShown && !open && <span className="bd-dot" aria-hidden="true" />}

      {/* the chat panel, growing out of the button */}
      <section className={"bd-panel" + (open ? " is-open" : "")} aria-hidden={!open} aria-label={localize(buddy.name)} inert={!open ? "" : undefined}>
        <header className="bd-head">
          <span className="bd-av"><Dalil enabled={open} talking={talking} /></span>
          <span className="bd-who"><b>{localize(buddy.name)}</b><small>{localize(buddy.status)}</small></span>
          <button type="button" className="bd-ic" onClick={toggleSound} aria-pressed={muted} aria-label={localize(muted ? buddy.soundOff : buddy.soundOn)}>
            <Icon d={muted ? ICON_SOUND_OFF : ICON_SOUND_ON} />
          </button>
          <button type="button" className="bd-ic" onClick={close} aria-label={localize(buddy.close)}><Icon d={ICON_X} /></button>
        </header>

        <div className="bd-log" ref={logRef} role="log" aria-live="polite">
          {messages.map(m => (
            <div key={m.id} className={"bd-msg " + (m.from === "me" ? "is-me" : "is-bot")}>
              {m.typing ? (
                <p className="bd-typing" aria-label="…"><i /><i /><i /></p>
              ) : (
                <>
                  <p>{m.reply ? m.reply.text : m.text}</p>
                  {m.reply?.acts?.length > 0 && (
                    <span className="bd-acts">
                      {m.reply.acts.map(act => act.to
                        ? <button key={act.label} type="button" className="bd-act" onClick={() => go(act.to)}>{act.label}</button>
                        : <a key={act.label} className="bd-act" href={act.href} target="_blank" rel="noopener noreferrer" onClick={sfx.go}>{act.label}</a>)}
                    </span>
                  )}
                  {m.reply?.follow?.length > 0 && (
                    <span className="bd-acts bd-follow">
                      {m.reply.follow.map(item => <button key={item.label} type="button" onClick={() => tapAsk(item.ask)}>{item.label}</button>)}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="bd-chips">
          {chips.map(question => <button key={question} type="button" onClick={() => tapAsk(question)}>{question}</button>)}
        </div>

        <form className="bd-form" onSubmit={event => { event.preventDefault(); ask(draft); }}>
          <input ref={inputRef} value={draft} onChange={event => { setDraft(event.target.value); sfx.key(); }} maxLength={140} enterKeyHint="send"
            placeholder={localize(buddy.placeholder)} aria-label={localize(buddy.placeholder)} autoComplete="off" />
          <button type="submit" className="bd-send" aria-label={localize(buddy.send)} disabled={!draft.trim()}><Icon d={ICON_SEND} /></button>
        </form>
      </section>

      <button type="button" className={"bd-btn" + (open ? " is-open" : "") + (away ? " is-away" : "")} onClick={toggle} aria-expanded={open} aria-label={localize(buddy.label)}>
        <span className="bd-face"><Dalil enabled={!open && !away} /></span>
        <span className="bd-hole" aria-hidden="true"><Icon d={ICON_X} /></span>
      </button>
    </div>
  );
}
