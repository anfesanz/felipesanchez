import React, { useMemo } from 'react';
import cvMarkdown from '../../content/cv.md';
import site from '../../site.config';

// Minimal Markdown → HTML for the CV: headings, bullet lists, paragraphs,
// [links](url), **bold** and bare URLs. Enough for content/cv.md; not a general parser.
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function inline(text) {
    const links = [];
    let s = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => { links.push([t, u]); return `\u0000${links.length - 1}\u0000`; });
    s = esc(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;)])/g, '<a href="$1" target="_blank" rel="noreferrer">$1</a>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => {
        const [t, u] = links[i];
        return `<a href="${esc(u)}" target="_blank" rel="noreferrer">${esc(t)}</a>`;
    });
}

export function markdownToHtml(md) {
    const out = [];
    let list = null, para = [];
    const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
    const flushList = () => { if (list) { out.push(`<ul>${list.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`); list = null; } };
    for (const raw of md.split('\n')) {
        const line = raw.trim();
        const h = line.match(/^(#{1,3})\s+(.*)$/);
        if (h) { flushPara(); flushList(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
        const li = line.match(/^[-*]\s+(.*)$/);
        if (li) { flushPara(); (list = list || []).push(li[1]); continue; }
        if (!line) { flushPara(); flushList(); continue; }
        flushList();
        para.push(line);
    }
    flushPara(); flushList();
    return out.join('\n');
}

const STYLE = `
.cv-doc { font-family: 'Ubuntu', sans-serif; color: #222; line-height: 1.5; font-size: 14px; }
.cv-doc h1 { font-size: 30px; font-weight: 700; margin: 0 0 2px; color: #111; }
.cv-doc h1 + p { font-size: 16px; color: #E95420; margin: 0; }
.cv-doc h2 { font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #E95420; border-bottom: 2px solid #E95420; padding-bottom: 2px; margin: 26px 0 10px; }
.cv-doc h3 { font-size: 15px; font-weight: 700; margin: 16px 0 0; color: #111; }
.cv-doc h3 + p { color: #666; font-size: 13px; margin: 0 0 4px; }
.cv-doc p { margin: 6px 0; }
.cv-doc ul { list-style: disc; padding-left: 20px; margin: 4px 0; }
.cv-doc li { margin: 3px 0; }
.cv-doc a { color: #1a5fb4; text-decoration: underline; word-break: break-word; }
`;

export function CV() {
    const html = useMemo(() => markdownToHtml(cvMarkdown), []);

    const printable = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${site.name} CV</title>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&display=swap" rel="stylesheet">
<style>body{margin:0;padding:32px;max-width:820px;margin:auto}${STYLE}@media print{body{padding:0}}</style></head>
<body><div class="cv-doc">${html}</div><script>window.onload=()=>setTimeout(()=>window.print(),400)<\/script></body></html>`);
        w.document.close();
    };

    return (
        <div className="w-full h-full flex flex-col bg-ub-cool-grey">
            <style>{STYLE}</style>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-ub-window-title border-b border-black border-opacity-40 text-white text-sm select-none">
                <span className="text-gray-300">CV_{site.name.replace(/\s+/g, '_')}.md</span>
                <button onClick={printable} className="ml-auto px-3 py-0.5 rounded bg-ub-orange hover:bg-opacity-90 text-white text-xs">Print / Save as PDF</button>
            </div>
            <div className="flex-grow overflow-y-auto py-6 px-3">
                <div className="cv-doc bg-white max-w-3xl mx-auto shadow-lg rounded-sm px-6 sm:px-12 py-10" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </div>
    );
}

export const displayCV = () => <CV />;
