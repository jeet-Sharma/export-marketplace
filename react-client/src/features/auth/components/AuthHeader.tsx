import Link from "next/link";
import { ArrowLeftIcon } from "./icons";

export function AuthHeader() {
  return (
    <header className="flex h-[70px] w-full items-center justify-between overflow-hidden bg-bloom-plum px-7">
      <div className="flex items-center gap-[9px]">
        <div className="flex size-[30px] items-center justify-center rounded-[10px] bg-bloom-amber">
          <span className="text-[18px] font-bold leading-none text-bloom-ink">
            &#8734;
          </span>
        </div>
        <span className="text-[24px] text-white">looma</span>
        <span className="rounded-full bg-white/[0.09] px-[9px] py-[5px] text-[10px] font-bold uppercase text-white">
          Market Bloom
        </span>
      </div>
      <nav className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-[7px] text-[13px] font-bold text-white"
        >
          <ArrowLeftIcon className="size-4" />
          Back to marketplace
        </Link>
        <a href="#" className="text-[13px] font-normal text-white opacity-80">
          Need help?
        </a>
      </nav>
    </header>
  );
}
