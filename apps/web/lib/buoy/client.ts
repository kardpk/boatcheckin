import 'server-only'

export interface BuoyActivationParams {
  tripId: string
  operatorId: string
  guestCount: number
  boatType: string
  boatName: string
  marinaLat: number | null
  marinaLng: number | null
  tripDate: string
  durationHours: number
}

export interface BuoyPolicyResult {
  policyId: string
  policyNumber: string
  status: 'active' | 'pending' | 'failed'
  activatedAt: string
  coverageUntil: string
  premium?: number
}

export interface BuoyEndParams {
  policyId: string
  tripId: string
  endedAt: string
  actualDurationHours: number
}

// ── Activate per-trip policy ─────────────
export async function activateBuoyPolicy(
  params: BuoyActivationParams
): Promise<BuoyPolicyResult> {
  const apiKey = process.env.BUOY_API_KEY
  const apiUrl = process.env.BUOY_API_URL

  // Graceful stub when API not yet approved
  if (!apiKey || !apiUrl) {
    console.warn('[buoy] BUOY_API_KEY not set — using stub policy')
    return {
      policyId: `STUB-${params.tripId.slice(0, 8).toUpperCase()}`,
      policyNumber: `STUB-PENDING-APPROVAL`,
      status: 'pending',
      activatedAt: new Date().toISOString(),
      coverageUntil: new Date(
        Date.now() + params.durationHours * 3600000
      ).toISOString(),
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`${apiUrl}/v1/policies/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Request-ID': params.tripId,
      },
      body: JSON.stringify({
        external_reference: params.tripId,
        operator_reference: params.operatorId,
        passengers: params.guestCount,
        vessel_type: normaliseVesselType(params.boatType),
        vessel_name: params.boatName,
        location: params.marinaLat && params.marinaLng
          ? { lat: params.marinaLat, lng: params.marinaLng }
          : undefined,
        coverage_start: params.tripDate,
        duration_hours: params.durationHours,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[buoy] activation failed:', res.status, err)
      throw new Error(`Buoy API error: ${res.status}`)
    }

    const data = await res.json()
    return {
      policyId: data.policy_id,
      policyNumber: data.policy_number,
      status: 'active',
      activatedAt: data.activated_at ?? new Date().toISOString(),
      coverageUntil: data.coverage_until,
      premium: data.premium_cents,
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[buoy] request timed out')
    } else {
      console.error('[buoy] activation error:', err.message)
    }
    // Fail gracefully — trip still starts, insurance
    // activation logged as failed for manual follow-up
    return {
      policyId: `FAILED-${params.tripId.slice(0, 8)}`,
      policyNumber: 'ACTIVATION-FAILED',
      status: 'failed',
      activatedAt: new Date().toISOString(),
      coverageUntil: '',
    }
  } finally {
    clearTimeout(timeout)
  }
}

// ── End / deactivate policy ──────────────
export async function endBuoyPolicy(
  params: BuoyEndParams
): Promise<void> {
  const apiKey = process.env.BUOY_API_KEY
  const apiUrl = process.env.BUOY_API_URL

  if (!apiKey || !apiUrl) return // stub — silent

  if (params.policyId.startsWith('STUB-') ||
      params.policyId.startsWith('FAILED-')) {
    return // not a real policy
  }

  try {
    await fetch(`${apiUrl}/v1/policies/${params.policyId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip_reference: params.tripId,
        ended_at: params.endedAt,
        actual_duration_hours: params.actualDurationHours,
      }),
    })
  } catch (err) {
    console.error('[buoy] end policy error:', err)
    // Non-critical — log for manual follow-up
  }
}

// Normalise boat type to Buoy API format
function normaliseVesselType(type: string): string {
  const map: Record<string, string> = {
    motor_yacht: 'motor_vessel',
    sailing_yacht: 'sailing_vessel',
    catamaran: 'catamaran',
    fishing_charter: 'fishing_vessel',
    pontoon: 'pontoon_boat',
    speedboat: 'motorboat',
    snorkel_dive: 'dive_vessel',
    sunset_cruise: 'excursion_vessel',
    other: 'other',
  }
  return map[type] ?? 'other'
}
