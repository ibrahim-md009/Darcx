import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp } from "../context.jsx";
import { CtaBand, PageHead } from "../components/ui.jsx";
import ProjectShowcase, { buildShowcase } from "../components/ProjectShowcase.jsx";

export default function Projects() {
  const { t, data, lang } = useApp();
  const [filter, setFilter] = useState("all");
  /* [value of project.kind, text key] */
  const chips = [["all", "f_all"], ["web", "f_web"], ["system", "f_sys"]];
  /* the sliding capsule sits under the chosen tab: it is moved to that tab's place and size (and springs there, see .pill in styles.css) */
  const tabsRef = useRef(null);
  const pillRef = useRef(null);
  const first = useRef(true);
  const place = () => {
    const tab = tabsRef.current?.querySelector(".chipf.on"), pill = pillRef.current;
    if (!tab || !pill) return;
    pill.style.left = tab.offsetLeft + "px";
    pill.style.width = tab.offsetWidth + "px";
  };
  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (first.current) { pill.style.transition = "none"; place(); requestAnimationFrame(() => { pill.style.transition = ""; }); first.current = false; }
    else place();
  }, [filter, lang]);
  /* dragging: the capsule follows the finger / mouse; letting go picks the nearest tab (a plain tap still works through the buttons) */
  const [dragKind, setDragKind] = useState(null);
  const drag = useRef(null);
  const swallowClick = useRef(false);
  const nearest = x => {
    const tabs = [...tabsRef.current.querySelectorAll(".chipf")];
    let best = 0, bestGap = Infinity;
    tabs.forEach((tab, index) => { const box = tab.getBoundingClientRect(), gap = Math.abs(x - (box.left + box.width / 2)); if (gap < bestGap) { best = index; bestGap = gap; } });
    return chips[best][0];
  };
  const onDown = event => { if (event.pointerType === "mouse" && event.button !== 0) return; drag.current = { x: event.clientX, moved: false }; };
  const onMove = event => {
    const state = drag.current, pill = pillRef.current, box = tabsRef.current.getBoundingClientRect();
    if (!state) return;
    if (!state.moved) {
      if (Math.abs(event.clientX - state.x) < 8) return;
      state.moved = true;
      tabsRef.current.setPointerCapture(event.pointerId);
      pill.style.transition = "none";
    }
    const width = pill.offsetWidth;
    pill.style.left = Math.min(box.width - width - 4, Math.max(4, event.clientX - box.left - width / 2)) + "px";
    setDragKind(nearest(event.clientX));
  };
  const onUp = event => {
    const state = drag.current;
    drag.current = null;
    if (!state?.moved) return;
    swallowClick.current = true;
    pillRef.current.style.transition = "";
    const kind = nearest(event.clientX);
    setDragKind(null);
    if (kind === filter) place(); else setFilter(kind);
  };
  useEffect(() => {
    addEventListener("resize", place);
    (document.fonts?.ready ?? Promise.resolve()).then(place);
    return () => removeEventListener("resize", place);
  }, []);
  return (
    <>
      <PageHead title={t("p_page_t")} sub={t("p_page_p")} />
      <section className="sec">
        <div className="wrap">
          <div className="filters rv" role="group" ref={tabsRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onClickCapture={event => { if (swallowClick.current) { swallowClick.current = false; event.stopPropagation(); event.preventDefault(); } }}>
            <span className="pill" ref={pillRef} aria-hidden="true" />
            {chips.map(([kind, labelKey]) => (
              <button key={kind} className={"chipf" + ((dragKind ?? filter) === kind ? " on" : "")} onClick={() => setFilter(kind)}>{t(labelKey)}</button>
            ))}
          </div>
          {/* same design as the homepage showcase: two overlapping screenshots + title, description and links */}
          <div id="plist">
            <ProjectShowcase items={buildShowcase(data)} isVisible={project => filter === "all" || project.kind === filter} />
          </div>
        </div>
      </section>
      <CtaBand title={t("home_cta_t")} text={t("home_cta_p")} />
    </>
  );
}
