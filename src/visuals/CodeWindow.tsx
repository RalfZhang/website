import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion, useInView } from "../lib/motion";
import "./CodeWindow.css";

/*
 * A scripted VS Code session showing what File Template does: open the command
 * palette, run "Insert Template", tab through the snippet's stops. The
 * templates are the extension's real built-ins (asset/templates/*.tmpl).
 */

type Seg = string | { stop: number; text: string };

type Template = {
  file: string;
  language: string;
  mode: "slash" | "hash";
  source: string;
  commands: string[];
  /** Stops to fill, in tab order, and what gets typed into each. */
  fill: [stop: number, text: string][];
};

const TEMPLATES: Template[] = [
  {
    file: "wallpaper.ts",
    language: "TypeScript",
    mode: "slash",
    source: "/**\n * ${1:Description}\n * @author  ${2:Your Name} (${3:you@example.org})\n * @date    ${date}\n * @version ${4:1.0.0}\n */\n\n$0",
    commands: ["Insert Template", "Insert TypeScript Template", "Insert TypeScript JSX Template"],
    fill: [
      [1, "Redraws the wallpaper at midnight"],
      [2, "Ralf Zhang"],
    ],
  },
  {
    file: "chime.py",
    language: "Python",
    mode: "hash",
    source:
      "#!/usr/bin/env python\n# -*- coding: utf-8 -*-\n# @date    : ${date}\n# @author  : ${1:Your Name} (${2:you@example.org})\n# @link    : ${3:link}\n# @version : ${4:1.0.0}\n\n${5:import os}\n$0",
    commands: ["Insert Template", "Insert Python Template"],
    fill: [
      [1, "Ralf Zhang"],
      [3, "ralfz.com"],
    ],
  },
  {
    file: "paper.css",
    language: "CSS",
    mode: "slash",
    source:
      '@charset "UTF-8";\n/**\n * ${3:Description}\n * @author  ${4:Your Name} (${5:you@example.org})\n * @date    ${date}\n * @version ${6:1.0.0}\n */\n$0',
    commands: ["Insert Template", "Insert CSS Template"],
    fill: [
      [3, "Ink on paper"],
      [4, "Ralf Zhang"],
    ],
  },
];

const QUERY = "insert tem";

/** The extension's own ${date} format: yyyy-MM-dd hh:mm:ss (12-hour hh). */
function stamp(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours() % 12 || 12)}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function parse(source: string, date: string): Seg[][] {
  return source
    .replaceAll("${date}", date)
    .split("\n")
    .map((line) => {
      const segs: Seg[] = [];
      const re = /\$\{(\d+):([^}]*)\}|\$(\d+)/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line))) {
        if (m.index > last) segs.push(line.slice(last, m.index));
        segs.push(m[1] ? { stop: +m[1], text: m[2] } : { stop: +m[3], text: "" });
        last = re.lastIndex;
      }
      if (last < line.length) segs.push(line.slice(last));
      return segs;
    });
}

type View = {
  t: number;
  lines: Seg[][] | null;
  values: Record<number, string>;
  active: number | null;
  selected: boolean;
  query: string | null;
  keys: string[] | null;
  flash: number;
};

const blank = (t: number): View => ({ t, lines: null, values: {}, active: null, selected: false, query: null, keys: null, flash: 0 });

const finished = (t: number): View => ({
  ...blank(t),
  lines: parse(TEMPLATES[t].source, stamp()),
  values: Object.fromEntries(TEMPLATES[t].fill),
  active: 0,
});

/* ------------------------------------------------------------------ highlighting */
function tokens(text: string, comment: boolean): ReactNode[] {
  if (!text) return [];
  const re = comment ? /((?<![\w.])@\w+)/g : /(\b(?:import|from|export|default|const)\b|"[^"]*")/g;
  return text.split(re).map((part, i) => {
    if (!part) return null;
    if (i % 2 === 0) return part;
    const cls = comment ? "tk-doc" : part.startsWith('"') ? "tk-str" : "tk-kw";
    return (
      <span className={cls} key={i}>
        {part}
      </span>
    );
  });
}

