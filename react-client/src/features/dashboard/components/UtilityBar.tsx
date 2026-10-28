"use client";

import { useRouter } from "next/navigation";
import { BellIcon } from "./icons";
import { deleteCookie } from "@/lib/cookies";
import { useAppDispatch } from "@/store/hooks";
import { clearCredentials } from "@/features/auth/authSlice";

type UtilityBarProps = {
  context: string;
  section: string;
};

export function UtilityBar({ context, section }: UtilityBarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(clearCredentials());
    deleteCookie("access_token");
    deleteCookie("user_data");
    router.push("/login?force=true");
  };

  return (
    <div className="flex h-[58px] w-full shrink-0 items-center justify-between border-b border-[#eee9e4] bg-white px-6">
      <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
        <span className="font-bold text-bloom-ink">{context}</span>
        <span className="text-[#a6a2a4]">/</span>
        <span className="text-bloom-muted">{section}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-bloom-green-surface px-3 py-2">
          <span className="size-[7px] rounded-full bg-bloom-green" />
          <span className="text-[11px] font-semibold text-bloom-green">
            Marketplace live
          </span>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-[34px] items-center justify-center rounded-[10px] border border-bloom-border bg-bloom-surface text-bloom-ink hover:bg-bloom-cream"
        >
          <BellIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-[8px] border border-bloom-border bg-white px-3 py-1.5 text-[11px] font-bold text-bloom-pink transition-colors hover:bg-bloom-pink hover:text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
