import { Fragment, useMemo, type ReactNode } from "react";
import { worksIn } from "../data/works";
import { useRouter } from "../lib/router";
import { LOCALES } from "./locales";
import { messages } from "./messages";

export { fmt } from "./fmt";

/**
 * Like fmt, for placeholders that are elements: rich("{pct} of {year}", { pct: <strong/>, year })
 * keeps the word order in the message, where each language wants it.
 */
export function rich(message: string, values: Record<string, ReactNode>): ReactNode {
  return message
    .split(/\{(\w+)\}/g)
    .map((part, i) => <Fragment key={i}>{i % 2 === 0 ? part : (values[part] ?? `{${part}}`)}</Fragment>);
}

/** The current language (from the URL), its interface copy, and its works. */
export function useI18n() {
  const { lang } = useRouter();
  return useMemo(() => {
    const tag = LOCALES[lang].tag;
    const numbers = new Intl.NumberFormat(tag);
    return {
      lang,
      tag,
      t: messages[lang],
      works: worksIn(lang),
      formatNumber: (n: number) => numbers.format(n),
    };
  }, [lang]);
}
