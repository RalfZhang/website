import type { Work } from "../data/works";
import { CodeWindow } from "./CodeWindow";
import { CstuVisual } from "./CstuVisual";
import { InkCityVisual } from "./InkCityVisual";
import { Poster } from "./Poster";
import { WatchClock } from "./WatchClock";

export type VisualVariant = "stage" | "card" | "detail";

/** The live visual for a work — each manages its own "is it on screen?" state. */
export function WorkVisual({ work, variant }: { work: Work; variant: VisualVariant }) {
  switch (work.visual) {
    case "roadmap":
      return <InkCityVisual variant={variant} />;
    case "code":
      return <CodeWindow variant={variant} />;
    case "clock":
      return <WatchClock variant={variant} />;
    case "browser":
      return <CstuVisual variant={variant} />;
    default:
      return <Poster work={work} variant={variant === "card" ? "card" : "detail"} />;
  }
}
