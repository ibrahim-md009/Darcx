import { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context.jsx";

/* Edit this list to add / remove items in the bottom bar */
export const NAV = [
  { id: "home", to: "/", icon: <path d="M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10" /> },
  { id: "projects", to: "/projects", icon: <><rect x="3" y="3" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" /></> },
  { id: "services", to: "/services", icon: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /> },
  { id: "about", to: "/about", icon: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6" /></> },
  { id: "contact", to: "/contact", icon: <path d="M4 5h16v11H9l-5 4z" /> }
];

export default function BottomNav() {
  const { t } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const trackRef = useRef(null);
  /* state of the current finger/mouse drag across the bar */
  const drag = useRef({ pointerId: null, startX: 0, active: false, lastIndex: -1, ignoreClick: false });

  const currentId = pathname.startsWith("/projects") ? "projects" : (NAV.find(item => item.to === pathname)?.id ?? null);
  const currentIndex = NAV.findIndex(item => item.id === currentId);

  const linkEls = () => [...trackRef.current.querySelectorAll("a")];

  /* pointer x position -> which item it is over (a fraction: 1.5 = halfway between item 1 and 2) */
  const pointerToIndex = pointerX => {
    const rect = trackRef.current.getBoundingClientRect(), itemWidth = rect.width / NAV.length;
    const isRtl = document.documentElement.dir === "rtl";
    return (isRtl ? rect.right - pointerX : pointerX - rect.left) / itemWidth - 0.5;
  };

  const handleDown = event => {
    if (event.pointerType === "mouse" && event.button) return;
    Object.assign(drag.current, { startX: event.clientX, pointerId: event.pointerId, active: false });
  };
  const handleMove = event => {
    const state = drag.current, track = trackRef.current;
    if (state.pointerId !== event.pointerId) return;
    if (!state.active) {
      if (Math.abs(event.clientX - state.startX) < 10) return; /* small movement = still a tap */
      state.active = true; track.classList.add("drag");
      try { track.setPointerCapture(state.pointerId); } catch (error) {}
    }
    const position = Math.min(NAV.length - 1, Math.max(0, pointerToIndex(event.clientX)));
    track.style.setProperty("--idx", position);
    const nearest = Math.round(position);
    if (nearest !== state.lastIndex) {
      state.lastIndex = nearest;
      linkEls().forEach((link, index) => link.classList.toggle("hot", index === nearest));
      if (navigator.vibrate) navigator.vibrate(6);
    }
  };
  const handleUp = event => {
    const state = drag.current, track = trackRef.current;
    if (state.pointerId !== event.pointerId) return;
    state.pointerId = null;
    if (!state.active) return;
    state.active = false;
    const target = Math.max(0, Math.min(NAV.length - 1, Math.round(parseFloat(track.style.getPropertyValue("--idx")) || 0)));
    track.classList.remove("drag");
    linkEls().forEach(link => link.classList.remove("hot"));
    state.lastIndex = -1;
    /* the browser also fires a click after a drag: ignore it for a moment */
    state.ignoreClick = true; setTimeout(() => { state.ignoreClick = false; }, 350);
    track.style.setProperty("--idx", target);
    if (NAV[target].id !== currentId) navigate(NAV[target].to);
  };
  const blockClickAfterDrag = event => { if (drag.current.ignoreClick) { event.preventDefault(); event.stopPropagation(); } };

  return (
    <nav className="bnav" id="bnav" aria-label="Main">
      <div className="wrap bnav-in">
        <div
          className="bnav-track" ref={trackRef}
          style={{ "--n": NAV.length, "--idx": currentIndex < 0 ? 0 : currentIndex }}
          onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={handleUp} onPointerCancel={handleUp}
          onClickCapture={blockClickAfterDrag}
        >
          <i className="bnav-ind" aria-hidden="true" style={currentIndex < 0 ? { opacity: 0 } : undefined} />
          {NAV.map(item => (
            <Link
              key={item.id} to={item.to} draggable="false"
              aria-current={item.id === currentId ? "page" : undefined}
              onClick={() => { if (item.id === currentId && pathname === item.to) scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
              <span>{t("nav_" + item.id)}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
