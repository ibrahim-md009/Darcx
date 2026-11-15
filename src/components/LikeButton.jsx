import { useState } from "react";
import { useApp } from "../context.jsx";
import { isLiked, setLiked } from "../lib/likes.js";

/* A heart on every project. Tap: it fills and bounces and a few small hearts float up; tap again to take it back.
   The choice is remembered in this browser only (lib/likes.js). */
const HEART = "M12 20.5C5 15.2 2.5 11.8 2.5 8.6 2.5 6 4.5 4 7 4c1.9 0 3.7 1 5 2.8C13.3 5 15.1 4 17 4c2.5 0 4.5 2 4.5 4.6 0 3.2-2.5 6.6-9.5 11.9z";

export default function LikeButton({ slug }) {
  const { t } = useApp();
  const [liked, setLikedState] = useState(() => isLiked(slug));
  const [burst, setBurst] = useState(0); // changes on every like, which restarts the animation and the floating hearts

  const toggle = () => {
    const next = !liked;
    setLikedState(next);
    setLiked(slug, next);
    if (next) setBurst(count => count + 1);
  };

  return (
    <button type="button" className={"like" + (liked ? " is-on" : "")} onClick={toggle} aria-pressed={liked} aria-label={liked ? t("unlike") : t("like")} title={liked ? t("unlike") : t("like")}>
      <svg key={"h" + burst} viewBox="0 0 24 24" aria-hidden="true"><path d={HEART} /></svg>
      {burst > 0 && liked && (
        <span className="like-fx" key={"f" + burst} aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map(i => <svg key={i} viewBox="0 0 24 24" style={{ "--x": (i - 2.5) * 16 + "px", "--d": i * 0.04 + "s" }}><path d={HEART} /></svg>)}
        </span>
      )}
    </button>
  );
}
