import { requireOperator } from '@/lib/security/auth'
import { generateTemplateEditorJwt } from '@/app/actions/operatorFirma'
import { WaiverSettingsClient } from './WaiverSettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Waiver Settings — BoatCheckin' }

export default async function WaiversPage() {
  const { operator } = await requireOperator()

  let jwt = null
  if (operator.firma_workspace_id) {
    const res = await generateTemplateEditorJwt(operator.id)
    if (res.success) {
      jwt = res.token
    }
  }

  return (
    <div className="px-page py-[16px] space-y-[14px]">
      <h1 className="text-[22px] font-bold text-navy mb-[4px]">
        Digital Liability Waivers
      </h1>
      <p className="text-[14px] text-text-mid mb-[16px]">
        Manage your default waiver template and specific boat waivers. Guests will automatically sign this during the join flow.
      </p>

      <WaiverSettingsClient
        operatorId={operator.id}
        companyName={operator.company_name || operator.full_name || 'BoatCheckin Partner'}
        workspaceId={operator.firma_workspace_id}
        jwtToken={jwt}
      />
    </div>
  )
}
