import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import D from "./data.js";

const AppCtx = createContext(null);
const doc = document.documentElement;

export const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }
};

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(doc.lang === "en" ? "en" : "ar");
  const [theme, setTheme] = useState(doc.dataset.theme === "light" ? "light" : "dark");

  /* keep <html> in sync */
  useEffect(() => {
    doc.lang = lang;
    doc.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => { doc.dataset.theme = theme; }, [theme]);

  /* follow the system theme until the visitor picks one */
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: light)");
    const on = e => { if (!store.get("dx-theme")) setTheme(e.matches ? "light" : "dark"); };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const setLang = useCallback(l => {
    if (l === lang) return;
    store.set("dx-lang", l);
    /* update React + <html lang/dir> in the same step so the page never shows a half-switched frame */
    const apply = () => {
      flushSync(() => setLangState(l));
      doc.lang = l;
      doc.dir = l === "ar" ? "rtl" : "ltr";
    };
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !calm) {
      /* browser snapshots old + new page and cross-fades between them */
      document.startViewTransition(apply);
    } else {
      /* fallback: quick fade out, switch, fade back in after the new layout is painted */
      document.body.classList.add("swap");
      setTimeout(() => {
        apply();
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("swap")));
      }, 140);
    }
  }, [lang]);

  const toggleTheme = useCallback(() => {
    const n = theme === "dark" ? "light" : "dark";
    doc.classList.add("tx");
    setTheme(n);
    store.set("dx-theme", n);
    setTimeout(() => doc.classList.remove("tx"), 500);
  }, [theme]);

  const value = useMemo(() => ({
    D, lang, theme, setLang, toggleTheme,
    t: k => D.i18n[lang][k],
    L: o => o[lang]
  }), [lang, theme, setLang, toggleTheme]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
