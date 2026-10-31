import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";

export const Arrow = () => (
  <svg className="arr" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Logo = ({ className = "mark" }) => (
  <img className={className} src="/assets/logo/darcx-monogram.webp" alt="DARCX" width="584" height="339" decoding="async" />
);

const makeIcon = (children) => <svg viewBox="0 0 48 48">{children}</svg>;
const outline = { fill: "none", stroke: "currentColor", strokeWidth: 2.4 };
export const serviceIcons = {
  websites: makeIcon(<><rect x="6" y="9" width="36" height="30" rx="5" {...outline} /><path d="M6 17h36" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="13" r="1.3" fill="currentColor" /><circle cx="17" cy="13" r="1.3" fill="currentColor" /></>),
  dashboards: makeIcon(<><rect x="6" y="8" width="36" height="32" rx="5" {...outline} /><path d="M16 33V24M24 33V16M32 33V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>),
  mobile: makeIcon(<><rect x="14" y="5" width="20" height="38" rx="5" {...outline} /><path d="M21 37h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>),
  systems: makeIcon(<><rect x="7" y="7" width="14" height="14" rx="4" {...outline} /><rect x="27" y="7" width="14" height="14" rx="4" {...outline} /><rect x="7" y="27" width="14" height="14" rx="4" {...outline} /><circle cx="34" cy="34" r="7" {...outline} /></>)
};

/* generated preview used until real screenshots are added to data.js */
export function Preview({ project, big }) {
  const { localize } = useApp();
  if (project.shots && project.shots[0])
    return <div className="pv pv-img" style={{ "--ac": project.accent }}><img src={"/" + project.shots[0]} alt={localize(project.name)} loading="lazy" /></div>;
  const isWebProject = project.kind === "web";
  return (
    <div className={"pv " + (isWebProject ? "pv-web" : "pv-sys") + (big ? " pv-big" : "")} style={{ "--ac": project.accent }}>
      <div className="pv-bar"><i /><i /><i /></div>
      <div className="pv-body">
        {isWebProject ? (
          <>
            <div className="pv-hero"><b>{localize(project.name)}</b><span /><span /></div>
            <div className="pv-row"><u /><u /><u /></div>
          </>
        ) : (
          <>
            <div className="pv-side"><u /><u /><u /><u /></div>
            <div className="pv-main">
              <div className="pv-stats"><u /><u /><u /></div>
              <div className="pv-chart">
                {[42, 68, 52, 86, 60, 74].map((barHeight, index) => <s key={index} style={{ "--h": barHeight + "%" }} />)}
              </div>
            </div>
          </>
        )}
      </div>
      <em className="pv-shape" aria-hidden="true" />
    </div>
  );
}

const ExtIcon = () => (
  <svg className="ext" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M6 14L14 6M7.5 6H14v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ProjectCard({ project, index }) {
  const { localize, t } = useApp();
  return (
    <article className="pcard rv" style={{ "--ac": project.accent, "--d": index * 0.07 + "s" }}>
      <div className="pcard-pv reveal-img"><Preview project={project} /></div>
      <div className="pcard-b">
        <span className="badge">{localize(project.cat)}</span>
        <h3>{localize(project.name)}</h3>
        <p>{localize(project.short)}</p>
      </div>
      <div className="pcard-act">
        {/* the whole card is clickable through this link (stretched), the visit button sits above it */}
        <Link className="pcard-more" to={"/projects/" + project.slug}>{t("more")}<Arrow /></Link>
        {project.link && (
          <a className="pcard-visit" href={project.link} target="_blank" rel="noopener noreferrer">
            <span>{t(project.linkLabel || "visit")}</span><ExtIcon />
          </a>
        )}
      </div>
    </article>
  );
}

export function ServiceCard({ service, index }) {
  const { localize } = useApp();
  return (
    <Link className="scard rv" style={{ "--ac": service.accent, "--d": index * 0.07 + "s" }} to={"/services#" + service.id}>
      <span className="sicon">{serviceIcons[service.id]}</span>
      <h3>{localize(service.name)}</h3>
      <p>{localize(service.desc)}</p>
    </Link>
  );
}

export function PageHead({ title, sub }) {
  return (
    <header className="phead">
      <div className="wrap">
        <div className="phead-shapes" aria-hidden="true"><i /><i /><i /></div>
        <h1 className="rv">{title}</h1>
        <p className="rv" style={{ "--d": ".08s" }}>{sub}</p>
      </div>
    </header>
  );
}

export function CtaBand({ title, text }) {
  const { t } = useApp();
  return (
    <section className="band band-dark cta">
      <div className="wrap cta-in">
        <div className="cta-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="rv"><h2>{title}</h2><p>{text}</p></div>
        <Link className="btn btn-sage rv" style={{ "--d": ".1s" }} to="/contact">{t("cta")}<Arrow /></Link>
      </div>
    </section>
  );
}
