import { Settings, FileText, CreditCard, ScrollText, LogOut } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/dashboard/actions";

export default function SettingsPage() {
  const items = [
    { href: "/dashboard/settings/waivers", icon: ScrollText, label: "Waiver Templates", desc: "Manage custom waivers" },
    { href: "/dashboard/billing", icon: CreditCard, label: "Billing", desc: "Subscription & invoices" },
    { href: "/dashboard/revenue", icon: FileText, label: "Revenue", desc: "Add-on revenue reports" },
  ];

  return (
    <div className="px-page py-[16px]">
      <h1 className="text-[22px] font-bold text-navy mb-[16px]">Settings</h1>

      <div className="space-y-[8px]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="
              flex items-center gap-[12px] p-[14px]
              bg-white border border-border rounded-[14px]
              hover:border-gold/40 transition-colors
            "
          >
            <div className="w-[38px] h-[38px] rounded-[10px] bg-gold-dim border border-gold-line flex items-center justify-center shrink-0">
              <item.icon size={18} className="text-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-navy">{item.label}</p>
              <p className="text-[12px] text-text-mid mt-[1px]">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="mt-[24px] pt-[16px] border-t border-border">
        <form action={signOutAction}>
          <button
            type="submit"
            className="
              flex items-center gap-[8px] text-[14px]
              text-error font-medium hover:text-error/80 transition-colors
            "
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
