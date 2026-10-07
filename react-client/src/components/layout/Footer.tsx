import { FOOTER_LINKS } from "@/data/navigation";

/** Site footer with brand, tagline, links and copyright. */
export function Footer() {
  return (
    <footer className="flex h-14 items-center justify-between bg-ink px-[30px] text-white">
      <p className="text-[19px]">looma</p>
      <p className="text-xs opacity-60">
        The shared market for independent goods.
      </p>
      <nav className="flex gap-6 text-xs opacity-75">
        {FOOTER_LINKS.map((link) => (
          <a key={link} href="#">
            {link}
          </a>
        ))}
      </nav>
      <p className="text-[11px] opacity-50">© 2026 Looma Market Ltd.</p>
    </footer>
  );
}
