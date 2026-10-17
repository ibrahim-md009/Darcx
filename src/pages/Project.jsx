import { Link, useParams } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, CtaBand, PageHead, Preview } from "../components/ui.jsx";
import Carousel from "../components/Carousel.jsx";

export default function Project() {
  const { slug } = useParams();
  const { t, localize, data } = useApp();
  const projectIndex = data.projects.findIndex(item => item.slug === slug);
  if (projectIndex < 0) return <PageHead title={t("nf_t")} sub={t("nf_p")} />;
  const project = data.projects[projectIndex], nextProject = data.projects[(projectIndex + 1) % data.projects.length];
  return (
    <>
      <header className="phead dhead" style={{ "--ac": project.accent }}>
        <div className="wrap">
          <Link className="back" to="/projects"><Arrow />{t("d_back")}</Link>
          <span className="badge badge-ac rv">{localize(project.cat)}</span>
          <h1 className="rv" style={{ "--d": ".05s" }}>{localize(project.name)}</h1>
          <p className="rv" style={{ "--d": ".1s" }}>{localize(project.short)}</p>
          {project.link && (
            <a className="btn btn-fill dvisit rv" style={{ "--d": ".14s" }} href={project.link} target="_blank" rel="noopener noreferrer">{t("visit")}<Arrow /></a>
          )}
        </div>
      </header>

      <section className="sec dpre">
        <div className="wrap">
          {project.shots.length
            ? <div className="rv"><Carousel images={project.shots} alt={localize(project.name)} /></div>
            : <div className="dpv rv reveal-img" style={{ "--ac": project.accent }}><Preview project={project} big /></div>}
        </div>
      </section>

      <section className="sec dtxt" style={{ "--ac": project.accent }}>
        <div className="wrap dgrid">
          <div className="rv"><h2>{t("d_overview")}</h2><p className="lead">{localize(project.desc)}</p></div>
          <div className="rv" style={{ "--d": ".08s" }}>
            <h2>{t("d_features")}</h2>
            <ul className="ticks">{localize(project.features).map(feature => <li key={feature}>{feature}</li>)}</ul>
            {project.tech.length > 0 && (
              <>
                <h3 className="mini">{t("d_tech")}</h3>
                <div className="tags">{project.tech.map(tech => <span key={tech} className="tag" dir="ltr">{tech}</span>)}</div>
              </>
            )}
          </div>
        </div>
      </section>

      {project.dashShots.length > 0 && (
        <section className="sec dash">
          <div className="wrap">
            <h2 className="rv">{t("d_dash")}</h2>
            <div className="rv" style={{ "--d": ".06s" }}><Carousel images={project.dashShots} alt={localize(project.name) + " — " + t("d_dash")} /></div>
          </div>
        </section>
      )}

      <section className="band band-a" style={{ "--ac": project.accent }}>
        <div className="wrap ps">
          <div className="pbox rv"><span className="badge badge-ac">{t("d_problem")}</span><p>{localize(project.problem)}</p></div>
          <div className="pbox pbox-s rv" style={{ "--d": ".08s" }}><span className="badge badge-ac">{t("d_solution")}</span><p>{localize(project.solution)}</p></div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap next rv">
          <span>{t("d_next")}</span>
          <Link className="link big" to={"/projects/" + nextProject.slug}>{localize(nextProject.name)}<Arrow /></Link>
        </div>
      </section>

      <CtaBand title={t("d_cta_t")} text={t("d_cta_p")} />
    </>
  );
}
