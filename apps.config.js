import displayVsCode from './components/apps/vscode';
import { displayTerminal } from './components/apps/terminal';
import { displaySettings } from './components/apps/settings';
import { displayChrome } from './components/apps/chrome';
import { displayTrash } from './components/apps/trash';
import { displayGedit } from './components/apps/gedit';
import { displayAboutMe } from './components/apps/about';
import { displayShiny } from './components/apps/shiny';
import dynamic from 'next/dynamic';

// Heavy R apps are code-split: their JS (CodeMirror etc.) loads only when opened.
const loading = () => <div className="w-full h-full flex items-center justify-center bg-ub-cool-grey text-gray-400 text-sm">Loading…</div>;
const RIde = dynamic(() => import('./components/apps/r-ide').then(m => m.RIde), { ssr: false, loading });
const DataViewer = dynamic(() => import('./components/apps/data-viewer').then(m => m.DataViewer), { ssr: false, loading });
const displayRIde = () => <RIde />;
const displayDataViewer = () => <DataViewer />;
import site from './site.config';
import { displayTerminalCalc } from './components/apps/calc';
import { displayFolder, FOLDERS } from './components/apps/files';
import { displayCV } from './components/apps/cv';

const apps = [
    // Desktop folders (open in the Files window, see components/apps/files.js)
    {
        id: "folder-cv",
        title: FOLDERS.cv.title,
        icon: FOLDERS.cv.icon,
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayFolder("cv"),
    },
    {
        id: "folder-projects",
        title: FOLDERS.projects.title,
        icon: FOLDERS.projects.icon,
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayFolder("projects"),
    },
    {
        id: "folder-teaching",
        title: FOLDERS.teaching.title,
        icon: FOLDERS.teaching.icon,
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayFolder("teaching"),
    },
    {
        id: "cv",
        title: "CV",
        icon: './themes/Yaru/system/cv-document.svg',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayCV,
    },
    {
        id: "chrome",
        title: "Google Chrome",
        icon: './themes/Yaru/apps/chrome.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayChrome,
    },
    {
        id: "calc",
        title: "Calc",
        icon: './themes/Yaru/apps/calc.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayTerminalCalc,
    },
    {
        id: "about-me",
        title: `About ${site.name.split(" ")[0]}`,
        icon: './themes/Yaru/system/user-home.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayAboutMe,
    },
    {
        id: "r-ide",
        title: "R IDE",
        icon: './themes/Yaru/apps/r-ide.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayRIde,
    },
    {
        id: "data-viewer",
        title: "Data Viewer",
        icon: './themes/Yaru/apps/data-viewer.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayDataViewer,
    },
    {
        id: "vscode",
        title: "Visual Studio Code",
        icon: './themes/Yaru/apps/vscode.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayVsCode,
    },
    {
        id: "terminal",
        title: "Terminal",
        icon: './themes/Yaru/apps/bash.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displayTerminal,
    },
    {
        id: "shiny",
        title: "Survival Explorer (Shiny)",
        icon: './themes/Yaru/apps/shiny.svg',
        disabled: false,
        favourite: true,
        desktop_shortcut: true,
        screen: displayShiny,
    },
    {
        id: "settings",
        title: "Settings",
        icon: './themes/Yaru/apps/gnome-control-center.png',
        disabled: false,
        favourite: true,
        desktop_shortcut: false,
        screen: displaySettings,
    },
    {
        id: "trash",
        title: "Trash",
        icon: './themes/Yaru/system/user-trash-full.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: true,
        screen: displayTrash,
    },
    {
        id: "gedit",
        title: "Contact Me",
        icon: './themes/Yaru/apps/gedit.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        screen: displayGedit,
    },
    {
        id: "github",
        title: "GitHub",
        icon: './themes/Yaru/apps/github.png',
        disabled: false,
        favourite: false,
        desktop_shortcut: false,
        isExternalApp: true,
        url: site.github,
        screen: () => {},
    },
]
    // Hide apps switched off in site.config.js → show
    .filter(app => (app.id !== "cv" || site.show.cv) && (app.id !== "about-me" || site.show.aboutMe));

export default apps;