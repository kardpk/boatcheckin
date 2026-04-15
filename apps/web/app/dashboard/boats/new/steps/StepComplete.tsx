"use client";

import { useRouter } from "next/navigation";
import { Anchor } from "lucide-react";

interface StepCompleteProps {
  boatName: string;
}

export function StepComplete({ boatName }: StepCompleteProps) {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-navy -mx-page -mt-card px-page">
      <div className="max-w-[440px] w-full text-center">
        {/* Hero */}
        <Anchor size={48} className="text-white mx-auto mb-standard" strokeWidth={1.5} />
        <h1 className="text-[28px] font-bold text-white">
          Your boat is ready!
        </h1>
        <p className="text-[16px] text-white/70 mt-tight">{boatName}</p>

        {/* Next steps card */}
        <div className="mt-section bg-white rounded-card p-card text-left">
          <p className="text-label text-dark-text mb-standard">What happens next:</p>

          <div className="space-y-page">
            <div className="flex items-start gap-tight">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-light-blue text-navy text-[12px] font-bold shrink-0">
                1
              </span>
              <div>
                <p className="text-label text-dark-text">Create your first trip</p>
                <p className="text-caption text-grey-text">Takes 30 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-tight">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-light-blue text-navy text-[12px] font-bold shrink-0">
                2
              </span>
              <div>
                <p className="text-label text-dark-text">Copy the trip link</p>
                <p className="text-caption text-grey-text">One WhatsApp message to guests</p>
              </div>
            </div>

            <div className="flex items-start gap-tight">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-light-blue text-navy text-[12px] font-bold shrink-0">
                3
              </span>
              <div>
                <p className="text-label text-dark-text">Guests check in</p>
                <p className="text-caption text-grey-text">Waivers signed before they arrive</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard/trips/new")}
            className="w-full h-[52px] mt-section bg-navy text-white font-medium rounded-btn hover:bg-mid-blue transition-colors"
          >
            Create my first trip →
          </button>
        </div>
      </div>
    </div>
  );
}
