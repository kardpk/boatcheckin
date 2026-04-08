"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import {
  INITIAL_WIZARD_DATA,
  STEP_TITLES,
  TOTAL_STEPS,
  type WizardData,
  type BoatTypeKey,
} from "./types";
import type { BoatTemplate } from "@/lib/wizard/boat-template-types";
import { saveBoatProfile } from "./actions";
import { Step1Vessel } from "./steps/Step1Vessel";
import { Step2Marina } from "./steps/Step2Marina";
import { Step3Captain } from "./steps/Step3Captain";
import { Step4Equipment } from "./steps/Step4Equipment";
import { Step5Rules } from "./steps/Step5Rules";
import { Step6Packing } from "./steps/Step6Packing";
import { Step7Safety } from "./steps/Step7Safety";
import { Step8Photos } from "./steps/Step8Photos";
import { StepComplete } from "./steps/StepComplete";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
  }),
};

export function BoatWizard() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [template, setTemplate] = useState<BoatTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);

  const goNext = useCallback(async (newData: Partial<WizardData>) => {
    const merged = { ...data, ...newData };
    setData(merged);

    if (step === TOTAL_STEPS) {
      // Save to Supabase via server action
      setSaving(true);
      setSaveError(null);
      try {
        const result = await saveBoatProfile({
          boatName: merged.boatName,
          boatType: merged.boatType as string,
          charterType: merged.charterType as string,
          yearBuilt: merged.yearBuilt,
          lengthFt: merged.lengthFt,
          maxCapacity: merged.maxCapacity,
          uscgDocNumber: merged.uscgDocNumber,
          registrationState: merged.registrationState,
          marinaName: merged.marinaName,
          marinaAddress: merged.marinaAddress,
          slipNumber: merged.slipNumber,
          parkingInstructions: merged.parkingInstructions,
          operatingArea: merged.operatingArea,
          lat: merged.lat,
          lng: merged.lng,
          captainName: merged.captainName,
          captainBio: merged.captainBio,
          captainLicense: merged.captainLicense,
          captainLicenseType: merged.captainLicenseType,
          captainLanguages: merged.captainLanguages,
          captainYearsExp: merged.captainYearsExp,
          captainTripCount: merged.captainTripCount,
          captainRating: merged.captainRating,
          captainCertifications: merged.captainCertifications,
          selectedEquipment: merged.selectedEquipment,
          selectedAmenities: merged.selectedAmenities,
          specificFieldValues: merged.specificFieldValues,
          customDetails: merged.customDetails,
          standardRules: merged.standardRules,
          customDos: merged.customDos,
          customDonts: merged.customDonts,
          customRuleSections: merged.customRuleSections,
          whatToBring: merged.whatToBring,
          whatNotToBring: merged.whatNotToBring,
          waiverText: merged.waiverText,
          safetyPoints: merged.safetyPoints,
          addons: merged.addons,
        });

        if (result.success) {
          setCompleted(true);
        } else {
          setSaveError(result.error ?? "Failed to save. Please try again.");
        }
      } catch {
        setSaveError("An unexpected error occurred. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      setDirection(1);
      setStep((prev) => prev + 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, data]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * When boat type is selected in Step 1,
   * fetch template from API and merge defaults into wizard data.
   */
  const handleBoatTypeSelected = useCallback(async (type: BoatTypeKey) => {
    setTemplateLoading(true);
    setData((prev) => ({ ...prev, boatType: type }));

    try {
      const res = await fetch(`/api/dashboard/wizard/template/${type}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      const { template: tmpl, defaults } = await res.json();
      setTemplate(tmpl);
      setData((prev) => ({
        ...prev,
        boatType: type,
        ...defaults,
      }));
    } catch (err) {
      console.error("[BoatWizard] template fetch failed:", err);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const progress = completed ? 100 : ((step - 1) / TOTAL_STEPS) * 100;

  if (completed) {
    return <StepComplete boatName={data.boatName || "Your boat"} />;
  }

  return (
    <div className="min-h-screen bg-white md:bg-off-white">
      {/* Progress bar */}
      <div className="w-full h-[4px] bg-border">
        <div
          className="h-full bg-navy transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-page py-card max-w-[640px] mx-auto">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-micro text-label text-grey-text hover:text-dark-text transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <div />
          )}
          <span className="text-micro text-grey-text">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        <h2 className="text-h2 text-navy mt-tight">
          {STEP_TITLES[step]}
        </h2>
      </div>

      {/* Save error */}
        {saveError && (
          <div className="max-w-[640px] mx-auto px-page mb-standard">
            <div className="p-standard bg-error-bg rounded-chip text-[13px] text-error-text">
              ⚠️ {saveError}
            </div>
          </div>
        )}

      {/* Step content */}
      <div className="max-w-[640px] mx-auto px-page pb-hero overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {step === 1 && (
              <Step1Vessel
                data={data}
                onNext={goNext}
                onBoatTypeSelected={handleBoatTypeSelected}
                templateLoading={templateLoading}
              />
            )}
            {step === 2 && <Step2Marina data={data} onNext={goNext} template={template} />}
            {step === 3 && <Step3Captain data={data} onNext={goNext} />}
            {step === 4 && <Step4Equipment data={data} onNext={goNext} template={template} />}
            {step === 5 && <Step5Rules data={data} onNext={goNext} />}
            {step === 6 && <Step6Packing data={data} onNext={goNext} />}
            {step === 7 && <Step7Safety data={data} onNext={goNext} />}
            {step === 8 && <Step8Photos data={data} onNext={goNext} saving={saving} template={template} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
