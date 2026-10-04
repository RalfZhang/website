import { Suspense } from "react";
import { useI18n } from "../../i18n";
import { customPages } from "./custom";
import { DefaultWorkPage } from "./DefaultWorkPage";

export function WorkPage({ slug }: { slug: string }) {
  const work = useI18n().works.get(slug)!;
  const Custom = customPages[slug];
  if (!Custom) return <DefaultWorkPage key={slug} work={work} />;
  return (
    <Suspense fallback={null}>
      <Custom key={slug} work={work} />
    </Suspense>
  );
}
