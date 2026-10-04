import { Suspense } from "react";
import { getWork } from "../../data/works";
import { customPages } from "./custom";
import { DefaultWorkPage } from "./DefaultWorkPage";

export function WorkPage({ slug }: { slug: string }) {
  const work = getWork(slug)!;
  const Custom = customPages[slug];
  if (!Custom) return <DefaultWorkPage key={slug} work={work} />;
  return (
    <Suspense fallback={null}>
      <Custom key={slug} work={work} />
    </Suspense>
  );
}
