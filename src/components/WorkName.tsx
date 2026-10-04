import type { Work } from "../data/works";

/**
 * A work's name, then its name in the other language in grey. Each stays in one
 * piece — the line may break between them, never inside 大笨钟 or "Big Ben".
 */
export function WorkName({ work }: { work: Work }) {
  if (!work.aside) return work.title;
  return (
    <>
      <span className="nowrap">{work.title}</span> <span className="muted nowrap">{work.aside}</span>
    </>
  );
}
