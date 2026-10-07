import { ConceptBar } from "@/components/layout/ConceptBar";
import { PrimaryNav } from "@/components/layout/PrimaryNav";
import { CategoryNav } from "@/components/layout/CategoryNav";

/** Full site header: concept bar, primary navigation and category strip. */
export function SiteHeader() {
  return (
    <header className="flex flex-col overflow-hidden">
      <ConceptBar />
      <PrimaryNav />
      <CategoryNav />
    </header>
  );
}
