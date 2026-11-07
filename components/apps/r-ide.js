import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { StreamLanguage } from '@codemirror/language';
import { r as rMode } from '@codemirror/legacy-modes/mode/r';
import { oneDark } from '@codemirror/theme-one-dark';
import { getR, isIncomplete, runR } from '../../lib/webr';
import kaplanMeier from '../../r-scripts/01-kaplan-meier.R';
import coxModel from '../../r-scripts/02-cox-model.R';
import parametric from '../../r-scripts/03-parametric.R';

// Demo scripts shown as editor tabs. Add more by dropping a file in r-scripts/.
const SCRIPTS = [
    { name: "01-kaplan-meier.R", code: kaplanMeier },
    { name: "02-cox-model.R", code: coxModel },
    { name: "03-parametric.R", code: parametric },
];

const ENV_CODE = `local({
    nms <- ls(globalenv())
    if (!length(nms)) return("")
    paste(vapply(nms, function(n) {
        x <- get(n, envir = globalenv())
        d <- tryCatch(utils::capture.output(utils::str(x, max.level = 0, give.attr = FALSE, vec.len = 2))[1],
                      error = function(e) "")
        paste(n, class(x)[1], trimws(gsub("\\t", " ", d)), sep = "\\t")
    }, ""), collapse = "\\n")
})`;

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

function bitmapToDataUrl(img) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/png");
}

function Pane({ title, right, children, className = "" }) {
    return (
        <div className={"flex flex-col min-h-0 min-w-0 bg-ub-grey border border-black " + className}>
            <div className="flex items-center justify-between px-2 h-7 shrink-0 bg-ub-window-title text-xs text-gray-300 select-none">
                <span className="font-medium">{title}</span>
                <div className="flex items-center gap-1">{right}</div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">{children}</div>
        </div>
    );
}

function ToolButton({ onClick, title, children, disabled }) {
    return (
        <button onClick={onClick} title={title} disabled={disabled}
            className="px-2 py-0.5 rounded text-xs outline-none focus:outline-none hover:bg-gray-50 hover:bg-opacity-10 disabled:opacity-40">
            {children}
        </button>
    );
}

