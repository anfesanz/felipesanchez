# Felipe Sanchez: Ubuntu desktop portfolio with R in the browser

A personal website styled as an Ubuntu 20.04 desktop, customised R user.
R runs **in the visitor's browser** via [webR](https://docs.r-wasm.org/webr/) and [Shinylive](https://shinylive.io/r/), with no server.

**Live site: [anfesanz.github.io/felipesanchez](https://anfesanz.github.io/felipesanchez/)**

## Credits

Inspired in the work [vivek9patel/vivek9patel.github.io](https://github.com/vivek9patel/vivek9patel.github.io).

## Edit your content

| What | Where |
|---|---|
| Name, bio, links, skills, projects, education | `site.config.js` (search for `TODO`) |
| Shiny apps (run in browser via Shinylive) | `shiny-apps/<name>/app.R`, registered in `components/apps/shiny.js` |
| Desktop / dock apps | `apps.config.js` |
| CV (shown in the CV folder and About › Resume) | `content/cv.md` |
| Desktop folders and what's inside them | `components/apps/files.js` (`FOLDERS`) |
| CV PDF | `public/files/`, then set `resumePdf` in `site.config.js` |

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in ./out
```
