import type { Lang } from "../locales";
import { cn } from "./cn";
import { en, type Messages } from "./en";

export type { Messages };

// Both languages ship in the bundle: together they're a few kilobytes, less than the
// round trip lazy-loading one would cost.
export const messages: Record<Lang, Messages> = { en, cn };