export function RIde() {
    const editorHost = useRef(null);
    const viewRef = useRef(null);
    const docs = useRef(Object.fromEntries(SCRIPTS.map(s => [s.name, s.code])));
    const consoleEnd = useRef(null);
    const plotBox = useRef(null);
    const queue = useRef(Promise.resolve());

    const [active, setActive] = useState(SCRIPTS[0].name);
    const [status, setStatus] = useState("Starting R…");
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState([]);
    const [env, setEnv] = useState([]);
    const [plots, setPlots] = useState([]);
    const [plotIdx, setPlotIdx] = useState(0);
    const [input, setInput] = useState("");
    const [pending, setPending] = useState("");   // unfinished multi-line console input
    const history = useRef({ items: [], pos: 0 });

    const append = useCallback((entries) => setLog(l => [...l, ...entries].slice(-1000)), []);

    const refreshEnv = useCallback(async () => {
        const { webR } = await getR();
        const txt = await webR.evalRString(ENV_CODE);
        setEnv(txt ? txt.split("\n").map(line => line.split("\t")) : []);
    }, []);

    // Evaluate code; calls are serialised so the terminal/IDE never interleave.
    const evaluate = useCallback((code, echo = code) => {
        queue.current = queue.current.then(async () => {
            setBusy(true);
            append([{ kind: "input", text: echo }]);
            try {
                const box = plotBox.current;
                const width = Math.max(360, Math.min(900, (box?.clientWidth || 560) - 8));
                const height = Math.max(260, Math.min(700, (box?.clientHeight || 380) - 8));
                const { output, images } = await runR(code, { width, height });
                append(output.map(o => ({ kind: o.type, text: o.data })));
                if (images.length) {
                    const urls = images.map(bitmapToDataUrl);
                    setPlots(p => {
                        const next = [...p, ...urls].slice(-30);
                        setPlotIdx(next.length - 1);
                        return next;
                    });
                }
                await refreshEnv();
            } catch (err) {
                append([{ kind: "stderr", text: String(err.message || err) }]);
            } finally {
                setBusy(false);
            }
        });
        return queue.current;
    }, [append, refreshEnv]);

    // Run the selection, or the current line extended until the expression is complete.
    const runCurrent = useCallback(async () => {
        const view = viewRef.current;
        if (!view || !ready) return true;
        const { state } = view;
        const sel = state.selection.main;
        if (!sel.empty) {
            evaluate(state.sliceDoc(sel.from, sel.to));
            return true;
        }
        const doc = state.doc;
        let first = doc.lineAt(sel.head).number;
        // skip blank / comment-only lines, like RStudio
        while (first < doc.lines && /^\s*(#.*)?$/.test(doc.line(first).text)) first++;
        let last = first;
        let code = doc.line(first).text;
        while (last < doc.lines && await isIncomplete(code)) {
            last++;
            code += "\n" + doc.line(last).text;
        }
        const nextLine = Math.min(last + 1, doc.lines);
        view.dispatch({ selection: { anchor: doc.line(nextLine).from }, scrollIntoView: true });
        if (code.trim()) evaluate(code);
        return true;
    }, [evaluate, ready]);

    const sourceAll = useCallback(() => {
        const view = viewRef.current;
        if (!view || !ready) return true;
        evaluate(view.state.doc.toString(), `source("${active}")`);
        return true;
    }, [evaluate, ready, active]);

    // Keep latest handlers reachable from CodeMirror's keymap.
    const handlers = useRef({});
    handlers.current = { runCurrent, sourceAll };

    // Create the editor once.
    useEffect(() => {
        const runKeys = Prec.highest(keymap.of([
            { key: "Mod-Enter", run: () => { handlers.current.runCurrent(); return true; } },
            { key: "Mod-Shift-Enter", run: () => { handlers.current.sourceAll(); return true; } },
            { key: "Mod-Shift-s", run: () => { handlers.current.sourceAll(); return true; } },
        ]));
        const view = new EditorView({
            parent: editorHost.current,
            state: EditorState.create({
                doc: docs.current[SCRIPTS[0].name],
                extensions: [basicSetup, StreamLanguage.define(rMode), oneDark, runKeys,
                    EditorView.theme({ "&": { height: "100%", fontSize: "13px" }, ".cm-scroller": { fontFamily: "'Ubuntu Mono', monospace" } })],
            }),
        });
        viewRef.current = view;
        return () => view.destroy();
    }, []);

    // Start R as soon as the window opens.
    useEffect(() => {
        let alive = true;
        getR(msg => alive && setStatus(msg))
            .then(({ version }) => {
                if (!alive) return;
                setReady(true);
                setStatus("");
                append([{ kind: "info", text: `${version}\nRunning in your browser via webR. Use ${MOD}+Enter to run the current line, ${MOD}+Shift+Enter to source the file.` }]);
                refreshEnv();
            })
            .catch(err => alive && setStatus("Could not start R: " + (err.message || err)));
        return () => { alive = false; };
    }, [append, refreshEnv]);

    useEffect(() => { consoleEnd.current?.scrollIntoView({ block: "end" }); }, [log]);

    const switchTab = (name) => {
        const view = viewRef.current;
        docs.current[active] = view.state.doc.toString();
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: docs.current[name] }, selection: { anchor: 0 } });
        setActive(name);
    };

    const onConsoleKey = async (e) => {
        const h = history.current;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!ready) return;
            const full = pending ? pending + "\n" + input : input;
            setInput("");
            if (full.trim()) { h.items.push(input); h.pos = h.items.length; }
            if (full.trim() && await isIncomplete(full)) { setPending(full); return; }
            setPending("");
            if (full.trim()) evaluate(full);
        } else if (e.key === "ArrowUp" && !input.includes("\n")) {
            e.preventDefault();
            if (h.pos > 0) { h.pos--; setInput(h.items[h.pos]); }
        } else if (e.key === "ArrowDown" && !input.includes("\n")) {
            e.preventDefault();
            if (h.pos < h.items.length) { h.pos++; setInput(h.items[h.pos] || ""); }
        } else if (e.key === "l" && e.ctrlKey) {
            e.preventDefault();
            setLog([]);
        }
    };

    const plot = plots[plotIdx];

    return (
        <div className="w-full h-full flex flex-col bg-ub-cool-grey text-white text-sm">
            {/* toolbar */}
            <div className="flex items-center justify-between px-2 h-8 shrink-0 border-b border-black select-none">
                <div className="flex items-center gap-1">
                    <img src="./themes/Yaru/apps/r-ide.svg" alt="" className="w-5 mr-1" />
                    <ToolButton onClick={() => runCurrent()} title={`Run line or selection (${MOD}+Enter)`} disabled={!ready}>▶ Run</ToolButton>
                    <ToolButton onClick={() => sourceAll()} title={`Source file (${MOD}+Shift+Enter)`} disabled={!ready}>⇥ Source</ToolButton>
                    <ToolButton onClick={() => setLog([])} title="Clear console (Ctrl+L)">⌫ Clear</ToolButton>
                </div>
                <div className="text-xs text-gray-400 truncate ml-2">
                    {status || (busy ? "R is busy…" : "R is ready")}
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-5 grid-rows-4 md:grid-rows-2 gap-px">
                {/* editor */}
                <div className="md:col-span-3 flex flex-col min-h-0 min-w-0 border border-black">
                    <div className="flex h-7 shrink-0 bg-ub-window-title text-xs overflow-x-auto select-none">
                        {SCRIPTS.map(s => (
                            <button key={s.name} onClick={() => switchTab(s.name)}
                                className={(s.name === active ? "bg-ub-grey text-white border-t-2 border-ubb-orange" : "text-gray-400 hover:text-white") + " px-3 whitespace-nowrap outline-none focus:outline-none"}>
                                {s.name}
                            </button>
                        ))}
                    </div>
                    <div ref={editorHost} className="flex-1 min-h-0 overflow-hidden" />
                </div>

                {/* environment */}
                <Pane title="Environment" className="md:col-span-2"
                    right={<ToolButton onClick={() => ready && evaluate("rm(list = ls())")} title="Remove all objects" disabled={!ready}>🧹</ToolButton>}>
                    {env.length === 0 ? (
                        <div className="p-3 text-gray-500 text-xs">Environment is empty</div>
                    ) : (
                        <table className="w-full text-xs font-mono">
                            <tbody>
                                {env.map(([name, cls, desc]) => (
                                    <tr key={name} className="border-b border-gray-800 align-top">
                                        <td className="px-2 py-1 text-ubt-gedit-blue whitespace-nowrap">{name}</td>
                                        <td className="px-2 py-1 text-gray-400 whitespace-nowrap">{cls}</td>
                                        <td className="px-2 py-1 text-gray-300 break-all">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Pane>

                {/* console */}
                <Pane title="Console" className="md:col-span-3">
                    <div className="p-2 font-mono text-xs leading-snug" onClick={() => document.getElementById("r-ide-console-input")?.focus()}>
                        {log.map((e, i) => (
                            <div key={i} className={"whitespace-pre-wrap break-words " + (
                                e.kind === "input" ? "text-ubt-gedit-blue" :
                                    e.kind === "stderr" ? "text-ubt-gedit-orange" :
                                        e.kind === "info" ? "text-gray-400 mb-2" : "text-gray-100")}>
                                {e.kind === "input" ? e.text.split("\n").map((l, j) => (j ? "+ " : "> ") + l).join("\n") : e.text}
                            </div>
                        ))}
                        <div className="flex items-start" ref={consoleEnd}>
                            <span className="text-ubt-gedit-blue mr-1">{pending ? "+" : ">"}</span>
                            <textarea id="r-ide-console-input" value={input} rows={Math.max(1, input.split("\n").length)}
                                onChange={e => setInput(e.target.value)} onKeyDown={onConsoleKey} spellCheck={false}
                                disabled={!ready} placeholder={ready ? "" : status}
                                className="flex-1 bg-transparent outline-none resize-none text-gray-100 placeholder-gray-500" />
                        </div>
                    </div>
                </Pane>

                {/* plots */}
                <Pane title={plots.length ? `Plots (${plotIdx + 1}/${plots.length})` : "Plots"} className="md:col-span-2"
                    right={<>
                        <ToolButton onClick={() => setPlotIdx(i => Math.max(0, i - 1))} disabled={plotIdx <= 0} title="Previous plot">◀</ToolButton>
                        <ToolButton onClick={() => setPlotIdx(i => Math.min(plots.length - 1, i + 1))} disabled={plotIdx >= plots.length - 1} title="Next plot">▶</ToolButton>
                        {plot && <a href={plot} download={`plot-${plotIdx + 1}.png`} title="Save as PNG" className="px-2 text-xs hover:bg-gray-50 hover:bg-opacity-10 rounded">⤓</a>}
                    </>}>
                    <div ref={plotBox} className="w-full h-full flex items-center justify-center bg-white">
                        {plot ? <img src={plot} alt={`R plot ${plotIdx + 1}`} className="max-w-full max-h-full" />
                            : <span className="text-gray-400 text-xs">Plots appear here</span>}
                    </div>
                </Pane>
            </div>
        </div>
    );
}

export const displayRIde = () => <RIde />;
