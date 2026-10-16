import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, CtaBand, ProjectCard, ServiceCard } from "../components/ui.jsx";

export default function Home() {
  const { t, D } = useApp();
  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-txt">
            <h1><span className="ln"><span>{t("h_title")}</span></span></h1>
            <p className="lead fade">{t("h_sub")}</p>
            <div className="btns fade">
              <Link className="btn btn-fill" to="/contact">{t("cta")}<Arrow /></Link>
              <Link className="btn btn-line" to="/projects">{t("h_cta2")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band band-sand">
        <div className="wrap">
          <div className="sec-h rv">
            <div><h2>{t("home_services_t")}</h2><p>{t("home_services_p")}</p></div>
            <Link className="link" to="/services">{t("all_services")}<Arrow /></Link>
          </div>
          <div className="grid4">{D.services.map((s, i) => <ServiceCard key={s.id} s={s} i={i} />)}</div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-h rv">
            <div><h2>{t("home_projects_t")}</h2><p>{t("home_projects_p")}</p></div>
            <Link className="link" to="/projects">{t("all_projects")}<Arrow /></Link>
          </div>
          <div className="grid2">{D.projects.map((p, i) => <ProjectCard key={p.slug} p={p} i={i} />)}</div>
        </div>
      </section>

      <CtaBand title={t("home_cta_t")} text={t("home_cta_p")} />
    </>
  );
}
