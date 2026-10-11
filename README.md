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
