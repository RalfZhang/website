import { useEffect, useMemo, useRef, useState } from "react";
import { Close } from "../../components/icons";
import type { Work } from "../../data/works";
import { useI18n } from "../../i18n";
import { prefersReducedMotion } from "../../lib/motion";
import { typeOut, type Wait } from "../../lib/timeline";
import { CommandPalette, EditorLines, KeyCaps } from "../../visuals/Editor";
import { caretOf, TEMPLATES, useEditorDemo } from "../../visuals/editorDemo";
import { copyWords, FeatureCopy } from "./Feature";
import "./FileTemplateFeature.css";

/** Milliseconds to type each run of words in (kind · year, title, tagline, each button): long runs type faster. */
const RUN_MS = [380, 650, 1100, 320, 320];

/**
 * A run of words: not yet begun, being typed (`chars` of it so far, the caret
 * after them), or typed. The rest is laid out already, unseen, so the lines
 * never move as it fills in, and stays in the accessibility tree, so the
 * heading reads whole from the start.
 */
function Typed({ text, state, chars }: { text: string; state: "wait" | "now" | "done"; chars: number }) {
  const shown = state === "done" ? text.length : state === "now" ? chars : 0;
  return (
    <span className="typed" data-typed={state}>
      {text.slice(0, shown)}
      {/* Keyed by the count, so it holds steady while typing and blinks once it stops. */}
      {state === "now" && <span className="typed__caret" key={shown} aria-hidden />}
      <span className="typed__rest">{text.slice(shown)}</span>
    </span>
  );
}

/**
 * File Template's home screen is the editor itself, full screen and in the
 * site's own paper (or night), as InkCity's is its wallpaper. It opens on an
 * empty file and, once it's scrolled to, runs the editor demo
 * (visuals/editorDemo.ts): the palette, "Insert Template", the stops filled
 * in, each shortcut up in big keycaps in the middle of the screen. Once that
 * first round is done, the caret leaves the editor for the words, which type
 * themselves out in the bottom-right corner, across from the code in the
 * top-left — buttons too — and then the editor carries on with the next
 * language's template, round after round. The demo runs only while the screen
 * is in view and picks up where it was when it comes back; with reduced
 * motion, the template is shown filled in and the words are simply there.
 */
export function FileTemplateFeature({ work }: { work: Work }) {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [still] = useState(prefersReducedMotion);

  const words = copyWords(work, t.home.learnMore);
  // The run being typed, and how far into it: -1 before the first, past the last once done.
  const [typed, setTyped] = useState(() => ({ at: still ? Infinity : -1, chars: 0 }));
  const typing = typed.at >= 0 && typed.at < words.length;
  // The script outlives renders; a switch of language mid-run should still type the words on screen.
  const latest = useRef(words);
  useEffect(() => {
    latest.current = words;
  });

  const typeWords = async (wait: Wait) => {
    for (let at = 0; at < latest.current.length; at++) {
      setTyped({ at, chars: 0 });
      await wait(at === 0 ? 350 : 160);
      const run = latest.current[at];
      await typeOut(wait, run, (RUN_MS[at] ?? 320) / run.length, (s) => setTyped({ at, chars: s.length }));
    }
    setTyped({ at: Infinity, chars: 0 });
  };

  const view = useEditorDemo(ref, {
    still,
    threshold: 0.5,
    afterRound: async (round, wait) => {
      if (round > 0) return;
      await wait(200);
      await typeWords(wait);
    },
    // Should the demo break, the words are simply there, as with reduced motion.
    onError: () => setTyped({ at: Infinity, chars: 0 }),
  });

  const tpl = TEMPLATES[view.t];
  const caret = useMemo(() => caretOf(view), [view]);

  return (
    <section
      id={work.slug}
      ref={ref}
      className="screen ftscreen"
      aria-labelledby={`${work.slug}-title`}
    >
      <div className="ftscreen__tabs" aria-hidden>
        <span className="ftscreen__tab">
          {tpl.file}
          {view.lines ? <i className="ftscreen__dirty" /> : <Close />}
        </span>
      </div>

      <div className="ftscreen__body">
        <div className="ftscreen__file" aria-hidden>
          {/* The words have the caret while they type. */}
          <EditorLines view={view} focused={!typing} />
          <CommandPalette view={view} />
        </div>
        <KeyCaps keys={view.keys} className="ftscreen__keys" />
        {/* Out of reach until it's typed (reduced motion has it there from the start), so Tab never lands on a button no one can see. */}
        <div className="ftscreen__words" inert={typed.at < words.length}>
          <FeatureCopy
            work={work}
            text={words}
            reveal={false}
            words={(text, i) => (
              <Typed text={text} chars={typed.chars} state={i < typed.at ? "done" : i === typed.at ? "now" : "wait"} />
            )}
          />
        </div>
      </div>

      <div className="ftscreen__status" aria-hidden>
        <span>
          Ln {caret.ln}, Col {caret.col}
          {caret.sel > 0 && ` (${caret.sel} selected)`}
        </span>
        <span className="ftscreen__wide">UTF-8</span>
        <span>{tpl.language}</span>
      </div>
    </section>
  );
}
