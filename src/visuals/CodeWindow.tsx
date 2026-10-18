import { useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import { CommandPalette, EditorLines, KeyCaps } from "./Editor";
import { TEMPLATES, useEditorDemo } from "./editorDemo";
import "./CodeWindow.css";

/**
 * File Template at work in a flat VS Code window: the scripted session of
 * ./editorDemo.ts, one template after another, while the window is in view
 * (and from where it was when it comes back). The card shows a template
 * already filled in.
 */
export function CodeWindow({ variant = "stage" }: { variant?: "stage" | "card" | "detail" }) {
  const [still] = useState(() => variant === "card" || prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);
  const view = useEditorDemo(ref, { still, threshold: 0.4 });

  const tpl = TEMPLATES[view.t];

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
          <EditorLines view={view} />
          <CommandPalette view={view} />
        </div>

        <div className="editor__status">
          <span>{tpl.language}</span>
          <span>UTF-8</span>
        </div>
      </div>

      <KeyCaps keys={view.keys} />
    </div>
  );
}
