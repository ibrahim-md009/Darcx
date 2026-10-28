import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow, PageHead, serviceIcons } from "../components/ui.jsx";

/* small icons for the four category cards (same line style as the rest of the site) */
const outline = { fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" };
const cardIcons = {
  websites: serviceIcons.websites,
  dashboards: serviceIcons.dashboards,
  systems: serviceIcons.systems,
  stores: <svg viewBox="0 0 48 48"><path d="M9 18h30l-2.500 20a3 3 0 0 1-3 2.500H14.500a3 3 0 0 1-3-2.500L9 18z" {...outline} /><path d="M17 18v-3a7 7 0 0 1 14 0v3" {...outline} /></svg>,
};

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
  const { t, localize, data } = useApp();
  const nameId = "pk-" + pack.id;
  const whatsapp = data.contact.whatsapp;
  /* the order button opens WhatsApp directly with a ready message (number comes from data.contact.whatsapp);
     without a WhatsApp number it falls back to the contact form */
  const message = localize(pack.wa).replace("{price}", pack.price).replace("{original}", pack.original);
  const orderProps = whatsapp
    ? { href: "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(message), target: "_blank", rel: "noopener noreferrer" }
    : { href: "/contact?service=" + pack.service + "&ask=" + pack.id };
  return (
    <article className={"pk-card rv" + (pack.featured ? " is-feat" : "")} style={{ "--d": index * 0.08 + "s" }} aria-labelledby={nameId}>
      <header className="pk-head">
        <h3 id={nameId}>{localize(pack.name)}</h3>
        <p>{localize(pack.desc)}</p>
      </header>
      <Price pack={pack} />
      {pack.offer && <span className="pk-offer">{t("pk_offer")}</span>}
      <ul className="pk-list">
        {localize(pack.features).map(feature => <li key={feature}>{feature}</li>)}
      </ul>
      <p className="pk-disc">{t("pk_disc")}</p>
      <a className={"btn btn-block " + (pack.featured ? "btn-sage" : "btn-line")} {...orderProps}>
        {localize(pack.cta)}<Arrow />
      </a>
    </article>
  );
}

export default function Services() {
  const { t, localize, data } = useApp();
  const whatsapp = data.contact.whatsapp;
  return (
    <>
      {/* 1 — short introduction: four compact category cards */}
      <PageHead title={t("s_page_t")} sub={t("s_page_p")} />
      <section className="sv-intro">
        <div className="wrap">
          <ul className="sv-grid">
            {data.serviceCards.map((card, index) => (
              <li key={card.id} id={card.id} className="sv-card rv" style={{ "--ac": card.accent, "--d": index * 0.06 + "s" }}>
                {card.id === "systems" && <span id="mobile" aria-hidden="true" />}
                <span className="sv-ico">{cardIcons[card.id]}</span>
                <h2>{localize(card.name)}</h2>
                <p>{localize(card.desc)}</p>
              </li>
            ))}
          </ul>
        </div>
        {/* light → dark transition into the packages: a diagonal edge with a brand line, drawn in when scrolled into view */}
        <svg className="sv-cut rv" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polygon points="0,100 100,0 100,100" />
          <line x1="0" y1="100" x2="100" y2="0" vectorEffect="non-scaling-stroke" />
        </svg>
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
