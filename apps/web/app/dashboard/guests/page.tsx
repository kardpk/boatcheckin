import { Users } from "lucide-react";

export default function GuestsPage() {
  return (
    <div className="px-page py-[16px]">
      <h1 className="text-[22px] font-bold text-navy mb-[6px]">Guests</h1>
      <div className="text-center py-[48px]">
        <div className="w-[56px] h-[56px] mx-auto mb-[12px] rounded-full bg-gold-dim border border-gold-line flex items-center justify-center">
          <Users size={24} className="text-gold" />
        </div>
        <p className="text-[15px] text-text-mid font-medium">Coming soon</p>
      </div>
    </div>
  );
}
