import { useApp } from "../context.jsx";
import { CtaBand, PageHead } from "../components/ui.jsx";

export default function About() {
  const { t, localize, data } = useApp();
  const dots = ["var(--sage)", "var(--blue)", "var(--taupe)"];
  return (
    <>
      <PageHead title={t("a_page_t")} sub={t("a_page_p")} />

      <section className="sec">
        <div className="wrap dgrid">
          <div className="rv"><h2>{t("a_story_t")}</h2></div>
          <div className="rv story" style={{ "--d": ".08s" }}>{t("a_story").map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        </div>
      </section>

      <section className="band band-sand">
        <div className="wrap">
          <h2 className="rv">{t("a_values_t")}</h2>
          <div className="grid3">
            {t("a_values").map(([title, text], index) => (
              <div key={index} className="vcard rv" style={{ "--d": index * 0.07 + "s" }}>
                <span className="dot" style={{ background: dots[index] }} />
                <h3>{title}</h3><p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap dgrid">
          <div className="rv">
            <h2>{t("a_skills_t")}</h2>
            <div className="tags">{data.services.map(service => <span key={service.id} className="tag" style={{ "--ac": service.accent }}><i className="dot" />{localize(service.name)}</span>)}</div>
          </div>
          <div className="rv" style={{ "--d": ".08s" }}>
            <h2>{t("a_stack_t")}</h2>
            <div className="tags">{data.stack.map(tech => <span key={tech} className="tag tag-plain" dir="ltr">{tech}</span>)}</div>
          </div>
        </div>
      </section>

      <CtaBand title={t("home_cta_t")} text={t("home_cta_p")} />
    </>
  );
}
