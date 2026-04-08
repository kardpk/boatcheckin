export type BoatTypeKey =
  | "motor_yacht"
  | "fishing_charter"
  | "catamaran"
  | "pontoon"
  | "snorkel_dive"
  | "sailing_yacht"
  | "speedboat"
  | "sunset_cruise"
  | "other";

export type CharterType = "captained" | "bareboat" | "both";

export interface SpecificFieldOption {
  value: string;
  label: string;
}

export interface SpecificField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect" | "boolean";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: SpecificFieldOption[];
}

export interface WizardAddon {
  id: string;
  name: string;
  description: string;
  emoji: string;
  priceCents: number;
  maxQuantity: number;
}

export interface CustomRuleSection {
  id: string;
  title: string;
  items: string[];
  type: "bullet" | "numbered" | "check";
}

export interface WizardData {
  // Step 1 — Vessel basics
  boatName: string;
  boatType: BoatTypeKey | "";
  charterType: CharterType | "";
  yearBuilt: string;
  lengthFt: string;
  maxCapacity: string;
  uscgDocNumber: string;
  registrationState: string;

  // Step 2 — Marina
  marinaName: string;
  marinaAddress: string;
  slipNumber: string;
  parkingInstructions: string;
  operatingArea: string;
  lat: number | null;
  lng: number | null;

  // Step 3 — Captain
  captainName: string;
  captainPhotoFile: File | null;
  captainPhotoPreview: string;
  captainBio: string;
  captainLicense: string;
  captainLicenseType: string;
  captainLanguages: string[];
  captainYearsExp: string;
  captainTripCount: string;
  captainRating: string;
  captainCertifications: string[];

  // Step 4 — Equipment & amenities
  selectedEquipment: string[];
  selectedAmenities: Record<string, boolean>;
  specificFieldValues: Record<string, string | boolean | string[]>;
  customDetails: { label: string; value: string }[];

  // Step 5 — Rules
  standardRules: string[];
  customDos: string[];
  customDonts: string[];
  customRuleSections: CustomRuleSection[];

  // Step 6 — Packing guide
  whatToBring: string;
  whatNotToBring: string;

  // Step 7 — Safety & waiver
  waiverText: string;
  safetyPoints: string[];

  // Step 8 — Photos + add-ons
  boatPhotos: File[];
  boatPhotosPreviews: string[];
  addons: WizardAddon[];
}

export const INITIAL_WIZARD_DATA: WizardData = {
  boatName: "",
  boatType: "",
  charterType: "",
  yearBuilt: "",
  lengthFt: "",
  maxCapacity: "",
  uscgDocNumber: "",
  registrationState: "",
  marinaName: "",
  marinaAddress: "",
  slipNumber: "",
  parkingInstructions: "",
  operatingArea: "",
  lat: null,
  lng: null,
  captainName: "",
  captainPhotoFile: null,
  captainPhotoPreview: "",
  captainBio: "",
  captainLicense: "",
  captainLicenseType: "",
  captainLanguages: ["en"],
  captainYearsExp: "",
  captainTripCount: "",
  captainRating: "",
  captainCertifications: [],
  selectedEquipment: [],
  selectedAmenities: {},
  specificFieldValues: {},
  customDetails: [],
  standardRules: [],
  customDos: [],
  customDonts: [],
  customRuleSections: [],
  whatToBring: "",
  whatNotToBring: "",
  waiverText: "",
  safetyPoints: [],
  boatPhotos: [],
  boatPhotosPreviews: [],
  addons: [],
};

export const STEP_TITLES: Record<number, string> = {
  1: "Vessel basics",
  2: "Marina & dock",
  3: "Captain",
  4: "Equipment",
  5: "Rules & conduct",
  6: "Packing guide",
  7: "Safety & waiver",
  8: "Photos & add-ons",
};

export const TOTAL_STEPS = 8;
