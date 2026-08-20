# VOLT — 3D Energy Drink Showcase

An interactive, multi-section 3D product site built with React + Three.js.
Drag the can, switch flavors, browse the story timeline, and search the store locator.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed `http://localhost:5173` link.

## Go live — three easy options

### Option A: Vercel (recommended, free, ~2 minutes)
1. Install the CLI once: `npm install -g vercel`
2. From this folder, run: `vercel`
3. Answer the prompts (defaults are fine) — it builds and deploys automatically.
4. You'll get a live `https://your-project.vercel.app` URL immediately.
   Run `vercel --prod` to push future updates live.

### Option B: Netlify (drag-and-drop, no CLI needed)
1. Run `npm run build` — this creates a `dist/` folder.
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder onto the page. It deploys instantly and gives you a live URL.
   (You can later connect it to a GitHub repo for auto-deploys on every push.)

### Option C: GitHub Pages (free, tied to a GitHub repo)
1. Push this project to a new GitHub repository.
2. `npm install -D gh-pages`
3. Add to `package.json` scripts: `"deploy": "vite build && gh-pages -d dist"`
4. Add `base: '/your-repo-name/'` to `vite.config.js`
5. Run `npm run deploy` — your site goes live at
   `https://your-username.github.io/your-repo-name/`

## Using a custom domain

All three platforms above let you attach a custom domain (e.g. `voltenergy.com`)
for free once deployed — Vercel: Project → Settings → Domains.
Netlify: Site settings → Domain management. GitHub Pages: repo Settings → Pages.

## Notes

- Built with Vite + React 18 + Three.js (r160) + lucide-react — all standard,
  installable packages (no sandbox-only libraries used).
- If you want real scroll-animation libraries (e.g. `motion`) or 21st.dev
  components layered in, install them here (`npm install motion`) — this is
  a normal Node project, so anything on npm works.
