import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { PropertyCodesClient } from '@/components/dashboard/PropertyCodesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Property Codes — BoatCheckin' }

export default async function PropertyCodesPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const [{ data: codes }, { data: boats }] = await Promise.all([
    supabase
      .from('property_codes')
      .select('id, code, description, discount_type, discount_value, applicable_categories, valid_from, valid_until, max_uses, use_count, boat_id, is_active, created_at')
      .eq('operator_id', operator.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('boats')
      .select('id, boat_name')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('boat_name'),
  ])

  return (
    <PropertyCodesClient
      operatorId={operator.id}
      codes={codes ?? []}
      boats={boats ?? []}
    />
  )
}
