import Image from "next/image";

/** Brand logo and wordmark. */
function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-[10px] bg-amber text-[17px] text-ink">
        ∞
      </div>
      <span className="text-2xl text-white">looma</span>
    </div>
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
  return (
    <div className="flex h-[42px] flex-1 items-center overflow-hidden rounded-[10px] bg-white">
      <div className="flex h-full items-center bg-cream px-3">
        <span className="text-xs font-bold text-ink">All products ▾</span>
      </div>
      <label className="sr-only" htmlFor="marketplace-search">
        Search products, suppliers and origins
      </label>
      <input
        id="marketplace-search"
        type="search"
        placeholder="Search products, suppliers and origins"
        className="flex-1 bg-transparent px-3 text-[13px] text-ink placeholder:text-ink/50 focus:outline-none"
      />
      <button
        type="button"
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
    </div>
  );
}

/** Account-related quick links. */
function AccountLinks() {
  return (
    <>
      <span className="text-[13px] font-bold text-white">EN · USD</span>
      <a href="#" className="text-[13px] font-bold text-white">
        Sign in
      </a>
      <a href="#" className="text-[13px] font-bold text-white">
        Orders
      </a>
      <a href="#" className="text-sm text-amber">
        Cart · 2
      </a>
    </>
  );
}

/** Primary navigation row: brand, delivery, search and account links. */
export function PrimaryNav() {
  return (
    <div className="flex h-[66px] items-center gap-[18px] bg-maroon px-7">
      <Brand />
      <DeliverTo />
      <SearchBar />
      <AccountLinks />
    </div>
  );
}
