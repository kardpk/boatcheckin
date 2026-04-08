import { requireOperator } from "@/lib/security/auth";
import Link from "next/link";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { operator, supabase } = await requireOperator();
  const firstName = operator?.full_name?.split(" ")[0] ?? "there";

  // Check if operator has any boats
  const { count } = await supabase
    .from("boats")
    .select("id", { count: "exact", head: true })
    .eq("operator_id", operator!.id);

  const hasBoats = (count ?? 0) > 0;

  return (
    <div className="px-page py-section md:px-large md:py-large">
      <h1 className="text-h1 text-dark-text">
        {getGreeting()}, {firstName} 👋
      </h1>

      {hasBoats ? (
        <p className="text-body text-grey-text mt-tight">
          Dashboard coming soon. Your boats are ready.
        </p>
      ) : (
        <div className="mt-section">
          <p className="text-body text-grey-text mb-section">
            Dashboard coming soon. Set up your boat to get started.
          </p>
          <Link
            href="/dashboard/boats/new"
            className="inline-flex items-center justify-center h-[52px] px-large bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors"
          >
            Set up your first boat →
          </Link>
        </div>
      )}
    </div>
  );
}
