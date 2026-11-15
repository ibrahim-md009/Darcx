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
          <div className="filters rv" role="group" ref={tabsRef}>
            <span className="pill" ref={pillRef} aria-hidden="true" />
            {chips.map(([kind, labelKey]) => (
              <button key={kind} className={"chipf" + (filter === kind ? " on" : "")} onClick={() => setFilter(kind)}>{t(labelKey)}</button>
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
