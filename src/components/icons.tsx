import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** The "›" of "Learn more ›". */
export const ChevronRight = (p: P) => (
  <svg viewBox="0 0 8 14" strokeWidth={1.7} {...stroke} {...p}>
    <path d="M1.5 1.5 6.5 7l-5 5.5" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg viewBox="0 0 24 13" strokeWidth={1.8} {...stroke} {...p}>
    <path d="M2 2l10 9 10-9" />
  </svg>
);

export const ArrowUpRight = (p: P) => (
  <svg viewBox="0 0 12 12" strokeWidth={1.5} {...stroke} {...p}>
    <path d="M3 9 9 3M4.2 3H9v4.8" />
  </svg>
);

export const Close = (p: P) => (
  <svg viewBox="0 0 14 14" strokeWidth={1.6} {...stroke} {...p}>
    <path d="M2 2l10 10M12 2 2 12" />
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

export const Sun = (p: P) => (
  <svg viewBox="0 0 20 20" strokeWidth={1.6} {...stroke} {...p}>
    <circle cx="10" cy="10" r="3.6" fill="currentColor" stroke="none" />
    <path d="M10 1.8v1.9M10 16.3v1.9M1.8 10h1.9M16.3 10h1.9M4.2 4.2l1.35 1.35M14.45 14.45l1.35 1.35M4.2 15.8l1.35-1.35M14.45 5.55l1.35-1.35" />
  </svg>
);

export const Moon = (p: P) => (
  <svg viewBox="0 0 20 20" aria-hidden {...p}>
    <path fill="currentColor" d="M15.9 12.6A7 7 0 0 1 7.4 4.1a7 7 0 1 0 8.5 8.5Z" />
  </svg>
);
