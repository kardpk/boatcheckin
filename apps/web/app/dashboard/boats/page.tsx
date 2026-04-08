import { requireOperator } from "@/lib/security/auth";
import { Plus, Ship, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function BoatsPage() {
  const { operator, supabase } = await requireOperator();

  const { data: boats } = await supabase
    .from("boats")
    .select("id, boat_name, boat_type, charter_type, max_capacity, is_active, created_at")
    .eq("operator_id", operator.id)
    .order("created_at", { ascending: false });

  const activeBoats = boats?.filter((b) => b.is_active) ?? [];
  const hasBoats = activeBoats.length > 0;

  return (
    <div className="px-page py-section max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-section">
        <div>
          <h1 className="text-h1 text-navy">Your boats</h1>
          <p className="text-body text-grey-text mt-micro">
            {hasBoats
              ? `${activeBoats.length} boat${activeBoats.length === 1 ? "" : "s"} registered`
              : "Get started by adding your first boat."}
          </p>
        </div>
        <Link
          href="/dashboard/boats/new"
          className="flex items-center gap-micro h-[40px] px-standard bg-navy text-white text-label rounded-btn hover:bg-mid-blue transition-colors shrink-0"
        >
          <Plus size={16} />
          Add boat
        </Link>
      </div>

      {hasBoats ? (
        <div className="space-y-tight">
          {activeBoats.map((boat) => (
              <Link
                key={boat.id}
                href={`/dashboard/boats/${boat.id}`}
                className="flex items-center gap-standard p-standard bg-white border border-border rounded-card hover:border-border-dark transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-light-blue flex items-center justify-center shrink-0">
                  <Ship size={20} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label text-dark-text truncate">
                    {boat.boat_name}
                  </p>
                  <p className="text-caption text-grey-text">
                    {boat.boat_type?.replace(/_/g, " ")} ·{" "}
                    {boat.charter_type?.replace(/_/g, " ")} ·{" "}
                    {boat.max_capacity} guests
                  </p>
                </div>
                <ChevronRight size={16} className="text-grey-text shrink-0" />
              </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-[80px] border-2 border-dashed border-border rounded-card">
          <Ship size={40} className="text-grey-text/30 mx-auto" />
          <p className="text-label text-grey-text mt-standard">
            No boats yet
          </p>
          <Link
            href="/dashboard/boats/new"
            className="inline-flex items-center gap-micro mt-standard px-page py-tight bg-navy text-white rounded-btn text-label hover:bg-mid-blue transition-colors"
          >
            <Plus size={16} />
            Set up your first boat →
          </Link>
        </div>
      )}
    </div>
  );
}
