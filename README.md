# Felipe Sanchez: Ubuntu desktop portfolio with R in the browser

A personal website styled as an Ubuntu 20.04 desktop, customised R user.
R runs **in the visitor's browser** via [webR](https://docs.r-wasm.org/webr/) and [Shinylive](https://shinylive.io/r/), with no server.

## Credits

Inspired in the work [vivek9patel/vivek9patel.github.io](https://github.com/vivek9patel/vivek9patel.github.io).

## Edit your content

| What | Where |
|---|---|
| Name, bio, links, skills, projects, education | `site.config.js` (search for `TODO`) |
| Shiny apps (run in browser via Shinylive) | `shiny-apps/<name>/app.R`, registered in `components/apps/shiny.js` |
| Desktop / dock apps | `apps.config.js` |
| CV PDF | `public/files/`, then set `resumePdf` in `site.config.js` |

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in ./out
```

## Deploy (GitHub Pages)

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `cv`; `.github/workflows/deploy.yml` builds and deploys.
   The site appears at `https://anfesanz.github.io/felipesanchez.github.io/`
   (the workflow detects the sub-path automatically).
3. Later, to use a custom domain: add it under **Settings → Pages → Custom domain**, create the DNS records GitHub shows
   (`A` records to 185.199.108-111.153 for an apex domain, or a `CNAME` to `anfesanz.github.io` for `www`), tick
   *Enforce HTTPS*, and re-run the workflow. No code changes needed.

Optional repo variables: `GA_TRACKING_ID` (Google Analytics), `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` (contact form).

## Roadmap

- [x] Phase 1: fork, rebrand, deploy pipeline, Survival Explorer Shiny app
- [ ] Phase 2: real content (bio, CV, publications), Files app
- [x] Phase 3: R console in the Terminal (webR): type `R` in the Terminal
- [x] Phase 4: R IDE app (editor, console, environment, plots); demo scripts in `r-scripts/`
- [x] Phase 5a: Data Viewer (survival datasets + your own data frames), R apps lazy-loaded
- [ ] Phase 5b: bundle Shinylive assets with the site (no shinylive.io dependency), more Shiny apps
