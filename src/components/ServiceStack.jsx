import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, serviceIcons } from "./ui.jsx";

/* "What we build": the four services as cards that pile up while you scroll.
   Each card sticks under the header a little lower than the one before it (CSS: position sticky), so the next card slides over it.
   A tiny scroll handler tells every card how far the next one has covered it (--p, 0 to 1): it shrinks and dims a touch, which gives the pile its depth.
   Reduced motion: the cards just stay in a normal column (no sticky, no scaling). */
export default function ServiceStack() {
  const { t, localize, data } = useApp();
  const listRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = [...list.children];
    let raf = 0;
    const update = () => {
      raf = 0;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        const stick = parseFloat(getComputedStyle(next).top) || 0;   // where the next card comes to rest
        const gap = next.getBoundingClientRect().top - stick;         // how far it still has to travel
        const covered = Math.min(1, Math.max(0, 1 - gap / card.offsetHeight));
        card.style.setProperty("--p", covered.toFixed(3));
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [data]);

  return (
    <section className="band band-sand stk-sec">
      <div className="wrap stk-in">
        <div className="stk-head rv">
          <h2>{t("home_services_t")}</h2>
          <p>{t("home_services_p")}</p>
          <Link className="link" to="/services">{t("all_services")}<Arrow /></Link>
        </div>
        <div className="stk" ref={listRef}>
          {data.services.map((service, index) => (
            <Link key={service.id} className="stk-card" style={{ "--ac": service.accent, "--i": index }} to={"/services#" + service.id}>
              <span className="stk-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="sicon">{serviceIcons[service.id]}</span>
              <h3>{localize(service.name)}</h3>
              <p>{localize(service.desc)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
