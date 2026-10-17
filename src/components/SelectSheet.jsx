import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* Bottom-sheet picker used instead of a native <select> */
export default function SelectSheet({ label, options, value, onChange }) {
  const [isMounted, setIsMounted] = useState(false); /* sheet exists in the page */
  const [isOpen, setIsOpen] = useState(false);       /* sheet is slid up (drives the animation) */
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const selected = options.find(option => option.value === value) || options[0];

  const openSheet = () => {
    clearTimeout(closeTimer.current);
    setIsMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setIsOpen(true)));
  };
  const closeSheet = () => {
    setIsOpen(false);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setIsMounted(false), 450); /* wait for the slide-down animation */
  };

  useEffect(() => {
    if (!isMounted) return;
    document.body.classList.add("lock");
    const onKeyDown = event => { if (event.key === "Escape") closeSheet(); };
    addEventListener("keydown", onKeyDown);
    const focusTimer = setTimeout(() => {
      const panel = panelRef.current;
      const firstOption = panel && (panel.querySelector(".opt.on") || panel.querySelector(".opt"));
      if (firstOption) firstOption.focus({ preventScroll: true });
    }, 350);
    return () => { document.body.classList.remove("lock"); removeEventListener("keydown", onKeyDown); clearTimeout(focusTimer); };
  }, [isMounted]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  /* drag the grabber down to dismiss */
  const grab = useRef({ startY: null, offsetY: 0 });
  const onGrabDown = event => { grab.current.startY = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); panelRef.current.style.transition = "none"; };
  const onGrabMove = event => {
    if (grab.current.startY === null) return;
    grab.current.offsetY = Math.max(0, event.clientY - grab.current.startY);
    panelRef.current.style.transform = "translateY(" + grab.current.offsetY + "px)";
  };
  const onGrabEnd = () => {
    if (grab.current.startY === null) return;
    grab.current.startY = null;
    panelRef.current.style.transition = ""; panelRef.current.style.transform = "";
    if (grab.current.offsetY > 80) closeSheet();
    grab.current.offsetY = 0;
  };

  return (
    <div className="fld fld-s">
      <button type="button" className="sel" onClick={openSheet} aria-haspopup="dialog" aria-expanded={isMounted}>
        <span>{selected.label}</span>
        <svg className="chev" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <label>{label}</label>
      {isMounted && createPortal(
        <div className={"sheet" + (isOpen ? " open" : "")}>
          <div className="sheet-bg" onClick={closeSheet} />
          <div className="sheet-p" role="dialog" aria-modal="true" aria-label={label} ref={panelRef}>
            <div className="sheet-grab" onPointerDown={onGrabDown} onPointerMove={onGrabMove} onPointerUp={onGrabEnd} onPointerCancel={onGrabEnd}><i /></div>
            <h3>{label}</h3>
            <ul>
              {options.map((option, index) => (
                <li key={option.value} style={{ "--i": index }}>
                  <button type="button" className={"opt" + (option.value === value ? " on" : "")}
                    onClick={() => { onChange(option.value); setTimeout(closeSheet, 160); }}>
                    <span className="svc-dot" style={{ background: option.accent }} />
                    <span>{option.label}</span>
                    <i className="tick" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
