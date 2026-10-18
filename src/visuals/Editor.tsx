import { Fragment, memo, type CSSProperties, type ReactNode } from "react";
import { caretOf, palette, ROWS, TEMPLATES, type Seg, type View } from "./editorDemo";
import "./Editor.css";

/*
 * The parts of the scripted editor (./editorDemo.ts) that look the same
 * wherever it's drawn — the file, the command palette, the keycaps — in the
 * colours of the --e-* tokens set by whoever draws it (Editor.css lists them).
 * Where they sit, and the chrome around them, is the drawer's own.
 */

/* ------------------------------------------------------------------ the file */
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

function Line({ segs, view, comment, focused }: { segs: Seg[]; view: View; comment: boolean; focused: boolean }) {
  return (
    <>
      {segs.map((seg, i) => {
        if (typeof seg === "string") return <Fragment key={i}>{tokens(seg, comment)}</Fragment>;
        const text = view.values[seg.stop] ?? seg.text;
        const isActive = view.active === seg.stop;
        return (
          <Fragment key={i}>
            <span className={isActive && view.selected ? "editor__sel" : undefined}>{tokens(text, comment)}</span>
            {/* Keyed by what's typed, so it holds steady while typing and blinks once it stops. */}
            {isActive && !view.selected && focused && <span className="editor__caret" key={text.length} />}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * The file, numbered, with the caret in it — unless the palette has it, or
 * (`focused` off) something else on the page. Drawn again only when the view
 * changes, not each time whatever's around it does.
 */
export const EditorLines = memo(function EditorLines({ view, focused = true }: { view: View; focused?: boolean }) {
  const tpl = TEMPLATES[view.t];
  const lines = view.lines ?? [[]];
  const hasCaret = focused && view.query === null;
  const current = view.active === null ? -1 : caretOf(view).ln - 1;
  let inComment = false;

  return (
    <ol className="editor__lines" key={view.landed ? "landed" : "empty"} style={{ "--e-rows": ROWS } as CSSProperties}>
      {lines.map((segs, i) => {
        const text = segs.map((s) => (typeof s === "string" ? s : s.text)).join("").trim();
        if (tpl.mode === "slash" && text.startsWith("/**")) inComment = true;
        const comment = inComment || (tpl.mode === "hash" && text.startsWith("#"));
        if (tpl.mode === "slash" && text.endsWith("*/")) inComment = false;
        return (
          <li
            key={i}
            className={`editor__line${i === current ? " is-current" : ""}${view.landed ? " is-new" : ""}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="editor__ln">{i + 1}</span>
            <span className={comment ? "editor__src is-comment" : "editor__src"}>
              {view.lines ? (
                <Line segs={segs} view={view} comment={comment} focused={hasCaret} />
              ) : (
                hasCaret && <span className="editor__caret" />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
});

/* ------------------------------------------------------------------ the palette */
/** `text` with the parts the query matched set apart, as VS Code does. */
function Matched({ text, words }: { text: string; words: string[] }) {
  const hit = new Array<boolean>(text.length).fill(false);
  for (const w of words) {
    const at = text.toLowerCase().indexOf(w);
    if (at >= 0) hit.fill(true, at, at + w.length);
  }
  const runs: ReactNode[] = [];
  for (let i = 0, j = 0; i < text.length; i = j) {
    while (j < text.length && hit[j] === hit[i]) j++;
    runs.push(hit[i] ? <b key={i}>{text.slice(i, j)}</b> : text.slice(i, j));
  }
  return <>{runs}</>;
}

/** The command palette: shown while there's a query (even an empty one), with what it matches. */
export function CommandPalette({ view }: { view: View }) {
  const { words, matches } = palette(view);
  return (
    <div className={`editor__palette${view.query !== null ? " is-open" : ""}`}>
      <div className="editor__query">
        <span className="editor__prompt">&gt;</span>
        {view.query}
        {view.query !== null && <span className="editor__caret" key={view.query.length} />}
      </div>
      <ul className="editor__results">
        {matches.map((c, i) => (
          <li key={c} className={i === 0 ? "is-active" : undefined}>
            <span className="editor__cat">File Template:</span> <Matched text={c} words={words} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ the keys
 * The system font draws ⇧ and ⌘ itself, but has no ↩ or ⇥: those fall back
 * to whichever font has them, thin and unlike the others. So they're drawn
 * here to match: line arrows with round ends, as SF Symbols draws them, at
 * the font's stroke (0.09em) and a capital's height (0.72em; Editor.css).
 */
const glyph = (d: string) => (
  <svg viewBox="0 0 84 72" fill="none" stroke="currentColor" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const GLYPHS: Partial<Record<string, ReactNode>> = {
  "↩": glyph("M78 5v27a12 12 0 0 1-12 12H8M31 21 8 44l23 23"),
  "⇥": glyph("M6 36h54M37 13l23 23-23 23M78 5v62"),
};

/** The shortcut just pressed, a cap per key, coming up one after the other and going together. */
export function KeyCaps({ keys, className }: { keys: View["keys"]; className?: string }) {
  if (!keys.n) return null;
  return (
    <div className={`editor__keys${keys.on ? " is-on" : ""}${className ? ` ${className}` : ""}`} key={keys.n} aria-hidden>
      {keys.caps.map((k, i) => (
        <kbd key={k} className={k.length > 1 ? "is-word" : undefined} style={{ animationDelay: `${i * 70}ms` }}>
          {GLYPHS[k] ?? k}
        </kbd>
      ))}
    </div>
  );
}
