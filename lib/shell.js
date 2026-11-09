// A small bash-like shell over an in-memory filesystem, used by the Terminal app.
// Pure logic: no React, no DOM. `run(line)` returns { html, actions } and the
// Terminal renders the HTML and performs the actions (open an app, clear, R…).
//
// Supports: quoting, pipes (|), redirects (> >>), sequences (; &&), ~ . .. paths,
// and the usual file commands. Changes live for the browser session only.

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const dir = (children = {}, extra = {}) => ({ type: 'dir', children, ...extra });
const file = (content = '', extra = {}) => ({ type: 'file', content, ...extra });

// Commands that open desktop apps: name -> app id
const APP_COMMANDS = {
    code: 'vscode', chrome: 'chrome', shiny: 'shiny', ide: 'r-ide', rstudio: 'r-ide',
    view: 'data-viewer', data: 'data-viewer', about: 'about-me', 'about-me': 'about-me', files: 'folder-projects',
    trash: 'trash', settings: 'settings', sendmsg: 'gedit', gedit: 'gedit', terminal: 'terminal',
    calc: 'calc', 'gnome-calculator': 'calc', nautilus: 'folder-projects',
};

const HELP = {
    files: 'ls [-la] · cd · pwd · tree · cat · less · head [-n N] · tail [-n N] · wc [-lwc] · grep [-inv] · find [-name] · sort · uniq',
    edit: 'touch · mkdir [-p] · rm [-rf] · rmdir · cp [-r] · mv · echo (with > or >>)',
    system: 'whoami · hostname · uname [-a] · date · history · which · neofetch · clear · exit · man',
    apps: 'R · ide · code · shiny · view · chrome · about · open <project> · sendmsg · settings · trash · calc',
};

export function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildFs(site, extraFiles) {
    const projects = {};
    site.projects.forEach(p => {
        projects[slug(p.name)] = dir({
            'README.md': file(
                `# ${p.name} (${p.date})\n\n` + p.description.join('\n\n') +
                `\n\nTags: ${(p.tags || []).join(', ')}\nRepository: ${p.link}\n\nRun 'open ${slug(p.name)}' to visit it.\n`
            ),
        }, { url: p.link });
    });

    const links = [
        ['Email', site.email], ['GitHub', site.github], ['LinkedIn', site.linkedin],
        ['Scholar', site.scholar], ['ORCID', site.orcid],
    ].filter(([, v]) => v).map(([k, v]) => `${k.padEnd(9)} ${v}`).join('\n');

    const home = dir({
        'README.md': file(`Welcome to ${site.name}'s home directory.\n\nTry: ls, cd projects, cat contact.txt, tree, R\nType 'help' for every command.\n`),
        ...(site.show.aboutMe ? { 'about.txt': file(`${site.name}\n${site.role}, ${site.affiliation}\n\n${site.bio.join('\n\n')}\n`) } : {}),
        'contact.txt': file(links + '\n\nOr type sendmsg to write to me.\n'),
        ...(extraFiles.cv && site.show.cv ? { 'cv.md': file(extraFiles.cv) } : {}),
        '.bashrc': file(`# ~/.bashrc\nexport R_LIBS_USER=~/R\nalias ll='ls -la'\nalias rstudio='ide'\n`),
        Desktop: dir({}, { desktop: true }),
        projects: dir(projects),
        'shiny-apps': dir({ 'survival-explorer': dir({ 'app.R': file(extraFiles.shinyApp || '') }) }),
        'r-scripts': dir(Object.fromEntries(Object.entries(extraFiles.rScripts || {}).map(([k, v]) => [k, file(v)]))),
        data: dir({
            'lung.csv': file('# NCCTG Lung Cancer Data (R package "survival")\n# 228 obs. of 10 variables:\n# inst, time, status, age, sex, ph.ecog, ph.karno, pat.karno, meal.cal, wt.loss\n# Browse it with: view    or in R: head(lung)\n'),
            'veteran.csv': file('# Veterans\' Administration Lung Cancer study (R package "survival")\n# 137 obs. of 8 variables:\n# trt, celltype, time, status, karno, diagtime, age, prior\n# Browse it with: view    or in R: head(veteran)\n'),
            'colon.csv': file('# Chemotherapy for Stage B/C colon cancer (R package "survival")\n# 1858 obs. of 16 variables\n# Browse it with: view    or in R: head(colon)\n'),
        }),
        skills: dir({
            'languages.txt': file(site.skills.languages.join('\n') + '\n'),
            'r-packages.txt': file(site.skills.r.join('\n') + '\n'),
            'methods.txt': file(site.skills.methods.join('\n') + '\n'),
        }),
        'personal-documents': dir({}, { locked: true }),
    });

    return dir({
        home: dir({ [site.shortName]: home }),
        tmp: dir(),
        etc: dir({ hostname: file(site.host + '\n'), 'os-release': file('NAME="Ubuntu"\nVERSION="20.04 LTS (Focal Fossa)"\n') }),
        usr: dir({ bin: dir() }),
    });
}

