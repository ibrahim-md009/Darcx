import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, PageHead, serviceIcons } from "../components/ui.jsx";

/* Order of the page: 1 short introduction · 2 Our packages · 3 Additional services · 4 contact call to action.
   Prices, package features and extra services all come from data.js (packages / extras). */

function Price({ pack }) {
  const { t } = useApp();
  return (
    <div className="pk-price">
      <s className="pk-was" dir="ltr">
        <span className="sr">{t("pk_was")}: </span>{pack.currency}{pack.original}
      </s>
      <b className="pk-now" dir="ltr">
        <span className="sr">{t("pk_now")}: </span>{pack.currency}{pack.price}
      </b>
    </div>
  );
}

function PackageCard({ pack, index }) {
  const { t, localize } = useApp();
  const nameId = "pk-" + pack.id;
  return (
    <article className={"pk-card rv" + (pack.featured ? " is-feat" : "")} style={{ "--d": index * 0.08 + "s" }} aria-labelledby={nameId}>
      <header className="pk-head">
        <h3 id={nameId}>{localize(pack.name)}</h3>
        <p>{localize(pack.desc)}</p>
      </header>
      <Price pack={pack} />
      {pack.offer && <span className="pk-offer">{t("pk_offer")}</span>}
      <ul className="ticks pk-list">
        {localize(pack.features).map(feature => <li key={feature}>{feature}</li>)}
      </ul>
      {pack.note && <p className="pk-note">{localize(pack.note)}</p>}
      <Link className={"btn btn-block " + (pack.featured ? "btn-sage" : "btn-line")} to={"/contact?service=" + pack.service + "&ask=" + pack.id}>
        {localize(pack.cta)}<Arrow />
      </Link>
    </article>
  );
}

export default function Services() {
  const { t, localize, data } = useApp();
  const whatsapp = data.contact.whatsapp;
  return (
    <>
      {/* 1 — short introduction */}
      <PageHead title={t("s_page_t")} sub={t("s_page_p")} />
      <section className="sv-intro">
        <div className="wrap">
          <ul className="sv-list">
            {data.services.map((service, index) => {
              const exampleProjects = service.examples.map(slug => data.projects.find(project => project.slug === slug)).filter(Boolean);
              return (
                <li key={service.id} id={service.id} className="sv-item rv" style={{ "--ac": service.accent, "--d": index * 0.06 + "s" }}>
                  <span className="sv-ico">{serviceIcons[service.id]}</span>
                  <h2>{localize(service.name)}</h2>
                  <p>{localize(service.desc)}</p>
                  {exampleProjects.length > 0 && (
                    <div className="sv-ex">
                      {exampleProjects.map(project => (
                        <Link key={project.slug} to={"/projects/" + project.slug} style={{ "--ac": project.accent }}>
                          <span className="dot" />{localize(project.name)}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <a className="link sv-jump" href="#packages">{t("sv_view_pk")}<svg className="arr sv-down" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v11M5 11l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
        </div>
      </section>

      {/* 2 — Our packages */}
      <section className="band band-dark pk" id="packages">
        <div className="pk-shapes" aria-hidden="true"><i /><i /><i /></div>
        <div className="wrap pk-in">
          <div className="sec-h rv"><div><h2>{t("pk_t")}</h2><p>{t("pk_p")}</p></div></div>
          <div className="pk-grid">
            {data.packages.map((pack, index) => <PackageCard key={pack.id} pack={pack} index={index} />)}
          </div>
        </div>
      </section>

      {/* 3 — Additional services */}
      <section className="sec add" id="additional">
        <div className="wrap">
          <div className="sec-h rv"><div><h2>{t("add_t")}</h2><p>{t("add_p")}</p></div></div>
          <ul className="add-list">
            {data.extras.map((extra, index) => (
              <li key={extra.id} className="rv" style={{ "--d": index * 0.05 + "s" }}>
                <Link className="add-row" to={"/contact?service=other&ask=" + extra.id}>
                  <span className="add-txt">
                    <b>{localize(extra.name)}</b>
                    <small>{localize(extra.desc)}</small>
                  </span>
                  <span className="add-end">
                    <span className={"add-price" + (extra.price ? " set" : "")} dir="auto">{extra.price || t("add_price")}</span>
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4 — contact call to action */}
      <section className="band band-dark cta pk-cta">
        <div className="wrap cta-in">
          <div className="cta-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="rv"><h2>{t("pk_cta_t")}</h2><p>{t("pk_cta_p")}</p></div>
          <div className="pk-cta-btns rv" style={{ "--d": ".1s" }}>
            <Link className="btn btn-sage" to="/contact">{t("cta")}<Arrow /></Link>
            {whatsapp && <a className="btn btn-line" href={"https://wa.me/" + whatsapp} target="_blank" rel="noopener noreferrer">{t("pk_cta_wa")}</a>}
          </div>
        </div>
      </section>
    </>
  );
}
