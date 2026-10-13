import { DecorativeBloom } from "./DecorativeBloom";
import { LoginCard } from "./LoginCard";

export function LoginArea() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-between overflow-hidden bg-bloom-cream px-10 pb-6 pt-[32px] xl:px-16">
      <DecorativeBloom className="pointer-events-none absolute -right-[70px] top-3 size-[220px]" />

      <LoginCard />

      <p className="relative w-full text-center text-[11px] text-bloom-muted">
        Privacy · Terms · Accessibility · © 2026 Looma Market Ltd.
      </p>
    </main>
  );
}
