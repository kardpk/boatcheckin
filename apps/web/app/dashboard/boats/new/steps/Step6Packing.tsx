"use client";

import { useState } from "react";
import { ContinueButton } from "@/components/ui/ContinueButton";
import { WizardField } from "@/components/ui/WizardField";
import { Check, X } from "lucide-react";
import type { WizardData } from "../types";

interface Step6Props {
  data: WizardData;
  onNext: (partial: Partial<WizardData>) => void;
}

export function Step6Packing({ data, onNext }: Step6Props) {
  const [whatToBring, setWhatToBring] = useState(data.whatToBring);
  const [whatNotToBring, setWhatNotToBring] = useState(data.whatNotToBring);
  const [showPreview, setShowPreview] = useState(false);

  const bringItems = whatToBring.split("\n").filter(Boolean);
  const notBringItems = whatNotToBring.split("\n").filter(Boolean);

  function handleContinue() {
    onNext({ whatToBring, whatNotToBring });
  }

  return (
    <div className="space-y-section">
      <div className="md:grid md:grid-cols-2 md:gap-page space-y-section md:space-y-0">
        {/* What to bring */}
        <div>
          <WizardField
            label="What guests should bring"
            helper="Enter one item per line. These become a tickable checklist for guests."
            htmlFor="whatToBring"
          >
            <textarea
              id="whatToBring"
              rows={10}
              value={whatToBring}
              onChange={(e) => setWhatToBring(e.target.value)}
              placeholder="Valid ID&#10;Sunscreen&#10;Towel&#10;Non-marking shoes"
              className="w-full min-h-[200px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none font-mono text-[13px]"
            />
          </WizardField>
        </div>

        {/* What NOT to bring */}
        <div>
          <WizardField
            label="What guests should NOT bring"
            helper="Enter one item per line. Shown with ✗ prefix in coral on the trip page."
            htmlFor="whatNotToBring"
          >
            <textarea
              id="whatNotToBring"
              rows={10}
              value={whatNotToBring}
              onChange={(e) => setWhatNotToBring(e.target.value)}
              placeholder="Glass bottles&#10;High heels&#10;Sharp objects"
              className="w-full min-h-[200px] p-standard border border-border rounded-input text-body text-dark-text placeholder:text-grey-text/50 focus:border-border-dark focus:outline-none resize-none font-mono text-[13px]"
            />
          </WizardField>
        </div>
      </div>

      {/* Preview toggle */}
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="text-label text-navy hover:text-mid-blue transition-colors"
      >
        {showPreview ? "Hide preview" : "Show guest preview"}
      </button>

      {showPreview && (
        <div className="border border-border rounded-card p-card bg-off-white">
          <p className="text-[10px] text-grey-text uppercase tracking-wider mb-standard">
            Guest preview
          </p>

          {bringItems.length > 0 && (
            <div className="mb-page">
              <p className="text-label text-dark-text mb-tight">What to bring</p>
              <div className="space-y-tight">
                {bringItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-tight">
                    <div className="w-4 h-4 border border-border rounded flex items-center justify-center">
                      <Check size={10} className="text-grey-text opacity-30" />
                    </div>
                    <span className="text-body text-dark-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notBringItems.length > 0 && (
            <div>
              <p className="text-label text-dark-text mb-tight">Do not bring</p>
              <div className="space-y-tight">
                {notBringItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-tight">
                    <X size={14} className="text-[#E06C5E] shrink-0" />
                    <span className="text-body text-dark-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ContinueButton onClick={handleContinue} />
    </div>
  );
}
