import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Logo } from "./ui.jsx";

export default function Header() {
  const { t, lang, setLang, toggleTheme } = useApp();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let tick = false, last = scrollY;
    const on = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        setScrolled(y > 16);
        /* phones: slide the top bar away while reading, bring it back on scroll up */
        if (innerWidth <= 640) {
          if (y > 240 && y > last + 6) setHidden(true);
          else if (y < last - 6 || y <= 240) setHidden(false);
        } else setHidden(false);
        last = y; tick = false;
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <a className="skip" href="#app">{t("skip")}</a>
      <header className={"nav" + (scrolled ? " scrolled" : "") + (hidden ? " hide" : "")} id="nav">
        <div className="wrap nav-in">
          <Link className="logo" to="/" aria-label="DARCX" onClick={() => { if (pathname === "/") scrollTo({ top: 0, behavior: "smooth" }); }}>
            <Logo />
          </Link>
          <div className="tools">
            <div className="lang" role="group" aria-label={t("language")}>
              <button onClick={() => setLang("ar")} aria-pressed={lang === "ar"}>AR</button>
              <button onClick={() => setLang("en")} aria-pressed={lang === "en"}>EN</button>
            </div>
            <button className="ib" onClick={toggleTheme} aria-label={t("theme")}>
              <svg viewBox="0 0 24 24">
                <g className="sun"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>
                <path className="moon" d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
              </svg>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
