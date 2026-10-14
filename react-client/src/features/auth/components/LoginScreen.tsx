import { AuthHeader } from "./AuthHeader";
import { ConceptLabel } from "./ConceptLabel";
import { LoginArea } from "./LoginArea";
import { MarketplaceStory } from "./MarketplaceStory";

export function LoginScreen() {
  return (
    <div className="flex min-h-full flex-col bg-bloom-cream font-sans text-bloom-ink">
      <ConceptLabel />
      <AuthHeader />
      <div className="flex flex-1 items-stretch">
        <MarketplaceStory />
        <LoginArea />
      </div>
    </div>
  );
}
