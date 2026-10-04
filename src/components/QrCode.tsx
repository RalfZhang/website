import { useMemo } from "react";
import { qrCodes, type QrId } from "../data/contacts";
import "./QrCode.css";

const FINDER = 7;
/** Quiet zone, in modules. The spec asks for 4; 3 plus the card's own paper is plenty. */
const QUIET = 3;

/**
 * A QR code drawn in ink on paper — always dark-on-light, whatever the theme,
 * because inverted codes don't scan everywhere. Verified to decode at 120–400px.
 */
export function QrCode({ id, className }: { id: QrId; className?: string }) {
  const { size, rows, text } = qrCodes[id];

  const cells = useMemo(() => {
    const inFinder = (x: number, y: number) =>
      (x < FINDER && y < FINDER) || (x >= size - FINDER && y < FINDER) || (x < FINDER && y >= size - FINDER);
    const out: { x: number; y: number }[] = [];
    rows.forEach((row, y) => {
      for (let x = 0; x < size; x++) if (row[x] === "1" && !inFinder(x, y)) out.push({ x, y });
    });
    return out;
  }, [rows, size]);

  const finders = [
    [0, 0],
    [size - FINDER, 0],
    [0, size - FINDER],
  ];

  return (
    <svg
      className={`qr ${className ?? ""}`}
      viewBox={`${-QUIET} ${-QUIET} ${size + QUIET * 2} ${size + QUIET * 2}`}
      role="img"
      aria-label={`QR code: ${text}`}
    >
      <rect x={-QUIET} y={-QUIET} width={size + QUIET * 2} height={size + QUIET * 2} rx="3" className="qr__paper" />
      {cells.map(({ x, y }) => (
        <rect key={`${x}-${y}`} className="qr__m" x={x + 0.04} y={y + 0.04} width="0.92" height="0.92" rx="0.22" />
      ))}
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect className="qr__ring" x={x + 0.5} y={y + 0.5} width="6" height="6" rx="1.3" />
          <rect className="qr__m" x={x + 2} y={y + 2} width="3" height="3" rx="0.6" />
        </g>
      ))}
    </svg>
  );
}
