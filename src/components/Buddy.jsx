import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context.jsx";
import Dalil from "./Dalil.jsx";
import { isMuted, setMuted, sfx, unlock } from "../lib/sfx.js";

/* Dalil (دليل), the site's little guide: a round button fixed at the bottom of every page.
   - on each page a notice pops out of it: "Did you know what this page does?" + an emoji (data.js → buddy.tips)
   - tapping the button opens a small chat: the visitor types (or taps) a short question about the site and Dalil answers
     (data.js → buddy.faq; answers can open a page or WhatsApp)
   - sound effects: lib/sfx.js (can be muted from the panel) */

const TIP_DELAY = 2200;  // ms after arriving on a page until the notice pops out
const TIP_TIME = 9000;   // ms the notice stays
const THINK_TIME = 750;  // ms Dalil "types" before answering
const TALK_TIME = 1400;  // ms its mouth moves after an answer
const MAX_MESSAGES = 40;

/* makes Arabic and English comparable: no diacritics, one spelling of alef / yaa / taa marbuta, lower case, no punctuation */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* the best matching faq entry for a question, or null */
function findAnswer(question, faq) {
  const text = normalize(question);
  if (!text) return null;
  const words = text.split(" ");
  let best = null, bestScore = 0;
  for (const entry of faq) {
    let score = 0;
    for (const raw of entry.keys) {
      const key = normalize(raw);
      const wholeWord = key.length <= 2 || (/^[a-z ]+$/.test(key) && key.length <= 3);
      if (wholeWord ? words.includes(key) : text.includes(key)) score += key.length > 3 ? 2 : 1;
    }
    if (score > bestScore) { best = entry; bestScore = score; }
  }
  return best;
}

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
  const { data, localize } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const buddy = data.buddy;
  const key = tipKey(pathname);

  const [tipShown, setTipShown] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);   // { id, from: "me" | "bot", text?, entry?, typing? }
  const [talking, setTalking] = useState(false);
  const [draft, setDraft] = useState("");
  const [muted, setMutedState] = useState(isMuted());
  const rootRef = useRef(null);
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

  /* a new page: close the panel, then let this page's notice pop out after a moment */
  useEffect(() => {
    setOpen(false);
    setTipShown(false);
    const show = setTimeout(() => { setTipShown(true); sfx.notice(); }, TIP_DELAY);
    const hide = setTimeout(() => setTipShown(false), TIP_DELAY + TIP_TIME);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [pathname]);

  /* the id is taken here, not inside the state updater (which React runs later), so the caller can find the message again */
  const push = useCallback(message => {
    const id = nextId.current++;
    setMessages(list => [...list, { id, ...message }].slice(-MAX_MESSAGES));
    return id;
  }, []);

  /* greeting the first time the panel opens */
  const greeted = useRef(false);
  useEffect(() => {
    if (open && !greeted.current) { greeted.current = true; push({ from: "bot", text: "hello" }); }
  }, [open, push]);

  const toggle = () => {
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
      const entry = findAnswer(text, buddy.faq);
      setMessages(list => list.map(m => m.id === typingId ? { id: typingId, from: "bot", ...(entry ? { entry } : { text: "fallback" }) } : m));
      sfx.reply();
      setTalking(true);
      later(() => setTalking(false), TALK_TIME);
    }, THINK_TIME);
  };

  const go = to => { setOpen(false); navigate(to); };
  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (!next) { unlock(); sfx.reply(); }
  };

  const whatsapp = data.contact?.whatsapp;
  const tip = localize(buddy.tips[key]);
  const chips = buddy.faq.filter(entry => entry.q);

  return (
    <div className="bd" ref={rootRef}>
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
                  <p>{m.entry ? localize(m.entry.a) : m.from === "me" ? m.text : localize(buddy[m.text])}</p>
                  {(m.entry?.go || (m.entry?.wa && whatsapp)) && (
                    <span className="bd-acts">
                      {m.entry.go && <button type="button" className="bd-act" onClick={() => go(m.entry.go.to)}>{localize(m.entry.go.label)}</button>}
                      {m.entry.wa && whatsapp && (
                        <a className="bd-act" href={"https://wa.me/" + whatsapp} target="_blank" rel="noopener noreferrer">{localize(buddy.waLabel)}</a>
                      )}
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="bd-chips">
          {chips.map(entry => <button key={localize(entry.q)} type="button" onClick={() => ask(localize(entry.q))}>{localize(entry.q)}</button>)}
        </div>

        <form className="bd-form" onSubmit={event => { event.preventDefault(); ask(draft); }}>
          <input ref={inputRef} value={draft} onChange={event => setDraft(event.target.value)} maxLength={140} enterKeyHint="send"
            placeholder={localize(buddy.placeholder)} aria-label={localize(buddy.placeholder)} autoComplete="off" />
          <button type="submit" className="bd-send" aria-label={localize(buddy.send)} disabled={!draft.trim()}><Icon d={ICON_SEND} /></button>
        </form>
      </section>

      <button type="button" className={"bd-btn" + (open ? " is-open" : "")} onClick={toggle} aria-expanded={open} aria-label={localize(buddy.label)}>
        <span className="bd-face"><Dalil enabled={!open} /></span>
        <span className="bd-hole" aria-hidden="true"><Icon d={ICON_X} /></span>
      </button>
    </div>
  );
}
