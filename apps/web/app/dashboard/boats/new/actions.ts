"use server";

import { requireOperator } from "@/lib/security/auth";
import { auditLog } from "@/lib/security/audit";
import type { WizardAddon } from "./types";

/**
 * Server action: Save complete boat profile to Supabase.
 * Called when operator completes all 8 wizard steps.
 *
 * Flow:
 * 1. requireOperator() — auth check
 * 2. Upload captain photo to Supabase Storage
 * 3. Upload boat photos to Supabase Storage
 * 4. INSERT into boats table
 * 5. INSERT addons if any
 * 6. auditLog boat_created
 * 7. Return { boatId }
 */

interface SaveBoatResult {
  success: boolean;
  boatId?: string;
  error?: string;
}

export async function saveBoatProfile(data: {
  // We receive serialisable data only (no File objects)
  boatName: string;
  boatType: string;
  charterType: string;
  yearBuilt: string;
  lengthFt: string;
  maxCapacity: string;
  uscgDocNumber: string;
  registrationState: string;

  marinaName: string;
  marinaAddress: string;
  slipNumber: string;
  parkingInstructions: string;
  operatingArea: string;
  lat: number | null;
  lng: number | null;

  captainName: string;
  captainBio: string;
  captainLicense: string;
  captainLicenseType: string;
  captainLanguages: string[];
  captainYearsExp: string;
  captainTripCount: string;
  captainRating: string;
  captainCertifications: string[];

  selectedEquipment: string[];
  selectedAmenities: Record<string, boolean>;
  specificFieldValues: Record<string, string | boolean | string[]>;
  customDetails: { label: string; value: string }[];

  standardRules: string[];
  customDos: string[];
  customDonts: string[];
  customRuleSections: { id: string; title: string; items: string[]; type: string }[];

  whatToBring: string;
  whatNotToBring: string;

  waiverText: string;
  safetyPoints: string[];

  addons: WizardAddon[];
}): Promise<SaveBoatResult> {
  try {
    // 1. Auth
    const { operator, supabase } = await requireOperator();

    // 2. Boat count check
    const { count } = await supabase
      .from("boats")
      .select("id", { count: "exact", head: true })
      .eq("operator_id", operator.id)
      .eq("is_active", true);

    if ((count ?? 0) >= operator.max_boats) {
      return { success: false, error: "Boat limit reached for your subscription tier." };
    }

    // 3. Build house_rules text from structured data
    const houseRulesText = [
      "HOUSE RULES:",
      ...data.standardRules.map((r, i) => `${i + 1}. ${r}`),
      "",
      "DOs:",
      ...data.customDos.map((d) => `✓ ${d}`),
      "",
      "DON'Ts:",
      ...data.customDonts.map((d) => `✗ ${d}`),
    ].join("\n");

    // 4. INSERT boat
    const { data: boat, error: boatError } = await supabase
      .from("boats")
      .insert({
        operator_id: operator.id,
        boat_name: data.boatName,
        boat_type: data.boatType,
        charter_type: data.charterType,
        year_built: data.yearBuilt ? parseInt(data.yearBuilt) : null,
        length_ft: data.lengthFt ? parseFloat(data.lengthFt) : null,
        max_capacity: parseInt(data.maxCapacity) || 1,
        marina_name: data.marinaName,
        marina_address: data.marinaAddress,
        slip_number: data.slipNumber || null,
        parking_instructions: data.parkingInstructions || null,
        operating_area: data.operatingArea || null,
        lat: data.lat,
        lng: data.lng,
        captain_name: data.captainName || null,
        captain_bio: data.captainBio || null,
        captain_license: data.captainLicense || null,
        captain_license_type: data.captainLicenseType || null,
        captain_languages: data.captainLanguages,
        captain_years_exp: data.captainYearsExp ? parseInt(data.captainYearsExp) : null,
        captain_trip_count: data.captainTripCount ? parseInt(data.captainTripCount) : null,
        captain_rating: data.captainRating ? parseFloat(data.captainRating) : null,
        captain_certifications: data.captainCertifications,
        what_to_bring: data.whatToBring || null,
        what_not_to_bring: data.whatNotToBring || null,
        house_rules: houseRulesText,
        standard_rules: data.standardRules,
        dos: data.customDos,
        donts: data.customDonts,
        custom_rule_sections: data.customRuleSections,
        safety_points: data.safetyPoints,
        safety_briefing: data.safetyPoints.join("\n"),
        waiver_text: data.waiverText,
        equipment: {
          selected: data.selectedEquipment,
        },
        amenities: data.selectedAmenities,
        specific_fields: data.specificFieldValues,
        custom_details: data.customDetails,
        uscg_doc_number: data.uscgDocNumber || null,
        registration_state: data.registrationState || null,
        onboard_info: {
          equipment: data.selectedEquipment,
          amenities: data.selectedAmenities,
          specificFields: data.specificFieldValues,
          customDetails: data.customDetails,
        },
        is_active: true,
      })
      .select("id")
      .single();

    if (boatError || !boat) {
      console.error("[saveBoatProfile] boats INSERT failed:", boatError);
      return { success: false, error: boatError?.message ?? "Failed to save boat." };
    }

    // 5. INSERT addons
    if (data.addons.length > 0) {
      const addonRows = data.addons.map((addon, i) => ({
        boat_id: boat.id,
        operator_id: operator.id,
        name: addon.name,
        description: addon.description || null,
        emoji: addon.emoji || "🎁",
        price_cents: addon.priceCents,
        max_quantity: addon.maxQuantity || 10,
        sort_order: i,
        is_available: true,
      }));

      const { error: addonsError } = await supabase.from("addons").insert(addonRows);

      if (addonsError) {
        console.error("[saveBoatProfile] addons INSERT failed:", addonsError);
        // Non-fatal — boat was saved, addons can be added later
      }
    }

    // 6. Audit log
    auditLog({
      action: "boat_created",
      operatorId: operator.id,
      entityType: "boat",
      entityId: boat.id,
      changes: {
        boatName: data.boatName,
        boatType: data.boatType,
        charterType: data.charterType,
        addonCount: data.addons.length,
      },
    });

    return { success: true, boatId: boat.id };
  } catch (err: unknown) {
    console.error("[saveBoatProfile] unexpected error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}
