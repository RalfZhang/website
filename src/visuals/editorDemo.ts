import { useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useInView, usePageVisible } from "../lib/motion";
import { typeOut, useTimeline, type Wait } from "../lib/timeline";

/*
 * A scripted VS Code session showing what File Template does: open the command
 * palette, run "Insert Template", tab through the snippet's stops. The
 * templates are the extension's real built-ins (asset/templates/*.tmpl). The
 * script and what it shows are here; how it's drawn is up to whoever draws it
 * (CodeWindow, a window on the page; the home page's File Template screen, the
 * whole screen).
 */

export type Seg = string | { stop: number; text: string };

type Template = {
  file: string;
  language: string;
  mode: "slash" | "hash";
  source: string;
  commands: string[];
  /** Stops to fill, in tab order, and what gets typed into each. */
  fill: [stop: number, text: string][];
};

export const TEMPLATES: Template[] = [
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

/** The longest template's lines: the room the file has from the start, so what's around it never moves. */
export const ROWS = Math.max(...TEMPLATES.map((tpl) => tpl.source.split("\n").length));

const QUERY = "insert tem";

/** How long a finished template stays before the next file is opened. */
const HOLD_MS = 3000;

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

/* ------------------------------------------------------------------ keys
 * The shortcuts as the visitor's own keyboard has them: VS Code's command
 * palette is ⇧⌘P on a Mac and Ctrl+Shift+P everywhere else.
 */
const MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

const KEYS = MAC
  ? { palette: ["⇧", "⌘", "P"], enter: ["↩"], tab: ["⇥"] }
  : { palette: ["Ctrl", "Shift", "P"], enter: ["Enter"], tab: ["Tab"] };

/** How long a shortcut's keycaps stay up once pressed: long enough to read, well past the step they cause. */
const KEY_HOLD = 1300;

/* ------------------------------------------------------------------ what's on screen */
export type View = {
  /** Which template, in TEMPLATES. */
  t: number;
  /** The file's lines, or null while it's still empty. */
  lines: Seg[][] | null;
  /** What's been typed into each stop so far. */
  values: Record<number, string>;
  /** The stop the caret is in ($0 is the end), if any. */
  active: number | null;
  /** Whether the active stop's placeholder is selected, as it is on arrival. */
  selected: boolean;
  /** What's typed in the command palette, or null while it's closed. */
  query: string | null;
  /** Whether this round's template has landed: the lines come in when it does. */
  landed: boolean;
  /** The last shortcut pressed, which press it was, and whether its keycaps still show. */
  keys: { caps: string[]; n: number; on: boolean };
};

const blank = (t: number): View => ({
  t,
  lines: null,
  values: {},
  active: null,
  selected: false,
  query: null,
  landed: false,
  keys: { caps: [], n: 0, on: false },
});

/** A template already filled in: what's shown with no script to run. */
const finished = (t: number): View => ({
  ...blank(t),
  lines: parse(TEMPLATES[t].source, stamp()),
  values: Object.fromEntries(TEMPLATES[t].fill),
  active: 0,
});

/** The command palette's query, word by word, and the commands that match it, best first. */
export function palette(v: View) {
  const words = (v.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const matches = v.query === null ? [] : TEMPLATES[v.t].commands.filter((c) => words.every((w) => c.toLowerCase().includes(w)));
  return { words, matches };
}

/** Where the caret is, 1-based, as the status bar puts it, and how many characters are selected. */
export function caretOf(v: View) {
  const lines = v.lines ?? [];
  for (let i = 0; i < lines.length; i++) {
    let col = 1;
    for (const seg of lines[i]) {
      const text = typeof seg === "string" ? seg : (v.values[seg.stop] ?? seg.text);
      if (typeof seg !== "string" && seg.stop === v.active) return { ln: i + 1, col: col + text.length, sel: v.selected ? text.length : 0 };
      col += text.length;
    }
  }
  return { ln: 1, col: 1, sel: 0 };
}

/* ------------------------------------------------------------------ the script */
/**
 * The script, for an editor drawn from `setView`'s state and timed by `wait`
 * (a timeline's, so it pauses with it): a round to play for each template in turn.
 */
function editorScript(setView: Dispatch<SetStateAction<View>>, wait: Wait) {
  const set = (patch: Partial<View> | ((v: View) => Partial<View>)) =>
    setView((v) => ({ ...v, ...(typeof patch === "function" ? patch(v) : patch) }));

  let presses = 0;
  /** The keycaps come up, and go once they've been up KEY_HOLD, unless another press has replaced them. */
  const press = (caps: string[]) => {
    const n = ++presses;
    set({ keys: { caps, n, on: true } });
    void wait(KEY_HOLD).then(() => set((v) => (v.keys.n === n ? { keys: { ...v.keys, on: false } } : {})));
  };

  /**
   * One round, start to finish, with template `t`: a new, empty file; ⇧⌘P and
   * "insert tem" in the palette; ↩, and the template lands with its first stop
   * selected; that stop and the next typed in, ⇥ between them; a last ⇥ to
   * the end of the template, where the round ends.
   */
  const round = async (t: number) => {
    const tpl = TEMPLATES[t];
    set((v) => ({ ...blank(t), keys: { ...v.keys, on: false } }));
    await wait(600);

    press(KEYS.palette);
    await wait(350);
    set({ query: "" });
    await wait(300);
    await typeOut(wait, QUERY, 65, (query) => set({ query }));
    await wait(400);

    press(KEYS.enter);
    await wait(250);
    set({ query: null, lines: parse(tpl.source, stamp()), active: tpl.fill[0][0], selected: true, landed: true });
    await wait(800);

    for (let f = 0; f < tpl.fill.length; f++) {
      const [stop, text] = tpl.fill[f];
      if (f > 0) {
        press(KEYS.tab);
        await wait(250);
        set({ active: stop, selected: true });
        await wait(500);
      }
      set({ selected: false });
      await typeOut(wait, text, 54, (typed) => set((v) => ({ values: { ...v.values, [stop]: typed } })));
      await wait(400);
    }

    press(KEYS.tab);
    await wait(250);
    set({ active: 0, selected: false });
  };

  return round;
}

/**
 * The demo, for an editor drawn in `ref`'s element: round after round, one
 * template after another, each held a while once it's done. It plays while
 * `threshold` of the element is in view and the page is showing, and picks up
 * where it was when it's back; `still` shows a template already filled in
 * instead. `afterRound` runs at the end of each round, before the hold, on the
 * same clock (and, like the rest of the script, as it was when it started);
 * `onError`, if the script breaks, and the demo stops where it was.
 */
export function useEditorDemo(
  ref: RefObject<Element | null>,
  {
    still,
    threshold,
    afterRound,
    onError,
  }: {
    still: boolean;
    threshold: number;
    afterRound?: (round: number, wait: Wait) => Promise<void>;
    onError?: () => void;
  },
): View {
  const [view, setView] = useState<View>(() => (still ? finished(0) : blank(0)));
  const inView = useInView(ref, { threshold });
  const pageVisible = usePageVisible();

  useTimeline(!still && inView && pageVisible, async (wait) => {
    const round = editorScript(setView, wait);
    for (let n = 0; ; n++) {
      await round(n % TEMPLATES.length);
      await afterRound?.(n, wait);
      await wait(HOLD_MS);
    }
  }, onError);

  return view;
}
