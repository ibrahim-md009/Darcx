import { useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useApp } from "./context.jsx";
import Header from "./components/Header.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Footer from "./components/Footer.jsx";
import { PageHead } from "./components/ui.jsx";
import Home from "./pages/Home.jsx";
import Services from "./pages/Services.jsx";
import Projects from "./pages/Projects.jsx";
import Project from "./pages/Project.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

function NotFound() {
  const { t } = useApp();
  return <PageHead title={t("nf_t")} sub={t("nf_p")} />;
}

/* which SEO entry the current URL uses */
function pageId(path) {
  if (path === "/") return "home";
  if (/^\/projects\/[^/]+$/.test(path)) return "project";
  return ["services", "projects", "about", "contact"].find(name => path === "/" + name) || "404";
}

export default function App() {
  const currentLocation = useLocation();
  const path = currentLocation.pathname.replace(/\/+$/, "") || "/";
  const { t, localize, data, lang } = useApp();
  const page = pageId(path);
  const slug = page === "project" ? path.split("/")[2] : "";
  const prevPath = useRef(null);

  /* page title + description (SEO) */
  useEffect(() => {
    let title, description;
    if (page === "project") {
      const project = data.projects.find(item => item.slug === slug);
      title = project ? localize(project.name) + " | " + t("brand") : t("nf_t");
      description = project ? localize(project.short) : t("nf_p");
    } else if (page === "404") {
      title = t("nf_t") + " | " + t("brand"); description = t("nf_p");
    } else {
      [title, description] = data.seo[page][lang];
    }
    document.title = title;
    const setMeta = (selector, content) => { const tag = document.querySelector(selector); if (tag) tag.setAttribute("content", content); };
    setMeta('meta[name="description"]', description); setMeta('meta[property="og:title"]', title); setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:locale"]', lang === "ar" ? "ar_AR" : "en_US");
  }, [page, slug, lang]);

  /* scroll: to the #anchor if there is one, otherwise to the top */
  useEffect(() => {
    const isFirstVisit = prevPath.current === null;
    const isSamePath = prevPath.current === path;
    prevPath.current = path;
    if (currentLocation.hash) {
      const target = document.getElementById(currentLocation.hash.slice(1));
      if (target) { setTimeout(() => target.scrollIntoView(), 80); return; }
    }
    if (isFirstVisit) return;
    scrollTo({ top: 0, behavior: isSamePath ? "smooth" : "instant" });
  }, [currentLocation.key]);

  /* reveal-on-scroll (threshold 0: tall blocks such as screenshots appear as soon as they enter the screen) */
  useEffect(() => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    }), { threshold: 0, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".rv:not(.in)").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [path, lang]);

  return (
    <>
      <Header />
      <main id="app" key={path}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<Project />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
