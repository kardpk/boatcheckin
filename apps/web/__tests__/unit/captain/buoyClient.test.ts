import { describe, it, expect, vi, beforeEach } from 'vitest'
import { activateBuoyPolicy, endBuoyPolicy } from '@/lib/buoy/client'

vi.mock('server-only', () => ({}))

describe('activateBuoyPolicy', () => {
  beforeEach(() => {
    vi.stubEnv('BUOY_API_KEY', '')
    vi.stubEnv('BUOY_API_URL', '')
  })

  it('returns stub when no API key configured', async () => {
    const result = await activateBuoyPolicy({
      tripId: 'trip-123',
      operatorId: 'op-456',
      guestCount: 7,
      boatType: 'motor_yacht',
      boatName: "Conrad's Yacht",
      marinaLat: 25.77,
      marinaLng: -80.13,
      tripDate: '2024-10-21',
      durationHours: 4,
    })

    expect(result.policyId).toContain('STUB')
    expect(result.status).toBe('pending')
  })

  it('returns failed gracefully on API error', async () => {
    vi.stubEnv('BUOY_API_KEY', 'test-key')
    vi.stubEnv('BUOY_API_URL', 'https://api.example.com')

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const result = await activateBuoyPolicy({
      tripId: 'trip-123',
      operatorId: 'op-456',
      guestCount: 7,
      boatType: 'motor_yacht',
      boatName: "Test Boat",
      marinaLat: null,
      marinaLng: null,
      tripDate: '2024-10-21',
      durationHours: 4,
    })

    expect(result.status).toBe('failed')
    expect(result.policyId).toContain('FAILED')
  })

  it('normalises vessel type correctly', async () => {
    vi.stubEnv('BUOY_API_KEY', 'test-key')
    vi.stubEnv('BUOY_API_URL', 'https://api.example.com')

    let capturedBody: any
    global.fetch = vi.fn().mockImplementation(async (_, opts) => {
      capturedBody = JSON.parse(opts.body)
      return { ok: true, json: async () => ({
        policy_id: 'POL-123',
        policy_number: 'P-001',
        activated_at: new Date().toISOString(),
        coverage_until: new Date().toISOString(),
      })}
    })

    await activateBuoyPolicy({
      tripId: 'trip-123', operatorId: 'op-456',
      guestCount: 4, boatType: 'fishing_charter',
      boatName: 'Test', marinaLat: 25.77, marinaLng: -80.13,
      tripDate: '2024-10-21', durationHours: 6,
    })

    expect(capturedBody.vessel_type).toBe('fishing_vessel')
  })
})
