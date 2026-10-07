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

/** Delivery destination indicator. */
function DeliverTo() {
  return (
    <div className="w-[125px] text-white">
      <p className="text-xs leading-[1.35]">Deliver to</p>
      <p className="text-[13px] font-extrabold leading-[1.35]">Rotterdam 3011</p>
    </div>
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
      <div className="flex h-full items-center bg-cream px-3">
        <span className="text-xs font-bold text-ink">All products ▾</span>
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

/** Account-related quick links. */
function AccountLinks() {
  return (
    <>
      <span className="text-[13px] font-bold text-white">EN · USD</span>
      <Link href={routes.signIn} className="text-[13px] font-bold text-white">
        Sign in
      </Link>
      <Link href={routes.orders} className="text-[13px] font-bold text-white">
        Orders
      </Link>
      <Link href={routes.cart} className="text-sm text-amber">
        Cart · 2
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
