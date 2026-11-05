# DARCX website — React + Vite

## Run
```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview the build
```
Deploy to Vercel as-is (framework preset: Vite). `vercel.json` rewrites every route to `index.html`
and redirects the old `.html` URLs (`/about.html` → `/about`).
Routing uses `react-router-dom`.

## Where to edit
| What | File |
|---|---|
| Texts (AR/EN), projects, services, contact channels, tech stack | `src/data.js` |
| Colours, fonts, spacing | top of `src/styles/styles.css` |
| Pages | `src/pages/*.jsx` |
| Bottom navigation items | `NAV` list in `src/components/BottomNav.jsx` (+ `nav_*` labels in `data.js`) |
| Header / footer / cards / image slider | `src/components/*` |

## Adding a project, its link and its images
Each project is an object in the `projects` array in `src/data.js`:
```js
{
  slug: "my-site", kind: "web", accent: "#8998A8",
  name: {...}, cat: {...}, short: {...}, desc: {...}, features: {...}, problem: {...}, solution: {...},
  tech: ["React", "Firebase"],
  link: "https://my-site.com",                         // "Visit website" button (card + project page). Empty = no button
  shots: ["assets/img/my-site-1.jpg", "assets/img/my-site-2.jpg"],     // big slider at the top of the project page
  dashShots: ["assets/img/my-site-admin-1.jpg"]        // dashboard slider (shown only if not empty)
}
```
Put the image files in `public/assets/img/` as **.webp** (16:9, e.g. 1600x900, quality ~90). Keep the original PNG/JPG in `design/originals/`. The first `shots` image is also the card cover.
Dots and arrows appear automatically when a slider has more than one image. The project page `/projects/<slug>` is created automatically.

## Contact form
No server. The form validates the fields, then opens WhatsApp with the message ready (number = `contact.whatsapp` in `data.js`).
If WhatsApp is empty it falls back to email, then to copying the message.

## Logo
`public/assets/logo/darcx-monogram.webp` is used in the header and footer. The original source logo is kept in `design/`.

## Projects page
The Projects page uses the same showcase as the homepage (`ProjectShowcase`). Projects listed in `showcase` in `data.js` use their hand-picked screenshot pair;
any other project uses its first screenshot + first dashboard screenshot (or its second screenshot). To choose the pair for a project, add it to `showcase`.

## Dalil (دليل), the site guide (bottom button)

A round robot-face button is fixed above the bottom bar on every page (`src/components/Buddy.jsx`, drawing in `src/components/Dalil.jsx`, sounds in `src/lib/sfx.js`).
- A few seconds after each page opens, a "Did you know what this page does? + emoji" notice pops out of it (`data.js` → `buddy.tips`, one per page).
- Tapping the button opens a small chat: the visitor types (or taps a ready question such as "How do I order?" / "Where can I see your work?") and Dalil answers. Answers can carry a button that opens a page or WhatsApp Answers about packages, prices, delivery, support, extra services and **every project** (overview, features, technologies, where to view it) are built from `data.packages`, `data.extras` and `data.projects` by `src/lib/guide.js`, so they stay correct when you edit that data; add a project and Dalil knows it. Fixed answers (ordering, contact, language…) are in `data.js` → `buddy.faq` (`keys` = words to look for, `a` = answer, `go`/`wa` = buttons). Under some answers Dalil suggests follow-up questions.
- **Travelling head** (`src/lib/flyer.js`): only when a button in the chat opens a page, the little round head leaves the chat, flies to that page's tab in the bottom bar and presses it, then flies on to the new page's heading, hops, says hello and flies back to its place. Normal navigation (tabs, links) does not trigger it. Skipped for `prefers-reduced-motion`.
- **Square field on the home page** (`src/components/HeroGrid.jsx`, desktop only: width ≥ 1024px with a mouse; not created on phones/tablets): the whole empty half of the first screen is a fine field of tiny squares (two canvases), fading out toward the text. Hovering anywhere on the first screen: the pointer is followed (with a little lag) by DARCX's own shapes drawn in lit squares, a small quarter disc with the thin 32° slanted line rising from it (a compact mark), leaving a short fading trail (mirrored in English like the corner shapes); a click sends a faint ring across. Size, gap, reach, strength and fade time are the constants at the top of the file (`STRENGTH` = how visible the effect is).
- Besides site questions, Dalil answers small talk and general questions (who he is, jokes, time/date, what a domain / hosting / SEO / dashboard is, apps and stores, what to prepare before ordering); things the site doesn't state (hours, address, payment methods) are answered with "ask us directly". Those fixed answers are in `data.js` → `buddy.faq` (a list in `a.ar` / `a.en` = several variants, one at random).
- Sound effects are synthesised with the Web Audio API (no files): open/close whoosh, hello, tap, key ticks, send, "typing", reply chime, talking chirps, "hmm" when it has no answer, page-open swoosh, suggestion pop, notice. Sound starts after the first tap (browser rule) and can be muted from the panel (remembered in localStorage).
- The eyes follow the pointer (phones: they glance around by themselves) and blink every 5 seconds. Reduced motion is respected.
- The same face is the site icon: `public/assets/dalil.svg`, `favicon.png`, `apple-touch-icon.png` (the previous icons are kept as `*.original.png`).

