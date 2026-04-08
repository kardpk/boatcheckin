import { requireOperator } from "@/lib/security/auth";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

function getTrialDaysRemaining(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  const now = new Date();
  const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { operator } = await requireOperator();

  const operatorName = operator?.full_name ?? "Operator";
  const operatorEmail = operator?.email ?? "";

  const trialDays =
    operator?.subscription_status === "trial"
      ? getTrialDaysRemaining(operator?.trial_ends_at ?? null)
      : null;

  const showTrialBanner = trialDays !== null && trialDays <= 7;

  return (
    <div className="min-h-screen bg-off-white">
      {/* Desktop sidebar */}
      <Sidebar operatorName={operatorName} operatorEmail={operatorEmail} />

      {/* Main content */}
      <main className="pb-[72px] md:pb-0 md:ml-[240px]">
        {/* Realtime notification toasts */}
        <DashboardNotifications operatorId={operator.id} />

        {/* Desktop header with notification bell */}
        <div className="hidden md:flex items-center justify-end px-page py-2 border-b border-[#F5F8FC]">
          <NotificationBell operatorId={operator.id} />
        </div>
        {/* Trial expiry banner */}
        {showTrialBanner && (
          <div className="bg-[#FFF3E0] border-b border-[#FFB74D] px-page py-tight text-[13px] text-[#E65100] flex items-center justify-between">
            <span>
              ⏳ Your free trial ends in{" "}
              <strong>{trialDays <= 0 ? "less than a day" : `${trialDays} day${trialDays === 1 ? "" : "s"}`}</strong>.
            </span>
            <a
              href="/dashboard/billing"
              className="font-semibold text-[#E65100] underline hover:no-underline shrink-0 ml-standard"
            >
              Upgrade now →
            </a>
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
