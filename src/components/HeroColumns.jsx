import { useApp } from "../context.jsx";

/* Next to the hero text (desktop with a mouse only, see .hcol in styles.css): two columns of real screenshots of our projects,
   one drifting up and the other down, forever. Purely decorative (hidden from screen readers, not clickable).
   Each list is written twice so the loop is seamless (the CSS moves it by exactly half). */
export default function HeroColumns() {
  const { data, localize } = useApp();
  const cards = data.projects.flatMap(project => (project.shots || []).slice(0, 2).map(src => ({ src, name: localize(project.name), key: project.slug + src }))).slice(0, 10);
  if (cards.length < 4) return null;
  const first = cards.filter((_, index) => index % 2 === 0), second = cards.filter((_, index) => index % 2 === 1);
  const column = list => [...list, ...list].map((card, index) => (
    <div className="hcol-card" key={card.key + index}>
      <img src={"/" + card.src} alt="" loading="lazy" decoding="async" draggable="false" />
      <span>{card.name}</span>
    </div>
  ));
  return (
    <div className="hcol" aria-hidden="true">
      <div className="hcol-track">{column(first)}</div>
      <div className="hcol-track">{column(second)}</div>
    </div>
  );
}
