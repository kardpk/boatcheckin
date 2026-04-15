import Link from "next/link";
import { Anchor, Ship } from "lucide-react";

export function EmptyDashboard({ operatorName }: { operatorName: string }) {
  return (
    <div className="max-w-[640px] mx-auto px-page py-[48px] text-center">
      <div className="w-[72px] h-[72px] mx-auto mb-[16px] rounded-full bg-gold-dim border border-gold-line flex items-center justify-center">
        <Anchor size={32} className="text-gold" />
      </div>
      <h1 className="text-[24px] font-bold text-navy mb-[8px]">
        Welcome aboard, {operatorName}!
      </h1>
      <p className="text-[16px] text-text-mid mb-[28px] max-w-[400px] mx-auto leading-[1.6]">
        Set up your boat profile to start creating trips and checking in guests.
      </p>
      <Link
        href="/dashboard/boats/new"
        className="
          inline-flex items-center justify-center gap-[8px]
          h-[52px] px-[28px] rounded-[10px]
          bg-gold text-white font-semibold text-[15px]
          hover:bg-gold-hi transition-colors
        "
      >
        <Ship size={18} />
        Set up my boat →
      </Link>
    </div>
  );
}
