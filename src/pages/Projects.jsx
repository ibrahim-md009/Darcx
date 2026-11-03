import { useState } from "react";
import { useApp } from "../context.jsx";
import { CtaBand, PageHead } from "../components/ui.jsx";
import ProjectShowcase, { buildShowcase } from "../components/ProjectShowcase.jsx";

export default function Projects() {
  const { t, data } = useApp();
  const [filter, setFilter] = useState("all");
  /* [value of project.kind, text key] */
  const chips = [["all", "f_all"], ["web", "f_web"], ["system", "f_sys"]];
  return (
    <>
      <PageHead title={t("p_page_t")} sub={t("p_page_p")} />
      <section className="sec">
        <div className="wrap">
          <div className="filters rv" role="group">
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
