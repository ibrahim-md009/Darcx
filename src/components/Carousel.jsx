import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context.jsx";

const Chevron = ({ left }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d={left ? "M12.5 4l-6 6 6 6" : "M7.5 4l6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* above this many images the slider stops at MAX_SLIDES and ends with a round "view all" button */
const MAX_SLIDES = 14;

const Close = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* Full-screen gallery: every image stacked vertically, scrolls inside the overlay */
function Gallery({ images, alt, onClose }) {
  const { t } = useApp();
  useEffect(() => {
    const onKey = event => { if (event.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return createPortal(
    <div className="gal" role="dialog" aria-modal="true" aria-label={t("c_all")} onClick={onClose}>
      <button type="button" className="gal-x" onClick={onClose} aria-label={t("c_close")}><Close /></button>
      <div className="gal-list" onClick={event => event.stopPropagation()}>
        {images.map((src, index) => (
          <img key={src} src={"/" + src} alt={alt + " " + (index + 1)} loading="lazy" draggable="false" />
        ))}
      </div>
    </div>,
    document.body
  );
}

/* Image slider: swipe / arrows / dots. `images` = list of paths relative to public/, e.g. "assets/img/a.jpg" */
export default function Carousel({ images, alt }) {
  const { t } = useApp();
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const overflowing = images.length > MAX_SLIDES;
  const shown = overflowing ? images.slice(0, MAX_SLIDES) : images;
  const slideCount = shown.length + (overflowing ? 1 : 0); /* +1 = the "view all" slide */
  const hasMany = slideCount > 1;

  const isRtl = () => document.documentElement.dir === "rtl";

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

  return (
    <div className="car">
      <div className="car-view">
        <div className="car-track" ref={trackRef}>
          {shown.map((src, index) => (
            <div className="car-slide" key={src} aria-hidden={index !== activeIndex}>
              <img src={"/" + src} alt={alt + " " + (index + 1)} loading={index === 0 ? "eager" : "lazy"} draggable="false" />
            </div>
          ))}
          {overflowing && (
            <div className="car-slide car-more" aria-hidden={activeIndex !== shown.length}>
              <button type="button" className="car-all" onClick={() => setGalleryOpen(true)}>
                <span>{t("c_all")}</span>
                <small>{images.length}</small>
              </button>
            </div>
          )}
        </div>
        {hasMany && (
          <>
            <button type="button" className="car-btn car-l" onClick={() => stepTowardScreenSide(false)} aria-label={t(isRtl() ? "c_next" : "c_prev")}><Chevron left /></button>
            <button type="button" className="car-btn car-r" onClick={() => stepTowardScreenSide(true)} aria-label={t(isRtl() ? "c_prev" : "c_next")}><Chevron /></button>
          </>
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
      {galleryOpen && <Gallery images={images} alt={alt} onClose={() => setGalleryOpen(false)} />}
    </div>
  );
}
