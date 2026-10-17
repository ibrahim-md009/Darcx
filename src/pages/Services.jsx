import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, CtaBand, PageHead, serviceIcons } from "../components/ui.jsx";

export default function Services() {
  const { t, localize, data } = useApp();
  return (
    <>
      <PageHead title={t("s_page_t")} sub={t("s_page_p")} />
      {data.services.map((service, index) => {
        const exampleProjects = service.examples.map(slug => data.projects.find(project => project.slug === slug)).filter(Boolean);
        return (
          <section key={service.id} className={"sec srow " + (index % 2 ? "band band-a" : "")} id={service.id} style={{ "--ac": service.accent }}>
            <div className="wrap srow-in">
              <div className="srow-txt rv">
                <span className="sicon">{serviceIcons[service.id]}</span>
                <h2>{localize(service.name)}</h2>
                <p className="lead">{localize(service.desc)}</p>
                <h3 className="mini">{t("s_includes")}</h3>
                <ul className="ticks">{localize(service.points).map(point => <li key={point}>{point}</li>)}</ul>
                <Link className="btn btn-fill" to={"/contact?service=" + service.id}>{t("s_ask")}<Arrow /></Link>
              </div>
              <div className="srow-vis rv" style={{ "--d": ".1s" }}>
                <div className="svis reveal-img"><i /><i /><i />{serviceIcons[service.id]}</div>
                {exampleProjects.length > 0 && (
                  <>
                    <h3 className="mini">{t("s_examples")}</h3>
                    <div className="exlist">
                      {exampleProjects.map(project => (
                        <Link key={project.slug} className="ex" style={{ "--ac": project.accent }} to={"/projects/" + project.slug}>
                          <span className="dot" />{localize(project.name)}<Arrow />
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        );
      })}
      <CtaBand title={t("home_cta_t")} text={t("home_cta_p")} />
    </>
  );
}
