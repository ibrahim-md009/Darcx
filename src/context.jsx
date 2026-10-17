import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import data from "./data.js";

const AppCtx = createContext(null);
const html = document.documentElement;

export const store = {
  get: key => { try { return localStorage.getItem(key); } catch (error) { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch (error) {} }
};

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(html.lang === "en" ? "en" : "ar");
  const [theme, setTheme] = useState(html.dataset.theme === "light" ? "light" : "dark");

  /* keep <html> in sync */
  useEffect(() => {
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => { html.dataset.theme = theme; }, [theme]);

  /* follow the system theme until the visitor picks one */
  useEffect(() => {
    const systemTheme = matchMedia("(prefers-color-scheme: light)");
    const onChange = event => { if (!store.get("dx-theme")) setTheme(event.matches ? "light" : "dark"); };
    systemTheme.addEventListener("change", onChange);
    return () => systemTheme.removeEventListener("change", onChange);
  }, []);

  const setLang = useCallback(newLang => {
    if (newLang === lang) return;
    store.set("dx-lang", newLang);
    /* update React + <html lang/dir> in the same step so the page never shows a half-switched frame */
    const applyLang = () => {
      flushSync(() => setLangState(newLang));
      html.lang = newLang;
      html.dir = newLang === "ar" ? "rtl" : "ltr";
    };
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !reducedMotion) {
      /* browser snapshots old + new page and cross-fades between them */
      document.startViewTransition(applyLang);
    } else {
      /* fallback: quick fade out, switch, fade back in after the new layout is painted */
      document.body.classList.add("swap");
      setTimeout(() => {
        applyLang();
        requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("swap")));
      }, 140);
    }
  }, [lang]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    html.classList.add("tx");
    setTheme(nextTheme);
    store.set("dx-theme", nextTheme);
    setTimeout(() => html.classList.remove("tx"), 500);
  }, [theme]);

  /* t("key")      -> interface text in the current language (from data.i18n)
     localize({ar, en}) -> picks the current language out of an { ar, en } object */
  const value = useMemo(() => ({
    data, lang, theme, setLang, toggleTheme,
    t: key => data.i18n[lang][key],
    localize: texts => texts[lang]
  }), [lang, theme, setLang, toggleTheme]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
