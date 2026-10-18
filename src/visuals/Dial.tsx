import { memo } from "react";
import { fmt, useI18n } from "../i18n";
import { bong, type Hands, type Zone } from "./bigBen";
import "./Dial.css";

/*
 * Big Ben's dial, flat: a face, four numerals and eight markers, sixty minute
 * ticks, three hands and the zone it keeps, in the colours of the --w-* tokens
 * set by whoever draws it (Dial.css lists them). Pressed, it rings the bell.
 */

const NUMERALS: [string, number][] = [
  ["XII", 0],
  ["III", 90],
  ["VI", 180],
  ["IX", 270],
];

/** Redrawn only when its label changes, not with each tick of the hands. */
const Face = memo(function Face({ label }: { label: string }) {
  return (
    <>
      <circle className="watch__face" r="200" />
      {Array.from({ length: 60 }, (_, i) =>
        i % 5 === 0 ? (
          <rect key={i} className="watch__marker" x="-4.5" y="-184" width="9" height="30" rx="4.5" transform={`rotate(${i * 6})`} />
        ) : (
          <rect key={i} className="watch__tick" x="-1.25" y="-184" width="2.5" height="10" rx="1.25" transform={`rotate(${i * 6})`} />
        ),
      )}
      {NUMERALS.map(([n, deg]) => {
        const a = (deg * Math.PI) / 180;
        return (
          <text key={n} className="watch__numeral" x={Math.sin(a) * 118} y={-Math.cos(a) * 118} dy="0.36em">
            {n}
          </text>
        );
      })}
      <text className="watch__label" y="62">
        {label}
      </text>
    </>
  );
});

/** The dial showing `hands` (see useHands), and the zone it keeps under them; `waking`, see Dial.css. */
export function Dial({ zone, hands, waking = false }: { zone: Zone; hands: Hands; waking?: boolean }) {
  const { t } = useI18n();
  const rot = (deg: number) => ({ transform: `rotate(${deg}deg)` });

  return (
    <button
      type="button"
      className={waking ? "watch is-waking" : "watch"}
      onClick={bong}
      aria-label={t.bigben.ring}
      title={t.bigben.ring}
    >
      <svg viewBox="-200 -200 400 400" aria-hidden>
        <Face label={fmt(t.bigben.face, { zone: zone.name(Date.now()) })} />
        <g className="watch__hand watch__hand--hour" style={rot(hands.h)}>
          <rect x="-3" y="-28" width="6" height="30" rx="3" />
          <rect x="-8" y="-112" width="16" height="88" rx="8" />
        </g>
        <g className="watch__hand watch__hand--minute" style={rot(hands.m)}>
          <rect x="-3" y="-28" width="6" height="30" rx="3" />
          <rect x="-6.5" y="-172" width="13" height="148" rx="6.5" />
        </g>
        <g className="watch__hand watch__hand--second" style={rot(hands.s)}>
          <rect x="-1.6" y="-182" width="3.2" height="214" rx="1.6" />
        </g>
        <circle className="watch__pin" r="8" />
        <circle className="watch__pin-dot" r="3" />
      </svg>
    </button>
  );
}
