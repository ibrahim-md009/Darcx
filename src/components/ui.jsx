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

const svg = (children) => <svg viewBox="0 0 48 48">{children}</svg>;
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2.4 };
export const serviceIcons = {
  websites: svg(<><rect x="6" y="9" width="36" height="30" rx="5" {...S} /><path d="M6 17h36" stroke="currentColor" strokeWidth="2.4" /><circle cx="12" cy="13" r="1.3" fill="currentColor" /><circle cx="17" cy="13" r="1.3" fill="currentColor" /></>),
  dashboards: svg(<><rect x="6" y="8" width="36" height="32" rx="5" {...S} /><path d="M16 33V24M24 33V16M32 33V21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>),
  mobile: svg(<><rect x="14" y="5" width="20" height="38" rx="5" {...S} /><path d="M21 37h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></>),
  systems: svg(<><rect x="7" y="7" width="14" height="14" rx="4" {...S} /><rect x="27" y="7" width="14" height="14" rx="4" {...S} /><rect x="7" y="27" width="14" height="14" rx="4" {...S} /><circle cx="34" cy="34" r="7" {...S} /></>)
};

/* generated preview used until real screenshots are added to data.js */
export function Preview({ p, big }) {
  const { L } = useApp();
  if (p.shots && p.shots[0])
    return <div className="pv pv-img" style={{ "--ac": p.accent }}><img src={"/" + p.shots[0]} alt={L(p.name)} loading="lazy" /></div>;
  const web = p.kind === "web";
  return (
    <div className={"pv " + (web ? "pv-web" : "pv-sys") + (big ? " pv-big" : "")} style={{ "--ac": p.accent }}>
      <div className="pv-bar"><i /><i /><i /></div>
      <div className="pv-body">
        {web ? (
          <>
            <div className="pv-hero"><b>{L(p.name)}</b><span /><span /></div>
            <div className="pv-row"><u /><u /><u /></div>
          </>
        ) : (
          <>
            <div className="pv-side"><u /><u /><u /><u /></div>
            <div className="pv-main">
              <div className="pv-stats"><u /><u /><u /></div>
              <div className="pv-chart">
                {[42, 68, 52, 86, 60, 74].map((h, i) => <s key={i} style={{ "--h": h + "%" }} />)}
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

export function ProjectCard({ p, i }) {
  const { L, t } = useApp();
  return (
    <article className="pcard rv" style={{ "--ac": p.accent, "--d": i * 0.07 + "s" }}>
      <div className="pcard-pv reveal-img"><Preview p={p} /></div>
      <div className="pcard-b">
        <span className="badge">{L(p.cat)}</span>
        <h3>{L(p.name)}</h3>
        <p>{L(p.short)}</p>
      </div>
      <div className="pcard-act">
        {/* the whole card is clickable through this link (stretched), the visit button sits above it */}
        <Link className="pcard-more" to={"/projects/" + p.slug}>{t("more")}<Arrow /></Link>
        {p.link && (
          <a className="pcard-visit" href={p.link} target="_blank" rel="noopener noreferrer">
            <span>{t("visit")}</span><ExtIcon />
          </a>
        )}
      </div>
    </article>
  );
}

export function ServiceCard({ s, i }) {
  const { L } = useApp();
  return (
    <Link className="scard rv" style={{ "--ac": s.accent, "--d": i * 0.07 + "s" }} to={"/services#" + s.id}>
      <span className="sicon">{serviceIcons[s.id]}</span>
      <h3>{L(s.name)}</h3>
      <p>{L(s.desc)}</p>
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
