import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getR } from '../../lib/webr';

// Built-in datasets (from packages installed at R startup).
const BUILTIN = [
    { id: "survival::lung", label: "lung: NCCTG lung cancer" },
    { id: "survival::veteran", label: "veteran: VA lung cancer trial" },
    { id: "survival::colon", label: "colon: adjuvant chemotherapy" },
    { id: "survival::pbc", label: "pbc: primary biliary cholangitis" },
    { id: "survival::ovarian", label: "ovarian: ovarian cancer survival" },
];

const PAGE = 100;

// Turn factors/dates into text so they survive the R -> JS conversion.
const PREP = `function(x) {
    x <- as.data.frame(x)
    x[] <- lapply(x, function(col) if (is.factor(col) || inherits(col, c("Date", "POSIXt"))) as.character(col) else col)
    x
}`;

const GLOBAL_DFS = `paste(Filter(function(n) is.data.frame(get(n, envir = globalenv())), ls(globalenv())), collapse = "\\n")`;

function summarise(values) {
    const present = values.filter(v => v !== null && v !== undefined && !(typeof v === "number" && isNaN(v)));
    const na = values.length - present.length;
    if (present.length && present.every(v => typeof v === "number")) {
        const sorted = [...present].sort((a, b) => a - b);
        const mean = present.reduce((a, b) => a + b, 0) / present.length;
        const median = sorted[Math.floor((sorted.length - 1) / 2)];
        return { type: "num", text: `mean ${+mean.toPrecision(4)} · median ${+median.toPrecision(4)} · [${+sorted[0].toPrecision(4)}, ${+sorted[sorted.length - 1].toPrecision(4)}]`, na };
    }
    const unique = new Set(present).size;
    return { type: "chr", text: `${unique} unique`, na };
}

