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
    <div className="px-page py-[16px]">
      <div className="flex items-center justify-between mb-[16px]">
        <div>
          <h1 className="text-[22px] font-bold text-navy">Your boats</h1>
          <p className="text-[14px] text-text-mid mt-[3px] font-medium">
            {hasBoats
              ? `${activeBoats.length} boat${activeBoats.length === 1 ? "" : "s"} registered`
              : "Get started by adding your first boat."}
          </p>
        </div>
        <Link
          href="/dashboard/boats/new"
          className="
            flex items-center gap-[6px] h-[42px] px-[18px]
            bg-gold text-white text-[14px] font-semibold
            rounded-[10px] hover:bg-gold-hi transition-colors shrink-0
          "
        >
          <Plus size={16} />
          Add boat
        </Link>
      </div>

      {hasBoats ? (
        <div className="space-y-[8px]">
          {activeBoats.map((boat) => (
              <Link
                key={boat.id}
                href={`/dashboard/boats/${boat.id}`}
                className="
                  flex items-center gap-[12px] p-[14px]
                  bg-white border border-border rounded-[14px]
                  hover:border-gold/40 transition-colors
                "
              >
                <div className="w-[42px] h-[42px] rounded-full bg-gold-dim border border-gold-line flex items-center justify-center shrink-0">
                  <Ship size={20} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-navy truncate">
                    {boat.boat_name}
                  </p>
                  <p className="text-[12px] text-text-mid mt-[2px]">
                    {boat.boat_type?.replace(/_/g, " ")} ·{" "}
                    {boat.charter_type?.replace(/_/g, " ")} ·{" "}
                    {boat.max_capacity} guests
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-dim shrink-0" />
              </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-[48px] border-2 border-dashed border-border rounded-[14px]">
          <Ship size={36} className="text-text-dim/30 mx-auto" />
          <p className="text-[14px] text-text-mid mt-[12px] font-medium">
            No boats yet
          </p>
          <Link
            href="/dashboard/boats/new"
            className="
              inline-flex items-center gap-[6px] mt-[14px]
              px-[18px] py-[10px] bg-gold text-white
              rounded-[10px] text-[14px] font-semibold
              hover:bg-gold-hi transition-colors
            "
          >
            <Plus size={16} />
            Set up your first boat →
          </Link>
        </div>
      )}
    </div>
  );
}
