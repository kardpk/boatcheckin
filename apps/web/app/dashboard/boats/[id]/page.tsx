import { requireOperator } from "@/lib/security/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Ship, MapPin, Users, Calendar, Anchor, ChevronLeft,
} from "lucide-react";

interface BoatDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoatDetailPage({ params }: BoatDetailPageProps) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  const { data: boat } = await supabase
    .from("boats")
    .select("*")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) return notFound();

  // Fetch trip count for this boat
  const { count: tripCount } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id);

  return (
    <div className="px-page py-section max-w-[640px] mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/boats"
        className="inline-flex items-center gap-micro text-label text-grey-text hover:text-dark-text transition-colors mb-standard"
      >
        <ChevronLeft size={16} />
        All boats
      </Link>

      {/* Header */}
      <div className="flex items-start gap-standard mb-section">
        <div className="w-14 h-14 rounded-full bg-light-blue flex items-center justify-center shrink-0">
          <Ship size={28} className="text-navy" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-h1 text-navy truncate">{boat.boat_name}</h1>
          <p className="text-body text-grey-text mt-micro">
            {boat.boat_type?.replace(/_/g, " ")} ·{" "}
            {boat.charter_type?.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-tight mb-section">
        <div className="p-standard bg-white border border-border rounded-card text-center">
          <Users size={18} className="text-navy mx-auto" />
          <p className="text-h2 text-dark-text mt-micro">{boat.max_capacity}</p>
          <p className="text-micro text-grey-text">Max guests</p>
        </div>
        <div className="p-standard bg-white border border-border rounded-card text-center">
          <Calendar size={18} className="text-navy mx-auto" />
          <p className="text-h2 text-dark-text mt-micro">{tripCount ?? 0}</p>
          <p className="text-micro text-grey-text">Trips</p>
        </div>
        <div className="p-standard bg-white border border-border rounded-card text-center">
          <Anchor size={18} className="text-navy mx-auto" />
          <p className="text-h2 text-dark-text mt-micro">
            {boat.is_active ? "Active" : "Draft"}
          </p>
          <p className="text-micro text-grey-text">Status</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-tight">
        {boat.marina_name && (
          <div className="flex items-start gap-tight p-standard bg-white border border-border rounded-card">
            <MapPin size={16} className="text-grey-text mt-[2px] shrink-0" />
            <div>
              <p className="text-label text-dark-text">{boat.marina_name}</p>
              {boat.marina_address && (
                <p className="text-caption text-grey-text">{boat.marina_address}</p>
              )}
              {boat.slip_number && (
                <p className="text-caption text-grey-text">Slip {boat.slip_number}</p>
              )}
            </div>
          </div>
        )}

        {boat.captain_name && (
          <div className="flex items-start gap-tight p-standard bg-white border border-border rounded-card">
            <Users size={16} className="text-grey-text mt-[2px] shrink-0" />
            <div>
              <p className="text-label text-dark-text">{boat.captain_name}</p>
              {boat.captain_bio && (
                <p className="text-caption text-grey-text">{boat.captain_bio}</p>
              )}
            </div>
          </div>
        )}

        {boat.parking_instructions && (
          <div className="p-standard bg-white border border-border rounded-card">
            <p className="text-micro text-grey-text uppercase tracking-wide mb-micro">Parking</p>
            <p className="text-body text-dark-text">{boat.parking_instructions}</p>
          </div>
        )}

        {boat.house_rules && (
          <div className="p-standard bg-white border border-border rounded-card">
            <p className="text-micro text-grey-text uppercase tracking-wide mb-micro">House rules</p>
            <p className="text-body text-dark-text whitespace-pre-line">{boat.house_rules}</p>
          </div>
        )}

        {boat.what_to_bring && (
          <div className="p-standard bg-white border border-border rounded-card">
            <p className="text-micro text-grey-text uppercase tracking-wide mb-micro">What to bring</p>
            <p className="text-body text-dark-text">{boat.what_to_bring}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-section flex gap-tight">
        <Link
          href={`/dashboard/trips/new?boat=${boat.id}`}
          className="flex-1 h-[48px] flex items-center justify-center bg-navy text-white text-label rounded-btn hover:bg-mid-blue transition-colors"
        >
          Create trip →
        </Link>
      </div>
    </div>
  );
}
