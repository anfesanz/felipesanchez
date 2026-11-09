// One shared webR (R compiled to WebAssembly) session for the whole desktop.
// Loaded lazily from the webR CDN the first time an app needs R.
//
// GitHub Pages cannot send the COOP/COEP headers needed for webR's faster
// SharedArrayBuffer channel, so we use the PostMessage channel, which works
// everywhere. Trade-off: no interrupting long computations, no readline().

export const WEBR_VERSION = "0.6.0";
const BASE_URL = `https://webr.r-wasm.org/v${WEBR_VERSION}/`;

// Packages installed at startup (from the webR package repository).
const STARTUP_PACKAGES = ["survival"];

let sessionPromise = null;

export function getR(onStatus = () => { }) {
    if (!sessionPromise) {
        sessionPromise = (async () => {
            onStatus("Downloading R (webR " + WEBR_VERSION + ")…");
            const { WebR, ChannelType } = await import(/* webpackIgnore: true */ BASE_URL + "webr.mjs");
            const webR = new WebR({ baseUrl: BASE_URL, channelType: ChannelType.PostMessage });
            await webR.init();

            onStatus("Installing packages: " + STARTUP_PACKAGES.join(", ") + "…");
            await webR.evalRVoid(`
                webr::install(pkgs, quiet = TRUE)
                suppressPackageStartupMessages(library(survival))
                webr::shim_install()   # make install.packages() use the webR repo
                options(width = 90)
            `, { env: { pkgs: STARTUP_PACKAGES } });

            const shelter = await new webR.Shelter();
            const version = await webR.evalRString("R.version.string");
            return { webR, shelter, version };
        })().catch((err) => {
            sessionPromise = null; // allow a retry
            throw err;
        });
    }
    return sessionPromise;
}

const INCOMPLETE_CHECK = `{
    e <- tryCatch({ parse(text = code); NULL }, error = function(e) conditionMessage(e))
    !is.null(e) && grepl("unexpected end of input|INCOMPLETE_STRING", e)
}`;

// True when `code` is syntactically unfinished (e.g. an open brace), so the
// console should show a "+" continuation prompt instead of evaluating.
export async function isIncomplete(code) {
    const { webR } = await getR();
    return webR.evalRBoolean(INCOMPLETE_CHECK, { env: { code } });
}

// Evaluate code like the R console: autoprint, capture stdout/stderr and plots.
// Returns { output: [{type: "stdout"|"stderr", data}], images: ImageBitmap[] }.
export async function runR(code, { width = 640, height = 400 } = {}) {
    const { shelter } = await getR();
    try {
        const res = await shelter.captureR(code, {
            withAutoprint: true,
            captureStreams: true,
            captureConditions: false,
            captureGraphics: { width, height },
        });
        return { output: res.output, images: res.images || [] };
    } finally {
        await shelter.purge();
    }
}

// Tab completion using R's own engine (the one behind the R console and RStudio):
// objects, functions, arguments, list$elements, package::exports, file names in quotes.
const COMPLETE = `tryCatch({
    utils:::.assignLinebuffer(line)
    utils:::.assignEnd(nchar(line))
    token <- utils:::.guessTokenFromLine()
    utils:::.completeToken()
    c(token, utils:::.retrieveCompletions())
}, error = function(e) character(0))`;

// Returns { token, completions }: `token` is the text being completed at the end of
// `line`, each completion is a full replacement for it (e.g. "survfit(", "lung$time").
export async function completeR(line) {
    const { shelter } = await getR();
    try {
        const res = await shelter.evalR(COMPLETE, { env: { line } });
        const arr = (await res.toArray()).filter(x => x !== null);
        return { token: arr[0] ?? "", completions: [...new Set(arr.slice(1))] };
    } finally {
        await shelter.purge();
    }
}
