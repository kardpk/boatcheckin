'use client'

import { useState } from 'react'
import { provisionOperatorFirmaWorkspace } from '@/app/actions/operatorFirma'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'

interface WaiverSettingsClientProps {
  operatorId: string
  companyName: string
  workspaceId: string | null
  jwtToken: string | null
}

export function WaiverSettingsClient({
  operatorId,
  companyName,
  workspaceId,
  jwtToken
}: WaiverSettingsClientProps) {
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState('')

  const handleInitialize = async () => {
    setIsProvisioning(true)
    setError('')
    try {
      const res = await provisionOperatorFirmaWorkspace(operatorId, companyName)
      if (res.success) {
        // Soft refresh the page to get the JWT from the server, 
        // or just set state if our action returned a JWT. 
        // Our action only returns workspaceId right now, let's just trigger a reload to let the server pass down the JWT.
        window.location.reload()
      } else {
        setError(res.error || 'Setup failed')
        setIsProvisioning(false)
      }
    } catch {
      setError('An unexpected error occurred.')
      setIsProvisioning(false)
    }
  }

  if (!workspaceId) {
    return (
      <div className="
        border border-[#D0E2F3] bg-white rounded-[16px]
        p-8 text-center flex flex-col items-center
      ">
        <div className="w-16 h-16 bg-[#E8F2FB] rounded-full flex items-center justify-center mb-4">
          <span className="text-[24px]">🖋️</span>
        </div>
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
          Initialize E-Signatures
        </h2>
        <p className="text-[14px] text-[#6B7C93] mb-6 max-w-[400px]">
          We use Firma.dev to provide legal liability protection securely. 
          Initialize your workspace to upload custom boat waivers and PDF forms.
        </p>

        {error && (
          <div className="mb-4 text-[#E8593C] text-[14px] bg-[#FDEAEA] px-4 py-2 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleInitialize}
          disabled={isProvisioning}
          className={cn(
            'h-[48px] px-8 rounded-[12px] font-semibold text-[15px]',
            'bg-[#0C447C] text-white transition-all',
            'hover:bg-[#093a6b] active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {isProvisioning ? <AnchorLoader size="sm" color="white" /> : 'Activate Digital Waivers'}
        </button>
      </div>
    )
  }

  // Loaded state
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between p-4 bg-[#E8F9F4] border border-[#1D9E75] border-opacity-30 rounded-[12px]">
        <div className="flex items-center gap-3">
          <span className="text-[20px]">✅</span>
          <div>
            <p className="text-[14px] font-semibold text-[#1D9E75]">Workspace Active</p>
            <p className="text-[12px] text-[#2c775d]">ID: {workspaceId}</p>
          </div>
        </div>
      </div>

      {jwtToken ? (
        <div className="w-full h-[700px] border border-[#D0E2F3] rounded-[16px] bg-white overflow-hidden shadow-sm">
          {/* Firma Embedded Template Editor Frame */}
          <iframe 
            src={`https://app.firma.dev/embed/templates?jwt=${jwtToken}&theme=light&brandColor=0C447C`}
            width="100%" 
            height="100%" 
            frameBorder="0"
            allow="fullscreen"
            title="Embedded Document Editor"
          />
        </div>
      ) : (
        <div className="p-8 text-center text-[#6B7C93] bg-white border border-[#D0E2F3] rounded-[16px]">
          Failed to load authentication token for the editor.
        </div>
      )}
    </div>
  )
}
