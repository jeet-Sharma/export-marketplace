"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { routes } from "@/config/routes";

/** Brand logo and wordmark. */
function Brand() {
  return (
    <Link href={routes.home} className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-[10px] bg-amber text-[17px] text-ink">
        ∞
      </div>
      <span className="text-2xl text-white">looma</span>
    </Link>
  );
}

/** Delivery destination indicator with pin icon and dropdown. */
function DeliverTo() {
  return (
    <button className="flex items-center gap-[6px] rounded-[8px] border border-white/20 px-[10px] py-[5px] text-white hover:border-white/40 transition-colors">
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
        <path d="M6 0C3.24 0 1 2.24 1 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 6.5C5.17 6.5 4.5 5.83 4.5 5S5.17 3.5 6 3.5 7.5 4.17 7.5 5 6.83 6.5 6 6.5z" fill="currentColor"/>
      </svg>
      <div className="text-left">
        <p className="text-[10px] leading-[1.2] opacity-70">Deliver to</p>
        <p className="text-[12px] font-extrabold leading-[1.3]">Rotterdam 3011 ▾</p>
      </div>
    </button>
  );
}

/** Search bar with category selector and search action. */
function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Prevent the native full-page reload; navigate client-side to the
    // products listing with the query. Submitting works via both the button
    // and the Enter key because this is a real <form> with a submit button.
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    router.push(routes.search(trimmed));
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-[42px] flex-1 items-center overflow-hidden rounded-[10px] bg-white"
    >
      <div className="flex h-full items-center border-r border-black/10 bg-cream px-3">
        <span className="whitespace-nowrap text-xs font-bold text-ink">All categories ▾</span>
      </div>
      <label className="sr-only" htmlFor="marketplace-search">
        Search products, suppliers and origins
      </label>
      <input
        id="marketplace-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products, suppliers and origins"
        className="flex-1 bg-transparent px-3 text-[13px] text-ink placeholder:text-ink/50 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-full w-[46px] items-center justify-center bg-amber"
      >
        <Image
          src="/marketplace/search.svg"
          alt=""
          width={19}
          height={19}
          aria-hidden
        />
      </button>
    </form>
  );
}

/** Cart pill with item count and view link. */
function CartPill() {
  return (
    <Link
      href={routes.cart}
      className="flex items-center gap-[6px] rounded-[8px] border border-white/20 px-[10px] py-[5px] text-white hover:border-white/40 transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[12px] font-bold">Cart · 2</span>
      <span className="rounded-[5px] bg-amber px-[7px] py-[2px] text-[11px] font-extrabold text-ink">View</span>
    </Link>
  );
}

/** Account-related quick links. */
function AccountLinks() {
  return (
    <>
      <CartPill />
      <span className="text-[13px] font-bold text-white opacity-80">EN · USD</span>
      <Link href={routes.signIn} className="text-[13px] font-bold text-white">
        Sign in
      </Link>
      <Link href={routes.orders} className="text-[13px] font-bold text-white">
        Orders
      </Link>
    </>
  );
}

/** Primary navigation row: brand, delivery, search and account links. */
export function PrimaryNav() {
  return (
    <div className="flex h-[66px] flex-wrap items-center gap-[18px] bg-maroon px-7">
      <Brand />
      <DeliverTo />
      <SearchBar />
      <AccountLinks />
    </div>
  );
}
