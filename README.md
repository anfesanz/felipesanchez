# Felipe Sanchez: Ubuntu desktop portfolio with R in the browser

A personal website styled as an Ubuntu 20.04 desktop, customised R user.
R runs **in the visitor's browser** via [webR](https://docs.r-wasm.org/webr/) and [Shinylive](https://shinylive.io/r/), with no server.

**Live site: [anfesanz.github.io/felipesanchez](https://anfesanz.github.io/felipesanchez/)**

## Credits

Inspired in the work [vivek9patel/vivek9patel.github.io](https://github.com/vivek9patel/vivek9patel.github.io).

## Edit your content

| What | Where |
|---|---|
| Name, bio, links, skills, projects, teaching, education | `site.config.js` (search for `TODO`) |
| Shiny apps (run in browser via Shinylive) | `shiny-apps/<name>/app.R`, registered in `components/apps/shiny.js` |
| Desktop / dock apps | `apps.config.js` |
| CV (shown in the CV folder and About › Resume) | `content/cv.md` |
| Desktop folders and what's inside them | `components/apps/files.js` (`FOLDERS`) |
| CV PDF | `public/files/`, then set `resumePdf` in `site.config.js` |

## Hide or show the CV and About Me

Both are switched on and off in `site.config.js`, at the top:

```js
show: {
    cv: true,       // false hides the CV
    aboutMe: true,  // false hides About Me
},
```

| Setting | What disappears when `false` |
|---|---|
| `cv` | The CV document in the CV folder, the *Resume* tab in About Me, and `cv.md` in the Terminal. The folder is renamed **About** and keeps the contact links. |
| `aboutMe` | The About Me app from the dock, the app grid and the CV folder, plus the Terminal's `about` command and `about.txt`. |

Commit and push to `main`; the GitHub Actions workflow redeploys the site automatically. Locally, `npm run dev` picks up the change on reload.

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static site in ./out
```