// ---------- tokenizer ----------
function tokenize(line) {
    const tokens = [];
    let cur = '', quote = null, has = false, quoted = false;
    const push = () => { if (has) tokens.push({ w: cur, q: quoted }); cur = ''; has = false; quoted = false; };
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quote) {
            if (c === quote) quote = null; else cur += c;
            continue;
        }
        if (c === '"' || c === "'") { quote = c; has = true; quoted = true; continue; }
        if (c === '\\' && i + 1 < line.length) { cur += line[++i]; has = true; continue; }
        if (/\s/.test(c)) { push(); continue; }
        if (c === '|' || c === ';') { push(); tokens.push({ op: c }); continue; }
        if (c === '&' && line[i + 1] === '&') { push(); tokens.push({ op: '&&' }); i++; continue; }
        if (c === '>') { push(); if (line[i + 1] === '>') { tokens.push({ op: '>>' }); i++; } else tokens.push({ op: '>' }); continue; }
        cur += c; has = true;
    }
    if (quote) throw new Error('unexpected EOF while looking for matching `' + quote + "'");
    push();
    return tokens;
}

// "a | b > f ; c && d" -> [{ pipeline: [[a],[b]], redirect, sep }]
function parse(tokens) {
    const seqs = [];
    let pipeline = [[]], redirect = null;
    const finish = (sep) => {
        if (pipeline.some(c => c.length) || redirect) seqs.push({ pipeline, redirect, sep });
        pipeline = [[]]; redirect = null;
    };
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.op === '|') pipeline.push([]);
        else if (t.op === '>' || t.op === '>>') {
            const target = tokens[++i];
            if (!target || target.op) throw new Error("syntax error near unexpected token `newline'");
            redirect = { append: t.op === '>>', path: target.w };
        }
        else if (t.op === ';' || t.op === '&&') finish(t.op);
        else pipeline[pipeline.length - 1].push(t);
    }
    finish(null);
    for (const s of seqs) if (s.pipeline.some(c => c.length === 0)) throw new Error("syntax error near unexpected token `|'");
    return seqs;
}

// split "-la" style flags from args; "-n 5" handled per-command
function flags(args) {
    const f = new Set(), rest = [];
    let end = false;
    for (const a of args) {
        if (!end && a === '--') { end = true; continue; }
        if (!end && /^-[a-zA-Z]+$/.test(a)) a.slice(1).split('').forEach(c => f.add(c));
        else rest.push(a);
    }
    return { f, rest };
}

function globToRegex(g) {
    return new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
}

