import React, { Component } from 'react'
import $ from 'jquery';
import ReactGA from 'react-ga4';
import site from '../../site.config';
import { completeR, getR, isIncomplete, runR } from '../../lib/webr';
import { createShell, escapeHtml } from '../../lib/shell';
import survivalExplorer from '../../shiny-apps/survival-explorer/app.R';
import kaplanMeier from '../../r-scripts/01-kaplan-meier.R';
import coxModel from '../../r-scripts/02-cox-model.R';
import parametric from '../../r-scripts/03-parametric.R';
import cvMarkdown from '../../content/cv.md';

// One shell for the whole session, so files and history survive closing the window.
let shell = null;
const getShell = () => shell || (shell = createShell(site, {
    shinyApp: survivalExplorer,
    cv: cvMarkdown,
    rScripts: { '01-kaplan-meier.R': kaplanMeier, '02-cox-model.R': coxModel, '03-parametric.R': parametric },
}));

const R_WELCOME = `Running in your browser via webR: nothing is sent to a server.
Try:
  fit <- survfit(Surv(time, status) ~ sex, data = lung)
  plot(fit, col = c("tomato", "steelblue"), lwd = 2)
  coxph(Surv(time, status) ~ age + sex + ph.ecog, data = lung)
Type q() to return to bash.`;

export class Terminal extends Component {
    constructor() {
        super();
        this.cursor = "";
        this.terminal_rows = 1;
        this.prev_commands = [];
        this.commands_index = 0;
        this.mode = "bash";      // "bash" | "R"
        this.rBuffer = "";       // unfinished multi-line R input
        this.state = {
            terminal: [],
        }
    }

    componentDidMount() {
        this.reStartTerminal();
    }

    componentDidUpdate() {
        clearInterval(this.cursor);
        this.startCursor(this.terminal_rows - 2);
    }

    componentWillUnmount() {
        clearInterval(this.cursor);
    }

    reStartTerminal = () => {
        clearInterval(this.cursor);
        this.setState({ terminal: [] }, this.appendTerminalRow);
    }

    appendTerminalRow = () => {
        let terminal = this.state.terminal;
        terminal.push(this.terminalRow(this.terminal_rows));
        this.setState({ terminal });
        this.terminal_rows += 2;
    }

    terminalRow = (id) => {
        return (
            <React.Fragment key={id}>
                <div className="flex w-full h-5">
                    {this.mode === "R" ? (
                        <div className="flex">
                            <div className="text-ubt-gedit-blue mr-1">{this.rBuffer ? "+" : ">"}</div>
                        </div>
                    ) : (
                        <div className="flex">
                            <div className=" text-ubt-green">{site.shortName}@{site.host}</div>
                            <div className="text-white mx-px font-medium">:</div>
                            <div className=" text-ubt-blue">{getShell().prompt()}</div>
                            <div className="text-white mx-px font-medium mr-1">$</div>
                        </div>
                    )}
                    <div id="cmd" onClick={this.focusCursor} className=" bg-transperent relative flex-1 overflow-hidden">
                        <span id={`show-${id}`} className=" float-left whitespace-pre pb-1 opacity-100 font-normal tracking-wider"></span>
                        <div id={`cursor-${id}`} className=" float-left mt-1 w-1.5 h-3.5 bg-white"></div>
                        <input id={`terminal-input-${id}`} data-row-id={id} onKeyDown={this.checkKey} onBlur={this.unFocusCursor} className=" absolute top-0 left-0 w-full opacity-0 outline-none bg-transparent" spellCheck={false} autoFocus={true} autoComplete="off" type="text" />
                    </div>
                </div>
                <div id={`row-result-${id}`} className={"my-2 font-normal"}></div>
            </React.Fragment>
        );

    }

    focusCursor = (e) => {
        clearInterval(this.cursor);
        this.startCursor($(e.target).data("row-id"));
    }

    unFocusCursor = (e) => {
        this.stopCursor($(e.target).data("row-id"));
    }

    startCursor = (id) => {
        clearInterval(this.cursor);
        $(`input#terminal-input-${id}`).trigger("focus");
        // On input change, set current text in span
        $(`input#terminal-input-${id}`).on("input", function () {
            $(`#cmd span#show-${id}`).text($(this).val());
        });
        this.cursor = window.setInterval(function () {
            if ($(`#cursor-${id}`).css('visibility') === 'visible') {
                $(`#cursor-${id}`).css({ visibility: 'hidden' });
            } else {
                $(`#cursor-${id}`).css({ visibility: 'visible' });
            }
        }, 500);
    }

    stopCursor = (id) => {
        clearInterval(this.cursor);
        $(`#cursor-${id}`).css({ visibility: 'visible' });
    }

    removeCursor = (id) => {
        this.stopCursor(id);
        $(`#cursor-${id}`).css({ display: 'none' });
    }

    clearInput = (id) => {
        $(`input#terminal-input-${id}`).trigger("blur");
    }

    setInput = (id, value) => {
        $(`input#terminal-input-${id}`).val(value);
        $(`#show-${id}`).text(value);
    }

    // Fill in the completed line; list the candidates under it when there are several.
    showCompletion = (id, { line, options }) => {
        this.setInput(id, line);
        const out = document.getElementById(`row-result-${id}`);
        if (out) out.innerHTML = options.length
            ? `<div class="flex flex-wrap text-ubt-warm-grey">${options.slice(0, 200).map(o => `<span class="mr-4">${escapeHtml(o)}</span>`).join("")}${options.length > 200 ? `<span>… ${options.length - 200} more</span>` : ""}</div>` : "";
    }

