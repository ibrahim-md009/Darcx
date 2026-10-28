import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow } from "./ui.jsx";

/* Two project screenshots, overlapped at different angles.
   - mouse: hovering a screenshot brings it forward; leaving returns the original composition
   - touch / keyboard: tapping or focusing a back screenshot brings it forward first; a second tap opens the project
   The caption below always describes the screenshot that is in front, so nothing depends on hover alone. */
export default function ProjectShowcase({ projects }) {
  const { localize, t } = useApp();
  const [front, setFront] = useState(0);
  const press = useRef(null);

  if (projects.length === 0) return null;

  const onPointerDown = (event, index) => {
    press.current = { type: event.pointerType, wasFront: front === index };
  };
  const onClick = (event, index) => {
    const lastPress = press.current;
    press.current = null;
    /* touch & pen: first tap only selects; a tap on the front image follows the link */
    if (lastPress && lastPress.type !== "mouse" && !lastPress.wasFront) {
      event.preventDefault();
      setFront(index);
    }
  };

  return (
    <div className="pj">
      <div className="pj-stage rv">
        {projects.map((project, index) => (
          <Link
            key={project.slug}
            to={"/projects/" + project.slug}
            className={"pj-shot" + (front === index ? " is-front" : "")}
            data-i={index}
            style={{ "--ac": project.accent }}
            aria-label={localize(project.name) + " — " + t("more")}
            onPointerEnter={event => event.pointerType === "mouse" && setFront(index)}
            onPointerLeave={event => event.pointerType === "mouse" && setFront(0)}
            onPointerDown={event => onPointerDown(event, index)}
            onClick={event => onClick(event, index)}
            onFocus={event => event.currentTarget.matches(":focus-visible") && setFront(index)}
            onBlur={event => event.currentTarget.matches(":focus-visible") && setFront(0)}
          >
            <img src={"/" + project.shots[0]} alt={localize(project.name)} loading="lazy" decoding="async" draggable="false" />
          </Link>
        ))}
      </div>

      <div className="pj-caps" aria-live="polite">
        {projects.map((project, index) => (
          <div key={project.slug} className={"pj-cap" + (front === index ? " on" : "")} style={{ "--ac": project.accent }} aria-hidden={front !== index}>
            <span className="badge">{localize(project.cat)}</span>
            <h3>{localize(project.name)}</h3>
            <p>{localize(project.short)}</p>
            <div className="pj-act">
              <Link className="pcard-more" to={"/projects/" + project.slug} tabIndex={front === index ? 0 : -1}>{t("more")}<Arrow /></Link>
              {project.link && (
                <a className="pcard-visit" href={project.link} target="_blank" rel="noopener noreferrer" tabIndex={front === index ? 0 : -1}>
                  <span>{t("visit")}</span>
                  <svg className="ext" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14L14 6M7.5 6H14v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
