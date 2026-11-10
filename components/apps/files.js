import React, { useState } from 'react';
import site from '../../site.config';

// Desktop folders, shown in a small Nautilus-style file manager.
// Item actions: { app: "<app id>" } opens a desktop app, { url } opens a link in a new tab.
export const FOLDERS = {
    projects: {
        title: "Projects",
        icon: "./themes/Yaru/system/folder-projects.svg",
        items: () => site.projects.map(p => ({
            name: p.shortName || p.name,
            icon: p.icon || "./themes/Yaru/system/folder.png",
            url: p.link,
            note: p.description[0],
        })),
    },
    teaching: {
        title: "Teaching",
        icon: "./themes/Yaru/system/folder.png",
        items: () => site.teaching.map(item => ({
            name: item.shortName || item.name,
            icon: item.icon || "./themes/Yaru/system/folder.png",
            url: item.link,
            note: item.description?.[0] || item.name,
        })),
    },
    cv: {
        // Named "About" when the CV is hidden (it still holds contact links)
        title: site.show.cv ? "CV" : "About",
        icon: "./themes/Yaru/system/folder-cv.svg",
        items: () => [
            ...(site.show.cv ? [{ name: "CV", icon: "./themes/Yaru/system/cv-document.svg", app: "cv", note: "Full CV" }] : []),
            ...(site.show.aboutMe ? [{ name: `About ${site.name.split(" ")[0]}`, icon: "./themes/Yaru/system/user-home.png", app: "about-me", note: "Bio, education, skills and projects" }] : []),
            { name: "Contact Me", icon: "./themes/Yaru/apps/gedit.png", app: "gedit", note: "Send me a message" },
            { name: "Home", icon: "./themes/Yaru/apps/chrome.png", url: site.url, note: site.url },
            ...(site.teachingMaterials ? [{ name: "Teaching Materials", icon: "./themes/Yaru/system/folder.png", url: site.teachingMaterials, note: site.teachingMaterials }] : []),
            ...(site.profile ? [{ name: "LSHTM profile", icon: "./themes/Yaru/apps/chrome.png", url: site.profile, note: site.profile }] : []),
            ...(site.scholar ? [{ name: "Google Scholar", icon: "./themes/Yaru/apps/chrome.png", url: site.scholar, note: site.scholar }] : []),
            { name: "GitHub", icon: "./themes/Yaru/apps/github.png", url: site.github, note: site.github },
        ],
    },
};

export function Files({ folder: initial, openApp }) {
    const [folder, setFolder] = useState(initial);
    const [selected, setSelected] = useState(null);
    const current = FOLDERS[folder];
    const items = current.items();

    const open = (item) => {
        if (item.url) window.open(item.url, "_blank", "noopener");
        else if (item.app && openApp) openApp(item.app);
    };

    return (
        <div className="w-full h-full flex flex-col bg-ub-cool-grey text-white select-none">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-black border-opacity-40 bg-ub-window-title text-sm">
                <span className="text-gray-400">Home ›</span>
                <span className="px-2 py-0.5 rounded bg-white bg-opacity-10">{current.title}</span>
                <span className="ml-auto text-xs text-gray-400">{items.length} items</span>
            </div>
            <div className="flex flex-grow min-h-0">
                <div className="hidden sm:flex flex-col w-40 shrink-0 py-2 text-sm border-r border-black border-opacity-40">
                    {Object.entries(FOLDERS).map(([id, f]) => (
                        <div key={id} onClick={() => { setFolder(id); setSelected(null); }}
                            className={(id === folder ? "bg-ub-orange " : "hover:bg-white hover:bg-opacity-5 ") + "flex items-center gap-2 px-3 py-1.5 cursor-default"}>
                            <img src={f.icon} alt="" className="w-5 h-5" />{f.title}
                        </div>
                    ))}
                </div>
                <div className="flex-grow overflow-y-auto p-4" onClick={() => setSelected(null)}>
                    <div className="flex flex-wrap content-start gap-2">
                        {items.map((item, i) => (
                            <div key={item.name} tabIndex={0}
                                title={item.note}
                                onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                                onDoubleClick={() => open(item)}
                                onKeyDown={(e) => { if (e.key === "Enter") open(item); }}
                                className={(selected === i ? "bg-ub-orange bg-opacity-50 border-yellow-700 " : "border-transparent hover:bg-white hover:bg-opacity-10 ") + "relative w-32 p-2 flex flex-col items-center text-center text-xs border rounded outline-none"}>
                                <div className="relative mb-1.5">
                                    <img src={item.icon} alt="" className="w-14 h-14 object-contain" />
                                    {item.url && <img src="./themes/Yaru/status/arrow-up-right.svg" alt="" className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5" />}
                                </div>
                                <span className="leading-tight">{item.name}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-6 text-xs text-gray-400">Double-click to open.</p>
                </div>
            </div>
        </div>
    );
}

export const displayFolder = (folder) => (_addFolder, openApp) => <Files folder={folder} openApp={openApp} />;
