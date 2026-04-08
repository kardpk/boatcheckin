/**
 * Shared types for the boat template system.
 *
 * These types are safe to import in BOTH client and server components.
 * The actual template DATA lives in `lib/wizard/boat-templates.ts` (server-only).
 */

export interface BoatTemplate {
  label: string;
  emoji: string;
  description: string;
  standardEquipment: string[];
  optionalEquipment: string[];
  amenityGroups: {
    title: string;
    items: { key: string; label: string; default: boolean }[];
  }[];
  specificFields: {
    key: string;
    label: string;
    type: "text" | "number" | "select" | "multiselect" | "boolean";
    required?: boolean;
    placeholder?: string;
    helpText?: string;
    options?: { value: string; label: string }[];
  }[];
  standardRules: string[];
  standardDos: string[];
  standardDonts: string[];
  whatToBring: string[];
  whatNotToBring: string[];
  safetyPoints: string[];
  waiverTemplate: string;
  suggestedAddons: {
    name: string;
    description: string;
    emoji: string;
    suggestedPrice: number;
  }[];
}
