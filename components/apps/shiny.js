import React, { useMemo, useState } from 'react';
import LZString from 'lz-string';
import survivalExplorer from '../../shiny-apps/survival-explorer/app.R';

// Shiny apps that run 100% in the browser via Shinylive (webR).
// The app source is compressed into the URL hash, so nothing is sent to a server.
const SHINY_APPS = [
    { id: "survival-explorer", title: "Survival Explorer", files: [{ name: "app.R", content: survivalExplorer }] },
];

const shinyliveUrl = (files, mode) =>
    `https://shinylive.io/r/${mode}/#code=` + LZString.compressToEncodedURIComponent(JSON.stringify(files));

export function ShinyApps() {
    const [active, setActive] = useState(SHINY_APPS[0].id);
    const [mode, setMode] = useState("app");
    const app = SHINY_APPS.find(a => a.id === active);
    const src = useMemo(() => shinyliveUrl(app.files, mode), [app, mode]);

    return (
        <div className="w-full h-full flex flex-col bg-ub-cool-grey text-white text-sm">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-black select-none">
                <div className="flex items-center">
                    <img className="w-5 mr-2" src="./themes/Yaru/apps/shiny.svg" alt="Shiny" />
                    {SHINY_APPS.length > 1 ? (
                        <select value={active} onChange={e => setActive(e.target.value)} className="bg-ub-grey text-white rounded px-1 outline-none">
                            {SHINY_APPS.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                    ) : <span className="font-medium">{app.title}</span>}
                    <span className="ml-3 text-gray-400 hidden md:inline">first launch downloads R (~30 MB) — give it a moment</span>
                </div>
                <div className="flex rounded overflow-hidden border border-gray-600">
                    {[["app", "App"], ["editor", "Code"]].map(([m, label]) => (
                        <button key={m} onClick={() => setMode(m)} className={(mode === m ? "bg-ub-orange" : "hover:bg-gray-50 hover:bg-opacity-10") + " px-2 py-0.5 outline-none focus:outline-none"}>{label}</button>
                    ))}
                </div>
            </div>
            <iframe key={src} src={src} title={app.title} className="flex-grow w-full bg-white" frameBorder="0" allow="cross-origin-isolated"></iframe>
        </div>
    );
}

export const displayShiny = () => <ShinyApps />;