export function createShell(site, extraFiles = {}) {
    const root = buildFs(site, extraFiles);
    const HOME = `/home/${site.shortName}`;
    const state = { cwd: HOME, history: [] };

    // ---------- paths ----------
    const resolve = (p) => {
        if (!p || p === '~') return HOME;
        if (p.startsWith('~/')) p = HOME + p.slice(1);
        const parts = (p.startsWith('/') ? [] : state.cwd.split('/').filter(Boolean));
        for (const seg of p.split('/')) {
            if (!seg || seg === '.') continue;
            if (seg === '..') parts.pop(); else parts.push(seg);
        }
        return '/' + parts.join('/');
    };
    const display = (abs) => abs === HOME ? '~' : abs.startsWith(HOME + '/') ? '~' + abs.slice(HOME.length) : abs;
    const lookup = (abs) => {
        let node = root;
        for (const seg of abs.split('/').filter(Boolean)) {
            if (node.type !== 'dir' || !node.children[seg]) return null;
            node = node.children[seg];
        }
        return node;
    };
    const parentOf = (abs) => {
        const i = abs.lastIndexOf('/');
        return { dirPath: abs.slice(0, i) || '/', name: abs.slice(i + 1) };
    };
    const pathsUnder = (abs) => abs.split('/').filter(Boolean).reduce((acc, seg) => { acc.push((acc[acc.length - 1] || '') + '/' + seg); return acc; }, []);
    const isLocked = (abs) => pathsUnder(abs).some(p => lookup(p)?.locked);

    // ---------- helpers ----------
    class ShellError extends Error { }
    const fail = (msg) => { throw new ShellError(msg); };

    const getDir = (cmd, p) => {
        const abs = resolve(p), node = lookup(abs);
        if (!node) fail(`${cmd}: ${p}: No such file or directory`);
        if (isLocked(abs)) fail(`${cmd}: ${p}: Permission denied 😏`);
        return { abs, node };
    };
    const readFile = (cmd, p) => {
        const { node } = getDir(cmd, p);
        if (node.type === 'dir') fail(`${cmd}: ${p}: Is a directory`);
        return node.content;
    };
    const writeFile = (cmd, p, content, append = false) => {
        const abs = resolve(p), { dirPath, name } = parentOf(abs);
        const parent = lookup(dirPath);
        if (!parent || parent.type !== 'dir') fail(`${cmd}: ${p}: No such file or directory`);
        if (isLocked(dirPath)) fail(`${cmd}: ${p}: Permission denied`);
        const existing = parent.children[name];
        if (existing?.type === 'dir') fail(`${cmd}: ${p}: Is a directory`);
        parent.children[name] = file(append && existing ? existing.content + content : content);
    };
    // input from args (files) or stdin
    const inputOf = (cmd, files, stdin) => files.length ? files.map(f => readFile(cmd, f)).join('') : (stdin ?? '');
    const lines = (text) => { const l = text.split('\n'); if (l[l.length - 1] === '') l.pop(); return l; };
    const nArg = (args, def) => {
        const out = [];
        let n = def;
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '-n') n = parseInt(args[++i], 10);
            else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
            else if (/^-n\d+$/.test(args[i])) n = parseInt(args[i].slice(2), 10);
            else out.push(args[i]);
        }
        if (isNaN(n)) fail('invalid number of lines');
        return { n, files: out };
    };
    const lsName = (name, node) => node.type === 'dir'
        ? `<span class="font-bold text-ubt-blue">${escapeHtml(name)}</span>`
        : /\.(R|sh)$/.test(name) ? `<span class="font-bold text-ubt-green">${escapeHtml(name)}</span>` : escapeHtml(name);
    const sizeOf = (node) => node.type === 'dir' ? 4096 : new TextEncoder().encode(node.content).length;

    const deepCopy = (node) => JSON.parse(JSON.stringify(node));

    // ---------- commands: (args, stdin, ctx) -> { out, html? } ----------
    const commands = {
        help: () => ({
            out: Object.entries(HELP).map(([k, v]) => `${k.padEnd(7)} ${v}`).join('\n') +
                '\n\nPipes, redirects and sequences work: ls projects | wc -l ;  echo hi > note.txt && cat note.txt' +
                '\nTab completes commands and paths, ↑/↓ browse history, Ctrl+C cancels, Ctrl+L clears.\n',
        }),
        man: (args) => {
            if (!args[0]) return { out: 'What manual page do you want?\nFor example, try \'man ls\'.\n' };
            if (args[0] in commands || args[0] in APP_COMMANDS) return { out: `${args[0]}: see 'help' for the short version. This is a tiny shell, the manual is short 🙂\n` };
            fail(`No manual entry for ${args[0]}`);
        },
        pwd: () => ({ out: state.cwd + '\n' }),
        cd: (args) => {
            if (args.length > 1) fail('cd: too many arguments');
            const target = args[0] === '-' ? (state.oldpwd || state.cwd) : args[0];
            const { abs, node } = getDir('cd', target);
            if (node.type !== 'dir') fail(`cd: ${args[0]}: Not a directory`);
            state.oldpwd = state.cwd;
            state.cwd = abs;
            return { out: '' };
        },
        ls: (args) => {
            const { f, rest } = flags(args);
            const targets = rest.length ? rest : ['.'];
            const resolved = targets.map(t => ({ t, node: getDir('ls', t).node }));
            const groups = [];
            const fileEntries = resolved.filter(r => r.node.type !== 'dir').map(r => [r.t, r.node]);
            if (fileEntries.length) groups.push({ header: null, entries: fileEntries });
            resolved.filter(r => r.node.type === 'dir').forEach(({ t, node }) => {
                let entries = Object.entries(node.children);
                if (!f.has('a')) entries = entries.filter(([n]) => !n.startsWith('.'));
                entries.sort(([a], [b]) => a.localeCompare(b));
                if (f.has('a')) entries = [['.', node], ['..', node], ...entries];
                groups.push({ header: targets.length > 1 ? t + ':' : null, entries });
            });
            const blocks = [], plain = [];
            groups.forEach(({ header, entries }) => {
                const head = header ? `<div>${escapeHtml(header)}</div>` : '';
                if (header) plain.push(header);
                if (f.has('l')) {
                    const row = (nd) => `${nd.type === 'dir' ? (nd.locked ? 'd---------' : 'drwxr-xr-x') : '-rw-r--r--'} 1 ${site.shortName} ${site.shortName} ${String(sizeOf(nd)).padStart(5)} Nov  9 10:00 `;
                    blocks.push(head + `<div class="whitespace-pre">` + (header !== null || groups.length === 1 && fileEntries.length === 0 ? `total ${entries.length}\n` : '') + entries.map(([n, nd]) => escapeHtml(row(nd)) + lsName(n, nd)).join('\n') + '</div>');
                    plain.push(...entries.map(([n, nd]) => row(nd) + n));
                } else {
                    blocks.push(head + `<div class="flex flex-wrap">` + entries.map(([n, nd]) => `<span class="mr-4">${lsName(n, nd)}</span>`).join('') + '</div>');
                    plain.push(...entries.map(([n]) => n));
                }
            });
            return { out: plain.join('\n') + (plain.length ? '\n' : ''), html: blocks.join('<div class="h-2"></div>') };
        },
        tree: (args) => {
            const start = args[0] || '.';
            const { node } = getDir('tree', start);
            const out = [start];
            let dirs = 0, files = 0;
            const walk = (nd, prefix) => {
                const entries = Object.entries(nd.children).filter(([n]) => !n.startsWith('.')).sort(([a], [b]) => a.localeCompare(b));
                entries.forEach(([n, c], i) => {
                    const last = i === entries.length - 1;
                    out.push(prefix + (last ? '└── ' : '├── ') + n);
                    if (c.type === 'dir') { dirs++; if (!c.locked) walk(c, prefix + (last ? '    ' : '│   ')); }
                    else files++;
                });
            };
            if (node.type === 'dir') walk(node, '');
            out.push('', `${dirs} directories, ${files} files`);
            return { out: out.join('\n') + '\n' };
        },
        cat: (args, stdin) => ({ out: inputOf('cat', args, stdin) }),
        less: (args, stdin) => commands.cat(args, stdin),
        more: (args, stdin) => commands.cat(args, stdin),
        head: (args, stdin) => {
            const { n, files } = nArg(args, 10);
            return { out: lines(inputOf('head', files, stdin)).slice(0, n).map(l => l + '\n').join('') };
        },
        tail: (args, stdin) => {
            const { n, files } = nArg(args, 10);
            return { out: lines(inputOf('tail', files, stdin)).slice(-n).map(l => l + '\n').join('') };
        },
        wc: (args, stdin) => {
            const { f, rest } = flags(args);
            const text = inputOf('wc', rest, stdin);
            const counts = { l: lines(text).length, w: text.split(/\s+/).filter(Boolean).length, c: new TextEncoder().encode(text).length };
            const pick = f.size ? ['l', 'w', 'c'].filter(k => f.has(k)) : ['l', 'w', 'c'];
            return { out: pick.map(k => String(counts[k]).padStart(f.size === 1 ? 0 : 7)).join(' ') + (rest.length === 1 ? ' ' + rest[0] : '') + '\n' };
        },
        grep: (args, stdin) => {
            const { f, rest } = flags(args);
            if (!rest.length) fail('Usage: grep [-inv] PATTERN [FILE]...');
            const [pattern, ...files] = rest;
            let re;
            try { re = new RegExp(pattern, f.has('i') ? 'i' : ''); } catch (e) { fail(`grep: invalid pattern '${pattern}'`); }
            const sources = files.length ? files.map(p => [p, readFile('grep', p)]) : [[null, stdin ?? '']];
            const out = [];
            sources.forEach(([name, text]) => lines(text).forEach((l, i) => {
                if (re.test(l) !== f.has('v')) out.push((files.length > 1 ? name + ':' : '') + (f.has('n') ? (i + 1) + ':' : '') + l);
            }));
            return { out: out.map(l => l + '\n').join(''), status: out.length ? 0 : 1 };
        },
        sort: (args, stdin) => {
            const { f, rest } = flags(args);
            let l = lines(inputOf('sort', rest, stdin));
            l = f.has('n') ? l.sort((a, b) => parseFloat(a) - parseFloat(b)) : l.sort((a, b) => a.localeCompare(b));
            if (f.has('r')) l.reverse();
            return { out: l.map(x => x + '\n').join('') };
        },
        uniq: (args, stdin) => ({ out: lines(inputOf('uniq', args, stdin)).filter((l, i, a) => i === 0 || l !== a[i - 1]).map(x => x + '\n').join('') }),
        find: (args) => {
            let start = '.', namePat = null, type = null;
            for (let i = 0; i < args.length; i++) {
                if (args[i] === '-name' || args[i] === '-iname') namePat = globToRegex(args[++i] || '');
                else if (args[i] === '-type') type = args[++i];
                else start = args[i];
            }
            const { node } = getDir('find', start);
            const out = [];
            const walk = (nd, p) => {
                const name = p.split('/').pop();
                if ((!namePat || namePat.test(name)) && (!type || (type === 'd') === (nd.type === 'dir'))) out.push(p);
                if (nd.type === 'dir' && !nd.locked) Object.entries(nd.children).sort(([a], [b]) => a.localeCompare(b)).forEach(([n, c]) => walk(c, p.replace(/\/$/, '') + '/' + n));
            };
            walk(node, start);
            return { out: out.map(x => x + '\n').join('') };
        },
        echo: (args) => {
            const n = args[0] === '-n';
            const text = (n ? args.slice(1) : args).join(' ').replace(/\$(HOME|USER|PWD|SHELL|HOSTNAME)\b/g, (_, v) => ({ HOME, USER: site.shortName, PWD: state.cwd, SHELL: '/bin/bash', HOSTNAME: site.host }[v]));
            return { out: text + (n ? '' : '\n') };
        },
        touch: (args) => {
            if (!args.length) fail('touch: missing file operand');
            args.forEach(p => { if (!lookup(resolve(p))) writeFile('touch', p, ''); });
            return { out: '' };
        },
        mkdir: (args, _stdin, ctx) => {
            const { f, rest } = flags(args);
            if (!rest.length) fail('mkdir: missing operand');
            rest.forEach(p => {
                const abs = resolve(p);
                if (lookup(abs)) { if (f.has('p')) return; fail(`mkdir: cannot create directory '${p}': File exists`); }
                const segs = pathsUnder(abs);
                segs.forEach((sp, i) => {
                    if (lookup(sp)) return;
                    if (i < segs.length - 1 && !f.has('p')) fail(`mkdir: cannot create directory '${p}': No such file or directory`);
                    const { dirPath, name } = parentOf(sp);
                    const parent = lookup(dirPath);
                    if (parent.type !== 'dir') fail(`mkdir: cannot create directory '${p}': Not a directory`);
                    if (isLocked(dirPath)) fail(`mkdir: cannot create directory '${p}': Permission denied`);
                    parent.children[name] = dir();
                    if (parent.desktop) ctx.actions.push({ type: 'addFolder', name });
                });
            });
            return { out: '' };
        },
        rm: (args) => {
            const { f, rest } = flags(args);
            if (!rest.length) fail('rm: missing operand');
            rest.forEach(p => {
                const abs = resolve(p), node = lookup(abs);
                if (!node) { if (f.has('f')) return; fail(`rm: cannot remove '${p}': No such file or directory`); }
                if (abs === '/' || abs === HOME || HOME.startsWith(abs + '/')) fail(`rm: it is dangerous to operate recursively on '${p}' 😬`);
                if (node.type === 'dir' && !(f.has('r') || f.has('R'))) fail(`rm: cannot remove '${p}': Is a directory`);
                if (isLocked(abs)) fail(`rm: cannot remove '${p}': Permission denied`);
                const { dirPath, name } = parentOf(abs);
                delete lookup(dirPath).children[name];
                if (abs === state.cwd || state.cwd.startsWith(abs + '/')) state.cwd = dirPath;
            });
            return { out: '' };
        },
        rmdir: (args) => {
            if (!args.length) fail('rmdir: missing operand');
            args.forEach(p => {
                const { abs, node } = getDir('rmdir', p);
                if (node.type !== 'dir') fail(`rmdir: failed to remove '${p}': Not a directory`);
                if (Object.keys(node.children).length) fail(`rmdir: failed to remove '${p}': Directory not empty`);
                if (abs === HOME || abs === '/') fail(`rmdir: failed to remove '${p}': Device or resource busy`);
                const { dirPath, name } = parentOf(abs);
                delete lookup(dirPath).children[name];
            });
            return { out: '' };
        },
        cp: (args) => copyOrMove('cp', args, false),
        mv: (args) => copyOrMove('mv', args, true),
        whoami: () => ({ out: site.shortName + '\n' }),
        hostname: () => ({ out: site.host + '\n' }),
        id: () => ({ out: `uid=1000(${site.shortName}) gid=1000(${site.shortName}) groups=1000(${site.shortName}),27(sudo-wannabe)\n` }),
        uname: (args) => ({ out: (flags(args).f.has('a') ? `Linux ${site.host} 5.4.0-webr #1 SMP x86_64 GNU/Linux` : 'Linux') + '\n' }),
        date: () => ({ out: new Date().toString() + '\n' }),
        uptime: () => ({ out: `up ${Math.round(performance.now() / 60000)} min, 1 user\n` }),
        history: () => ({ out: state.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n') + '\n' }),
        which: (args) => ({ out: args.map(a => (a in commands || a in APP_COMMANDS || a === 'R') ? `/usr/bin/${a}` : `${a} not found`).join('\n') + '\n' }),
        neofetch: () => ({
            out: [
                `${site.shortName}@${site.host}`,
                '-'.repeat(site.shortName.length + site.host.length + 1),
                'OS: Ubuntu 20.04 LTS (in your browser)',
                'Shell: bash (well, almost)',
                `R: webR (type R)`,
                `Role: ${site.role}`,
                `Affiliation: ${site.affiliation}`,
                `Languages: ${site.skills.languages.join(', ')}`,
            ].join('\n') + '\n',
        }),
        open: (args, _stdin, ctx) => {
            if (!args.length) fail('open: missing operand. Try: open ' + slug(site.projects[0]?.name || 'projects'));
            args.forEach(a => {
                if (/^https?:\/\//.test(a)) { ctx.actions.push({ type: 'url', url: a }); return; }
                let node = lookup(resolve(a));
                if (!node) node = lookup(resolve(`${HOME}/projects/${slug(a)}`));
                if (!node) fail(`open: ${a}: No such file or directory`);
                if (node.url) ctx.actions.push({ type: 'url', url: node.url });
                else if (node.type === 'dir') ctx.actions.push({ type: 'openApp', id: 'folder-projects' });
                else ctx.actions.push({ type: 'openApp', id: 'gedit' });
            });
            return { out: '' };
        },
        'xdg-open': (...a) => commands.open(...a),
        sudo: (args, _s, ctx) => {
            ctx.actions.push({ type: 'sudo' });
            if (args.join(' ').startsWith('apt install') || args.join(' ').startsWith('apt-get install'))
                return { out: '', html: `E: Could not open lock file. Try <span class='text-ubt-gedit-orange'>install.packages("${escapeHtml(args.slice(2).join(' ') || 'tidyverse')}")</span> instead 😉` };
            return { out: `${site.shortName} is not in the sudoers file. This incident will be reported.\n` };
        },
        apt: () => fail('E: Could not open lock file - are you root?'),
        vim: () => ({ out: "There is no escape from vim here, so try 'code' instead 😅\n" }),
        vi: () => commands.vim(),
        nano: (args, _s, ctx) => { ctx.actions.push({ type: 'openApp', id: 'gedit' }); return { out: '' }; },
        python: () => ({ out: "This desktop speaks R. Type 'R' 🙂\n" }),
        python3: () => commands.python(),
        exit: (_a, _s, ctx) => { ctx.actions.push({ type: 'exit' }); return { out: '' }; },
        clear: (_a, _s, ctx) => { ctx.actions.push({ type: 'clear' }); return { out: '' }; },
        R: (_a, _s, ctx) => { ctx.actions.push({ type: 'R' }); return { out: '' }; },
        r: (...a) => commands.R(...a),
        Rscript: (args, _s, ctx) => { ctx.actions.push({ type: 'R' }); return { out: '' }; },
        ll: (args, ...rest) => commands.ls(['-la', ...args], ...rest),
    };

    function copyOrMove(cmd, args, move) {
        const { f, rest } = flags(args);
        if (rest.length < 2) fail(`${cmd}: missing destination file operand`);
        const dest = rest.pop();
        const destAbs = resolve(dest), destNode = lookup(destAbs);
        if (rest.length > 1 && destNode?.type !== 'dir') fail(`${cmd}: target '${dest}' is not a directory`);
        rest.forEach(src => {
            const { abs, node } = getDir(cmd, src);
            if (!move && node.type === 'dir' && !(f.has('r') || f.has('R'))) fail(`cp: -r not specified; omitting directory '${src}'`);
            if (abs === HOME || abs === '/') fail(`${cmd}: cannot ${move ? 'move' : 'copy'} '${src}'`);
            let target = destNode?.type === 'dir' ? destAbs + '/' + parentOf(abs).name : destAbs;
            if (target === abs || target.startsWith(abs + '/')) fail(`${cmd}: cannot ${move ? 'move' : 'copy'} '${src}' into itself`);
            const { dirPath, name } = parentOf(target);
            const parent = lookup(dirPath);
            if (!parent || parent.type !== 'dir') fail(`${cmd}: cannot create '${dest}': No such file or directory`);
            if (isLocked(dirPath)) fail(`${cmd}: cannot create '${dest}': Permission denied`);
            parent.children[name] = move ? node : deepCopy(node);
            if (move) {
                const p = parentOf(abs);
                delete lookup(p.dirPath).children[p.name];
                if (state.cwd === abs || state.cwd.startsWith(abs + '/')) state.cwd = target + state.cwd.slice(abs.length);
            }
        });
        return { out: '' };
    }

    // "skills/*.txt" -> matching paths (kept literally when nothing matches, like bash)
    function expandGlob(arg) {
        if (!/[*?]/.test(arg)) return [arg];
        const absolute = arg.startsWith('/');
        let matches = [absolute ? '/' : ''];
        for (const seg of arg.split('/').filter(Boolean)) {
            const next = [];
            for (const m of matches) {
                const join = (n) => m === '' ? n : m.endsWith('/') ? m + n : m + '/' + n;
                if (!/[*?]/.test(seg)) { next.push(join(seg)); continue; }
                const node = lookup(resolve(m || '.'));
                if (!node || node.type !== 'dir' || node.locked) continue;
                const re = globToRegex(seg);
                Object.keys(node.children).filter(n => re.test(n) && (seg.startsWith('.') || !n.startsWith('.'))).sort().forEach(n => next.push(join(n)));
            }
            matches = next;
        }
        matches = matches.filter(m => lookup(resolve(m)));
        return matches.length ? matches : [arg];
    }

    // ---------- run ----------
    function run(line) {
        const actions = [];
        const html = [];
        const trimmed = line.trim();
        if (!trimmed) return { html: '', actions };
        state.history.push(trimmed);

        let seqs;
        try { seqs = parse(tokenize(trimmed)); }
        catch (e) { return { html: escapeHtml('bash: ' + e.message), actions }; }

        let lastStatus = 0;
        for (let s = 0; s < seqs.length; s++) {
            if (s > 0 && seqs[s - 1].sep === '&&' && lastStatus !== 0) break;
            const { pipeline, redirect } = seqs[s];
            let stdin = null, result = { out: '' };
            lastStatus = 0;
            for (let i = 0; i < pipeline.length; i++) {
                const name = pipeline[i][0].w;
                const args = pipeline[i].slice(1).flatMap(t => t.q ? [t.w] : expandGlob(t.w === '~' || t.w.startsWith('~/') ? HOME + t.w.slice(1) : t.w));
                const ctx = { actions };
                try {
                    if (name in APP_COMMANDS && !(APP_COMMANDS[name] === 'about-me' && !site.show.aboutMe)) { actions.push({ type: 'openApp', id: APP_COMMANDS[name] }); result = { out: '' }; }
                    else if (commands[name]) result = commands[name](args, stdin, ctx) || { out: '' };
                    else fail(`${name}: command not found. Type 'help' to see what works.`);
                    lastStatus = result.status || 0;
                } catch (e) {
                    if (!(e instanceof ShellError)) console.error(e);
                    html.push(`<div class="whitespace-pre-wrap text-red-300">${escapeHtml(e.message)}</div>`);
                    result = { out: '' };
                    lastStatus = 1;
                }
                stdin = result.out;
            }
            if (redirect) {
                try { writeFile('bash', redirect.path, result.out, redirect.append); }
                catch (e) { html.push(`<div class="whitespace-pre-wrap text-red-300">${escapeHtml(e.message)}</div>`); lastStatus = 1; }
            } else if (result.html && pipeline.length === 1) html.push(result.html);
            else if (result.out) html.push(`<div class="whitespace-pre-wrap">${escapeHtml(result.out.replace(/\n$/, ''))}</div>`);
        }
        return { html: html.join(''), actions };
    }

    // ---------- tab completion ----------
    function complete(line) {
        const m = line.match(/(\S*)$/);
        const word = m[1], before = line.slice(0, line.length - word.length);
        const isCommand = !before.trim() || /(\||;|&&)\s*$/.test(before);
        let candidates;
        if (isCommand) {
            candidates = [...Object.keys(commands), ...Object.keys(APP_COMMANDS)].filter(c => c.startsWith(word)).map(c => c + ' ');
        } else {
            const slash = word.lastIndexOf('/');
            const dirPart = slash >= 0 ? word.slice(0, slash + 1) : '';
            const base = slash >= 0 ? word.slice(slash + 1) : word;
            const node = lookup(resolve(dirPart || '.'));
            if (!node || node.type !== 'dir' || isLocked(resolve(dirPart || '.'))) return { line, options: [] };
            candidates = Object.entries(node.children)
                .filter(([n]) => n.startsWith(base) && (base.startsWith('.') || !n.startsWith('.')))
                .map(([n, c]) => dirPart + n + (c.type === 'dir' ? '/' : ' '));
        }
        candidates = [...new Set(candidates)].sort();
        if (candidates.length === 0) return { line, options: [] };
        if (candidates.length === 1) return { line: before + candidates[0], options: [] };
        let prefix = candidates[0];
        candidates.forEach(c => { while (!c.startsWith(prefix)) prefix = prefix.slice(0, -1); });
        return { line: before + prefix, options: candidates.map(c => c.trim().replace(/^.*\/(?=.)/, '')) };
    }

    return {
        run, complete, state,
        prompt: () => display(state.cwd),
    };
}