function Line({ segs, view, comment }: { segs: Seg[]; view: View; comment: boolean }) {
  return (
    <>
      {segs.map((seg, i) => {
        if (typeof seg === "string") return <Fragment key={i}>{tokens(seg, comment)}</Fragment>;
        const text = view.values[seg.stop] ?? seg.text;
        const isActive = view.active === seg.stop;
        return (
          <Fragment key={i}>
            <span className={isActive && view.selected ? "editor__sel" : undefined}>{tokens(text, comment)}</span>
            {isActive && !view.selected && <span className="editor__caret" />}
          </Fragment>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ component */
export function CodeWindow({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const still = variant === "card" || prefersReducedMotion();
  const [view, setView] = useState<View>(() => (still ? finished(0) : blank(0)));
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: 0.4 });
  const cycle = useRef(0);

  useEffect(() => {
    if (still || !inView) return;
    const ac = new AbortController();
    const sleep = (ms: number) =>
      new Promise<void>((res, rej) => {
        const id = setTimeout(res, ms);
        ac.signal.addEventListener("abort", () => (clearTimeout(id), rej(new Error("abort"))), { once: true });
      });
    const set = (patch: Partial<View> | ((v: View) => Partial<View>)) =>
      setView((v) => ({ ...v, ...(typeof patch === "function" ? patch(v) : patch) }));

    const run = async () => {
      for (;;) {
        const t = cycle.current++ % TEMPLATES.length;
        const tpl = TEMPLATES[t];
        setView(blank(t));
        await sleep(800);
        set({ keys: ["⇧", "⌘", "P"] });
        await sleep(600);
        set({ keys: null, query: "" });
        await sleep(300);
        for (let i = 1; i <= QUERY.length; i++) {
          set({ query: QUERY.slice(0, i) });
          await sleep(60 + Math.random() * 40);
        }
        await sleep(500);
        set({ keys: ["↩"] });
        await sleep(300);
        set((v) => ({ keys: null, query: null, lines: parse(tpl.source, stamp()), active: tpl.fill[0][0], selected: true, flash: v.flash + 1 }));
        await sleep(900);
        for (let f = 0; f < tpl.fill.length; f++) {
          const [stop, text] = tpl.fill[f];
          if (f > 0) {
            set({ keys: ["⇥"] });
            await sleep(300);
            set({ keys: null, active: stop, selected: true });
            await sleep(500);
          }
          set({ selected: false });
          for (let i = 1; i <= text.length; i++) {
            set((v) => ({ values: { ...v.values, [stop]: text.slice(0, i) } }));
            await sleep(36 + Math.random() * 36);
          }
          await sleep(350);
        }
        set({ keys: ["⇥"] });
        await sleep(300);
        set({ keys: null, active: 0, selected: false });
        await sleep(3000);
      }
    };
    run().catch(() => {});
    return () => ac.abort();
  }, [still, inView]);

  const tpl = TEMPLATES[view.t];
  const lines = view.lines ?? [[]];
  const caretLine = view.lines
    ? Math.max(0, lines.findIndex((segs) => segs.some((s) => typeof s !== "string" && s.stop === view.active)))
    : 0;
  const words = (view.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const results = view.query !== null ? tpl.commands.filter((c) => words.every((w) => c.toLowerCase().includes(w))) : [];

  let inComment = false;

  return (
    <div className={`editor editor--${variant}`} ref={ref} aria-hidden>
      <div className="editor__window">
        <div className="editor__titlebar">
          <span className="editor__lights">
            <i />
            <i />
            <i />
          </span>
          <span className="editor__title">{tpl.file}</span>
        </div>

        <div className="editor__body">
          <ol className="editor__lines" key={view.flash}>
            {lines.map((segs, i) => {
              const text = segs.map((s) => (typeof s === "string" ? s : s.text)).join("").trim();
              if (tpl.mode === "slash" && text.startsWith("/**")) inComment = true;
              const comment = inComment || (tpl.mode === "hash" && text.startsWith("#"));
              if (tpl.mode === "slash" && text.endsWith("*/")) inComment = false;
              return (
                <li
                  key={i}
                  className={`editor__line${i === caretLine && view.active !== null ? " is-current" : ""}${view.flash ? " is-new" : ""}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <span className="editor__ln">{i + 1}</span>
                  <span className={comment ? "editor__src is-comment" : "editor__src"}>
                    {view.lines ? <Line segs={segs} view={view} comment={comment} /> : <span className="editor__caret" />}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className={`editor__palette${view.query !== null ? " is-open" : ""}`}>
            <div className="editor__query">
              <span className="editor__prompt">&gt;</span>
              {view.query}
              <span className="editor__caret" />
            </div>
            <ul className="editor__results">
              {results.map((c, i) => (
                <li key={c} className={i === 0 ? "is-active" : undefined}>
                  <span className="editor__cat">File Template:</span> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="editor__status">
          <span>{tpl.language}</span>
          <span>UTF-8</span>
        </div>
      </div>

      <div className={`editor__keys${view.keys ? " is-on" : ""}`}>
        {(view.keys ?? []).map((k) => (
          <kbd key={k}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}
