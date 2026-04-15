import { requireOperator } from "@/lib/security/auth";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopBar } from "@/components/dashboard/TopBar";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { AlertTriangle } from "lucide-react";

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

  const trialDays =
    operator?.subscription_status === "trial"
      ? getTrialDaysRemaining(operator?.trial_ends_at ?? null)
      : null;

  const showTrialBanner = trialDays !== null && trialDays <= 7;

  return (
    <div className="min-h-screen bg-bg">
      {/* Navy top bar — all viewports */}
      <TopBar operatorName={operatorName} operatorId={operator.id} />

      {/* Main content — centered, max-width for iPhone/iPad */}
      <main className="max-w-[768px] mx-auto pb-[72px]">
        {/* Realtime notification toasts */}
        <DashboardNotifications operatorId={operator.id} />

        {/* Trial expiry banner */}
        {showTrialBanner && (
          <div className="mx-page mt-page">
            <div className="relative overflow-hidden bg-warn-dim border border-warn/15 rounded-[14px] px-page py-[14px] flex items-start gap-[10px]">
              {/* Warning top bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-warn" />
              <AlertTriangle size={18} className="text-warn shrink-0 mt-[2px]" />
              <div>
                <p className="text-[13px] font-bold text-warn">Trial Ending</p>
                <p className="text-[14px] text-text mt-[3px]">
                  Your free trial ends in{" "}
                  <strong>{trialDays <= 0 ? "less than a day" : `${trialDays} day${trialDays === 1 ? "" : "s"}`}</strong>.{" "}
                  <a
                    href="/dashboard/billing"
                    className="text-gold font-semibold hover:underline"
                  >
                    Upgrade now →
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {children}
      </main>

      {/* Bottom navigation — all viewports */}
      <BottomNav />
    </div>
  );
}