    completeRLine = async (id, value) => {
        // R completes the code on this line only; earlier lines of a multi-line block don't matter.
        let res;
        try { res = await completeR(value); } catch (err) { return; }
        if ($(`input#terminal-input-${id}`).val() !== value) return; // user kept typing
        const { token, completions } = res;
        const matches = completions.filter(c => c.startsWith(token) || token === "");
        if (!matches.length) return this.showCompletion(id, { line: value, options: [] });
        const before = value.slice(0, value.length - token.length);
        if (matches.length === 1) return this.showCompletion(id, { line: before + matches[0], options: [] });
        let prefix = matches[0];
        matches.forEach(c => { while (!c.startsWith(prefix)) prefix = prefix.slice(0, -1); });
        this.showCompletion(id, { line: before + prefix, options: matches });
    }

    // Clicking anywhere in the terminal (except when selecting text) puts the cursor back in the prompt.
    focusPrompt = () => {
        if (window.getSelection && String(window.getSelection())) return;
        const id = this.terminal_rows - 2;
        $(`input#terminal-input-${id}`).trigger("focus");
        this.startCursor(id);
    }

    checkKey = (e) => {
        const id = $(e.target).data("row-id");
        const input = $(`input#terminal-input-${id}`);
        if (e.key === "Enter") {
            const command = input.val().trim();
            if (command.length === 0) return;
            this.removeCursor(id);
            this.prev_commands.push(command);
            this.commands_index = this.prev_commands.length;
            this.clearInput(id);
            this.handleCommands(command, id);
        }
        else if (e.key === "Tab") {
            e.preventDefault();
            if (this.mode === "R") this.completeRLine(id, input.val());
            else this.showCompletion(id, getShell().complete(input.val()));
        }
        else if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
            e.preventDefault();
            this.removeCursor(id);
            $(`#show-${id}`).text(input.val() + "^C");
            this.rBuffer = "";
            this.clearInput(id);
            this.appendTerminalRow();
        }
        else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
            e.preventDefault();
            this.reStartTerminal();
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (this.commands_index > 0) this.commands_index--;
            this.setInput(id, this.prev_commands[this.commands_index] || "");
        }
        else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (this.commands_index < this.prev_commands.length) this.commands_index++;
            this.setInput(id, this.prev_commands[this.commands_index] || "");
        }
    }

    closeTerminal = () => {
        $("#close-terminal").trigger('click');
    }

    // ---------- R mode (webR) ----------

    startR = async (rowId) => {
        const out = document.getElementById(`row-result-${rowId}`);
        const status = (msg) => { out.innerHTML = `<span class="text-ubt-warm-grey">${escapeHtml(msg)}</span>`; };
        try {
            const { version } = await getR(status);
            out.innerHTML = `<div class="whitespace-pre-wrap font-mono font-normal">${escapeHtml(version)}\n${escapeHtml(R_WELCOME)}</div>`;
            this.mode = "R";
            this.rBuffer = "";
        } catch (err) {
            out.innerHTML = `<span class="text-red-400">Could not start R: ${escapeHtml(err.message || err)}</span>`;
        }
        this.appendTerminalRow();
    }

    handleR = async (code, rowId) => {
        const out = document.getElementById(`row-result-${rowId}`);

        if (!this.rBuffer && /^(q|quit)\s*\(.*\)\s*$/.test(code)) {
            this.mode = "bash";
            this.appendTerminalRow();
            return;
        }

        const full = this.rBuffer ? this.rBuffer + "\n" + code : code;
        try {
            if (await isIncomplete(full)) {
                this.rBuffer = full;
            } else {
                this.rBuffer = "";
                out.innerHTML = `<span class="text-ubt-warm-grey">…</span>`;
                const width = Math.min(640, Math.max(320, (out.clientWidth || 640) - 16));
                const { output, images } = await runR(full, { width, height: Math.round(width * 0.62) });
                out.innerHTML = output.map(o =>
                    `<div class="whitespace-pre-wrap font-mono font-normal ${o.type === "stderr" ? "text-ubt-gedit-orange" : ""}">${escapeHtml(o.data)}</div>`
                ).join("");
                images.forEach(img => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.className = "my-1 bg-white rounded max-w-full";
                    canvas.getContext("2d").drawImage(img, 0, 0);
                    out.appendChild(canvas);
                });
            }
        } catch (err) {
            this.rBuffer = "";
            out.innerHTML = `<span class="text-red-400">${escapeHtml(err.message || err)}</span>`;
        }
        this.appendTerminalRow();
    }

    handleCommands = (command, rowId) => {
        if (this.mode === "R") {
            this.handleR(command, rowId);
            return;
        }
        const { html, actions } = getShell().run(command);
        document.getElementById(`row-result-${rowId}`).innerHTML = html;
        for (const a of actions) {
            if (a.type === "clear") { this.reStartTerminal(); return; }
            if (a.type === "exit") { this.closeTerminal(); return; }
            if (a.type === "R") { this.startR(rowId); return; }
            if (a.type === "openApp") this.props.openApp(a.id);
            if (a.type === "addFolder") this.props.addFolder(a.name);
            if (a.type === "url") window.open(a.url, "_blank", "noopener");
            if (a.type === "sudo") ReactGA.event({ category: "Sudo Access", action: "lol" });
        }
        this.appendTerminalRow();
    }

    render() {
        return (
            <div className="h-full w-full bg-ub-drk-abrgn text-white text-sm font-bold font-mono px-1.5 pt-1" id="terminal-body" onClick={this.focusPrompt}>
                {
                    this.state.terminal
                }
            </div>
        )
    }
}

export default Terminal

export const displayTerminal = (addFolder, openApp) => {
    return <Terminal addFolder={addFolder} openApp={openApp}> </Terminal>;
}
