import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, CtaBand, ServiceCard } from "../components/ui.jsx";
import ProjectShowcase from "../components/ProjectShowcase.jsx";

export default function Home() {
  const { t, localize, data } = useApp();
  const showcase = data.showcase
    .map(entry => ({ project: data.projects.find(project => project.slug === entry.slug), shots: entry.shots }))
    .filter(entry => entry.project);
  const featured = data.packages.find(pack => pack.id === data.featuredPackage);
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
          <div className="grid4">{data.services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-h rv">
            <div><h2>{t("home_projects_t")}</h2><p>{t("home_projects_p")}</p></div>
            <Link className="link" to="/projects">{t("all_projects")}<Arrow /></Link>
          </div>
          <ProjectShowcase items={showcase} />
        </div>
      </section>

      {featured && (
        <section className="sec pkb-sec">
          <div className="wrap">
            <div className="pkb rv">
              <div className="pkb-shapes" aria-hidden="true"><i /><i /></div>
              <div className="pkb-txt">
                <span className="pkb-label">{t("pkb_label")}</span>
                <h2>{t("pkb_t")}</h2>
                <p>{t("pkb_p")}</p>
              </div>
              <div className="pkb-offer">
                <span className="pkb-name">{localize(featured.name)}</span>
                <div className="pkb-price">
                  <s dir="ltr"><span className="sr">{t("pk_was")}: </span>{featured.currency}{featured.original}</s>
                  <b dir="ltr"><span className="sr">{t("pk_now")}: </span>{featured.currency}{featured.price}</b>
                </div>
                {featured.offer && <span className="pkb-note">{t("pk_offer")}</span>}
              </div>
              <Link className="btn pkb-cta" to="/services#packages">{t("pkb_cta")}<Arrow /></Link>
            </div>
          </div>
        </section>
      )}

      <CtaBand title={t("home_cta_t")} text={t("home_cta_p")} />
    </>
  );
}
