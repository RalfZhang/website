import type { ComponentType, LazyExoticComponent } from "react";
import type { Work } from "../../../data/works";

export type WorkPageProps = { work: Work };

/**
 * Bespoke project pages, by slug. Anything not listed here renders
 * DefaultWorkPage from the data in src/data/works.ts. To give a work its own
 * page, add a component next to this file and register it lazily, e.g.
 *
 *   inkcity: lazy(() => import("./InkCityPage")),
 */
export const customPages: Partial<Record<string, LazyExoticComponent<ComponentType<WorkPageProps>>>> = {};
