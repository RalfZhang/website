import type { SVGProps } from "react";
import brands from "../data/brands.json";

type P = SVGProps<SVGSVGElement>;

/* Plain line icons on a 16px grid: square ends, sharp corners, like the
   map's own strokes. */
const line = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  "aria-hidden": true,
} as const;

export const ArrowRight = (p: P) => (
  <svg {...line} {...p}>
    <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" />
  </svg>
);

export const ArrowLeft = (p: P) => (
  <svg {...line} {...p}>
    <path d="M13.5 8h-10M7 4.5 3.5 8 7 11.5" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg {...line} {...p}>
    <path d="M4.5 11.5l7-7M6 4.5h5.5V10" />
  </svg>
);

export const ArrowDown = (p: P) => (
  <svg {...line} {...p}>
    <path d="M8 2.5v10M4.5 9 8 12.5 11.5 9" />
  </svg>
);

export const Close = (p: P) => (
  <svg {...line} {...p}>
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
  </svg>
);

export const Menu = (p: P) => (
  <svg {...line} {...p}>
    <path d="M2.5 5.5h11M2.5 10.5h11" />
  </svg>
);

/** Light / dark: a disc, half inked. */
export const Contrast = (p: P) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1.75a6.25 6.25 0 0 1 0 12.5Z" fill="currentColor" />
  </svg>
);

export const QrIcon = (p: P) => (
  <svg viewBox="0 0 16 16" aria-hidden {...p}>
    <path
      fill="currentColor"
      d="M2 2h5v5H2zm1.5 1.5v2h2v-2zM9 2h5v5H9zm1.5 1.5v2h2v-2zM2 9h5v5H2zm1.5 1.5v2h2v-2zM9 9h2v2H9zm3 0h2v2h-2zm-3 3h2v2H9zm3 0h2v2h-2z"
    />
  </svg>
);

export type BrandId = keyof typeof brands;

/** A platform's logo (Simple Icons, CC0 paths), drawn in the current text colour. */
export function BrandIcon({ id, ...p }: { id: BrandId } & P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...p}>
      <path d={brands[id].path} fill="currentColor" />
    </svg>
  );
}
