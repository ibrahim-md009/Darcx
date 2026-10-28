import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context.jsx";

const Chevron = ({ left }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d={left ? "M12.5 4l-6 6 6 6" : "M7.5 4l6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Close = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <rect x="3" y="3" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="11" y="3" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="11" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <rect x="11" y="11" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

/* the slider shows at most this many slides; "View all images" opens every image of the project in the viewer */
const MAX_SLIDES = 14;

const isRtl = () => document.documentElement.dir === "rtl";

/* ONE full-screen viewer, used both when an image is clicked and by "View all images".
   It only ever receives the images of the current project. Arrows are physical (the right button moves right on screen
   in both languages); swipe and keyboard follow the same rule. No wrap-around: the buttons disable at both ends. */
function Lightbox({ images, alt, start, onClose }) {
  const { t } = useApp();
  const total = images.length;
  const [index, setIndex] = useState(Math.max(0, Math.min(total - 1, start)));
  const [dir, setDir] = useState(0);
  const rtl = isRtl();
  const rootRef = useRef(null);
  const touch = useRef(null);

  const go = step => {
    const next = index + step;
    if (next < 0 || next > total - 1) return;
    setDir(step);
    setIndex(next);
  };
  const leftStep = rtl ? 1 : -1;

  /* lock page scroll while open, restore on close; return focus to what opened the viewer */
  useEffect(() => {
    const opener = document.activeElement;
    const body = document.body.style.overflow, root = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    rootRef.current && rootRef.current.querySelector(".lb-x").focus();
    return () => {
      document.body.style.overflow = body;
      document.documentElement.style.overflow = root;
      if (opener && opener.focus) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = event => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowLeft") go(leftStep);
      else if (event.key === "ArrowRight") go(-leftStep);
      else if (event.key === "Tab") {
        const focusable = [...rootRef.current.querySelectorAll("button:not([disabled])")];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  /* warm the neighbours so stepping through is instant */
  useEffect(() => {
    [index - 1, index + 1].forEach(i => { if (images[i]) new Image().src = "/" + images[i]; });
  }, [index, images]);

  const onTouchStart = event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; };
  const onTouchEnd = event => {
    const start = touch.current; touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0], dx = point.clientX - start.x, dy = point.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    go((rtl ? dx > 0 : dx < 0) ? 1 : -1);
  };

  const stop = event => event.stopPropagation();
  const prevLabel = t("c_prev"), nextLabel = t("c_next");

  return createPortal(
    <div className="lb" ref={rootRef} role="dialog" aria-modal="true" aria-label={t("c_all")} onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="lb-top">
        <span className="lb-count" dir="ltr" aria-live="polite">{index + 1} / {total}</span>
        <button type="button" className="lb-x" onClick={event => { stop(event); onClose(); }} aria-label={t("c_close")}><Close /></button>
      </div>
      <div className="lb-stage">
        <img key={index} className="lb-img" src={"/" + images[index]} alt={alt + " " + (index + 1)} draggable="false" onClick={stop}
          style={{ "--dx": dir * (rtl ? -22 : 22) + "px" }} />
      </div>
      {total > 1 && (
        <>
          <button type="button" className="lb-btn lb-l" disabled={index + leftStep < 0 || index + leftStep > total - 1}
            onClick={event => { stop(event); go(leftStep); }} aria-label={rtl ? nextLabel : prevLabel}><Chevron left /></button>
          <button type="button" className="lb-btn lb-r" disabled={index - leftStep < 0 || index - leftStep > total - 1}
            onClick={event => { stop(event); go(-leftStep); }} aria-label={rtl ? prevLabel : nextLabel}><Chevron /></button>
        </>
      )}
    </div>,
    document.body
  );
}

/* Image slider: swipe / arrows / dots. Clicking an image, or the "View all images" chip, opens the same Lightbox.
   `images` = list of paths relative to public/, e.g. "img/keo/a.webp" */
export default function Carousel({ images, alt }) {
  const { t } = useApp();
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerStart, setViewerStart] = useState(null); /* null = closed, otherwise the index it opens at */
  const shown = images.length > MAX_SLIDES ? images.slice(0, MAX_SLIDES) : images;
  const slideCount = shown.length;
  const hasMany = slideCount > 1;

  const goToSlide = index => {
    const trackEl = trackRef.current; if (!trackEl) return;
    const target = Math.max(0, Math.min(slideCount - 1, index));
    /* in RTL the browser counts scrollLeft as negative */
    trackEl.scrollTo({ left: (isRtl() ? -1 : 1) * target * trackEl.clientWidth, behavior: "smooth" });
  };

  /* arrows are physical: the right arrow moves right on screen in both languages */
  const stepTowardScreenSide = toScreenRight => {
    const forward = isRtl() ? -1 : 1;
    goToSlide(activeIndex + (toScreenRight ? forward : -forward));
  };

  /* keep activeIndex in sync while the visitor swipes / scrolls */
  useEffect(() => {
    const trackEl = trackRef.current; if (!trackEl) return;
    let frameId = 0;
    const onScroll = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setActiveIndex(Math.round(Math.abs(trackEl.scrollLeft) / trackEl.clientWidth)));
    };
    trackEl.addEventListener("scroll", onScroll, { passive: true });
    return () => { trackEl.removeEventListener("scroll", onScroll); cancelAnimationFrame(frameId); };
  }, [slideCount]);

  const openAt = index => setViewerStart(index);

  return (
    <div className="car">
      <div className="car-view">
        <div className="car-track" ref={trackRef}>
          {shown.map((src, index) => (
            <div className="car-slide" key={src} aria-hidden={index !== activeIndex}>
              <img src={"/" + src} alt={alt + " " + (index + 1)} loading={index === 0 ? "eager" : "lazy"} draggable="false"
                role="button" tabIndex={index === activeIndex ? 0 : -1} aria-label={t("c_open") + " " + (index + 1)}
                onClick={() => openAt(index)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openAt(index); } }} />
            </div>
          ))}
        </div>
        {hasMany && (
          <>
            <button type="button" className="car-btn car-l" onClick={() => stepTowardScreenSide(false)} aria-label={t(isRtl() ? "c_next" : "c_prev")}><Chevron left /></button>
            <button type="button" className="car-btn car-r" onClick={() => stepTowardScreenSide(true)} aria-label={t(isRtl() ? "c_prev" : "c_next")}><Chevron /></button>
          </>
        )}
        {images.length > 1 && (
          <button type="button" className="car-open" onClick={() => openAt(0)}>
            <GridIcon /><span>{t("c_all")}</span><b dir="ltr">{images.length}</b>
          </button>
        )}
      </div>
      {hasMany && (
        <div className="car-dots" role="tablist">
          {Array.from({ length: slideCount }, (_, index) => (
            <button key={index} type="button" role="tab" aria-selected={index === activeIndex} aria-label={t("c_goto") + " " + (index + 1)}
              className={"car-dot" + (index === activeIndex ? " on" : "")} onClick={() => goToSlide(index)} />
          ))}
        </div>
      )}
      {viewerStart !== null && <Lightbox images={images} alt={alt} start={viewerStart} onClose={() => setViewerStart(null)} />}
    </div>
  );
}
