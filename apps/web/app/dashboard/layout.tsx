import { requireOperator } from "@/lib/security/auth";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { operator } = await requireOperator();

  const operatorName = operator?.full_name ?? "Operator";
  const operatorEmail = operator?.email ?? "";

  return (
    <div className="min-h-screen bg-off-white">
      {/* Desktop sidebar */}
      <Sidebar operatorName={operatorName} operatorEmail={operatorEmail} />

      {/* Main content */}
      <main className="pb-[72px] md:pb-0 md:ml-[240px]">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
