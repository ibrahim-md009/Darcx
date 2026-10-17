import { useEffect, useRef, useState } from "react";
import { useApp } from "../context.jsx";

const Chevron = ({ left }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d={left ? "M12.5 4l-6 6 6 6" : "M7.5 4l6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Image slider: swipe / arrows / dots. `images` = list of paths relative to public/, e.g. "assets/img/a.jpg" */
export default function Carousel({ images, alt }) {
  const { t } = useApp();
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMany = images.length > 1;

  const isRtl = () => document.documentElement.dir === "rtl";

  const goToSlide = index => {
    const trackEl = trackRef.current; if (!trackEl) return;
    const target = Math.max(0, Math.min(images.length - 1, index));
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
  }, [images.length]);

  return (
    <div className="car">
      <div className="car-view">
        <div className="car-track" ref={trackRef}>
          {images.map((src, index) => (
            <div className="car-slide" key={src} aria-hidden={index !== activeIndex}>
              <img src={"/" + src} alt={alt + " " + (index + 1)} loading={index === 0 ? "eager" : "lazy"} draggable="false" />
            </div>
          ))}
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
          {images.map((_, index) => (
            <button key={index} type="button" role="tab" aria-selected={index === activeIndex} aria-label={t("c_goto") + " " + (index + 1)}
              className={"car-dot" + (index === activeIndex ? " on" : "")} onClick={() => goToSlide(index)} />
          ))}
        </div>
      )}
    </div>
  );
}
