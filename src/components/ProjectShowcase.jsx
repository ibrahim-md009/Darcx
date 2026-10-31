import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Arrow } from "./ui.jsx";

/* One project = one composition: two real screenshots of THAT project, overlapped at different angles.
   - mouse: hovering a screenshot brings it forward; leaving returns the original arrangement
   - touch / keyboard: the first tap (or keyboard focus) brings a back screenshot forward; tapping the front one opens the project
   Title, description and links sit next to the screenshots, so nothing depends on hover. */
function ProjectShow({ project, shots, index }) {
  const { localize, t } = useApp();
  const [front, setFront] = useState(0);
  const press = useRef(null);

  const onPointerDown = (event, i) => {
    press.current = { type: event.pointerType, wasFront: front === i };
  };
  const onClick = (event, i) => {
    const lastPress = press.current;
    press.current = null;
    if (lastPress && lastPress.type !== "mouse" && !lastPress.wasFront) {
      event.preventDefault();
      setFront(i);
    }
  };

  return (
    <article className="pj-item" style={{ "--ac": project.accent }}>
      <div className="pj-stage rv">
        {shots.map((src, i) => (
          <Link
            key={src}
            to={"/projects/" + project.slug}
            className={"pj-shot" + (front === i ? " is-front" : "")}
            data-i={i}
            aria-label={localize(project.name) + " — " + t("more")}
            tabIndex={i === 0 ? 0 : -1}
            onPointerEnter={event => event.pointerType === "mouse" && setFront(i)}
            onPointerLeave={event => event.pointerType === "mouse" && setFront(0)}
            onPointerDown={event => onPointerDown(event, i)}
            onClick={event => onClick(event, i)}
          >
            <img src={"/" + src} alt={localize(project.name) + " " + (i + 1)} loading={index === 0 ? "eager" : "lazy"} decoding="async" draggable="false" />
          </Link>
        ))}
      </div>

      <div className="pj-txt rv" style={{ "--d": ".1s" }}>
        <span className="badge">{localize(project.cat)}</span>
        <h3>{localize(project.name)}</h3>
        <p>{localize(project.short)}</p>
        <div className="pj-act">
          <Link className="pcard-more" to={"/projects/" + project.slug}>{t("more")}<Arrow /></Link>
          {project.link && (
            <a className="pcard-visit" href={project.link} target="_blank" rel="noopener noreferrer">
              <span>{t(project.linkLabel || "visit")}</span>
              <svg className="ext" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14L14 6M7.5 6H14v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProjectShowcase({ items }) {
  if (items.length === 0) return null;
  return (
    <div className="pj">
      {items.map(({ project, shots }, index) => <ProjectShow key={project.slug} project={project} shots={shots} index={index} />)}
    </div>
  );
}