export function DataViewer() {
    const [status, setStatus] = useState("Starting R…");
    const [ready, setReady] = useState(false);
    const [sources, setSources] = useState(BUILTIN);
    const [source, setSource] = useState(BUILTIN[0].id);
    const [rows, setRows] = useState([]);
    const [cols, setCols] = useState([]);
    const [sort, setSort] = useState({ col: null, dir: 1 });
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(0);

    const refreshSources = useCallback(async () => {
        const { webR } = await getR();
        const txt = await webR.evalRString(GLOBAL_DFS);
        const mine = txt ? txt.split("\n").map(n => ({ id: "env:" + n, label: `${n} (your environment)` })) : [];
        setSources([...mine, ...BUILTIN]);
    }, []);

    const load = useCallback(async (id) => {
        setStatus("Loading " + id.replace("env:", "") + "…");
        const { webR, shelter } = await getR();
        try {
            const expr = id.startsWith("env:")
                ? `(${PREP})(get(nm, envir = globalenv()))`
                : `(${PREP})(${id})`;
            const df = await shelter.evalR(expr, { env: { nm: id.replace("env:", "") } });
            const data = await df.toD3();
            const names = await webR.evalRRaw(`names(${id.startsWith("env:") ? "get(nm, envir = globalenv())" : id})`, "string[]", { env: { nm: id.replace("env:", "") } });
            setCols(names);
            setRows(data);
            setSort({ col: null, dir: 1 });
            setPage(0);
            setStatus("");
        } catch (err) {
            setStatus("Could not load: " + (err.message || err));
        } finally {
            await shelter.purge();
        }
    }, []);

    useEffect(() => {
        let alive = true;
        getR(msg => alive && setStatus(msg)).then(async () => {
            if (!alive) return;
            setReady(true);
            await refreshSources();
            await load(BUILTIN[0].id);
        }).catch(err => alive && setStatus("Could not start R: " + (err.message || err)));
        return () => { alive = false; };
    }, [load, refreshSources]);

    const view = useMemo(() => {
        let out = rows;
        const q = filter.trim().toLowerCase();
        if (q) out = out.filter(r => cols.some(c => String(r[c] ?? "").toLowerCase().includes(q)));
        if (sort.col) {
            const c = sort.col;
            out = [...out].sort((a, b) => {
                const x = a[c], y = b[c];
                if (x === y) return 0;
                if (x === null || x === undefined) return 1;   // NAs last
                if (y === null || y === undefined) return -1;
                return (x < y ? -1 : 1) * sort.dir;
            });
        }
        return out;
    }, [rows, cols, filter, sort]);

    const summaries = useMemo(() => Object.fromEntries(cols.map(c => [c, summarise(rows.map(r => r[c]))])), [rows, cols]);
    const pages = Math.max(1, Math.ceil(view.length / PAGE));
    const shown = view.slice(page * PAGE, (page + 1) * PAGE);

    const toggleSort = (c) => setSort(s => s.col === c ? (s.dir === 1 ? { col: c, dir: -1 } : { col: null, dir: 1 }) : { col: c, dir: 1 });

    const fmt = (v) => v === null || v === undefined || (typeof v === "number" && isNaN(v))
        ? <span className="text-gray-500 italic">NA</span>
        : typeof v === "number" ? +v.toPrecision(6) : String(v);

    return (
        <div className="w-full h-full flex flex-col bg-ub-cool-grey text-white text-sm">
            <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 border-b border-black select-none">
                <select value={source} disabled={!ready}
                    onChange={e => { setSource(e.target.value); load(e.target.value); }}
                    onFocus={refreshSources}
                    className="bg-ub-grey text-white rounded px-1 py-0.5 outline-none text-xs max-w-xs">
                    {sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <input value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }} placeholder="Filter…"
                    className="bg-ub-grey rounded px-2 py-0.5 outline-none text-xs w-40" />
                <span className="text-xs text-gray-400">
                    {status || `${view.length.toLocaleString()} of ${rows.length.toLocaleString()} rows · ${cols.length} columns`}
                </span>
                <div className="ml-auto flex items-center gap-1 text-xs">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-2 rounded hover:bg-gray-50 hover:bg-opacity-10 disabled:opacity-30 outline-none focus:outline-none">◀</button>
                    <span>{page + 1} / {pages}</span>
                    <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="px-2 rounded hover:bg-gray-50 hover:bg-opacity-10 disabled:opacity-30 outline-none focus:outline-none">▶</button>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto bg-ub-grey">
                <table className="text-xs font-mono border-collapse">
                    <thead className="sticky top-0 bg-ub-window-title z-10">
                        <tr>
                            <th className="px-2 py-1 text-right text-gray-500 font-normal border-r border-black">#</th>
                            {cols.map(c => (
                                <th key={c} onClick={() => toggleSort(c)} title={`${summaries[c]?.text || ""}${summaries[c]?.na ? ` · ${summaries[c].na} NA` : ""}`}
                                    className="px-2 py-1 text-left cursor-pointer whitespace-nowrap border-r border-black hover:bg-gray-50 hover:bg-opacity-5 select-none align-top">
                                    <div className="text-white">{c}{sort.col === c ? (sort.dir === 1 ? " ▲" : " ▼") : ""}</div>
                                    <div className="text-gray-500 font-normal">{summaries[c]?.type === "num" ? "numeric" : "text"}{summaries[c]?.na ? ` · ${summaries[c].na} NA` : ""}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map((r, i) => (
                            <tr key={i} className="odd:bg-black odd:bg-opacity-20 hover:bg-ub-orange hover:bg-opacity-20">
                                <td className="px-2 py-0.5 text-right text-gray-500 border-r border-black">{page * PAGE + i + 1}</td>
                                {cols.map(c => (
                                    <td key={c} className={"px-2 py-0.5 whitespace-nowrap border-r border-gray-800 " + (typeof r[c] === "number" ? "text-right" : "")}>{fmt(r[c])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export const displayDataViewer = () => <DataViewer />;
