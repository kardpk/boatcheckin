'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHANNELS, type RealtimeStatus } from '@/types'
import type { DashboardGuest } from '@/types'

interface UseTripGuestsResult {
  guests: DashboardGuest[]
  connectionStatus: RealtimeStatus
  lastUpdated: Date | null
}

export function useTripGuests(
  tripId: string,
  initialGuests: DashboardGuest[]
): UseTripGuestsResult {
  const [guests, setGuests] = useState<DashboardGuest[]>(initialGuests)
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeStatus>('connecting')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(CHANNELS.tripGuests(tripId))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const g = payload.new as Record<string, unknown>
          setGuests(prev => {
            if (prev.some(x => x.id === g.id)) return prev
            return [...prev, mapRawGuest(g)]
          })
          setLastUpdated(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const g = payload.new as Record<string, unknown>
          setGuests(prev =>
            prev.map(x =>
              x.id === g.id
                ? {
                    ...x,
                    waiverSigned: (g.waiver_signed as boolean) ?? x.waiverSigned,
                    approvalStatus: (g.approval_status as string) ?? x.approvalStatus,
                    checkedInAt: (g.checked_in_at as string) ?? x.checkedInAt,
                  }
                : x
            )
          )
          setLastUpdated(new Date())
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'guests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const old = payload.old as Record<string, unknown>
          setGuests(prev =>
            prev.filter(x => x.id !== old.id)
          )
          setLastUpdated(new Date())
        }
      )
      .subscribe((state) => {
        if (state === 'SUBSCRIBED') setConnectionStatus('connected')
        else if (state === 'CLOSED') setConnectionStatus('disconnected')
        else if (state === 'CHANNEL_ERROR') setConnectionStatus('error')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId])

  return { guests, connectionStatus, lastUpdated }
}

function mapRawGuest(raw: Record<string, unknown>): DashboardGuest {
  return {
    id: raw.id as string,
    fullName: raw.full_name as string,
    languagePreference: (raw.language_preference as string) ?? 'en',
    dietaryRequirements: (raw.dietary_requirements as string) ?? null,
    isNonSwimmer: (raw.is_non_swimmer as boolean) ?? false,
    isSeaSicknessProne: (raw.is_seasickness_prone as boolean) ?? false,
    waiverSigned: (raw.waiver_signed as boolean) ?? false,
    waiverSignedAt: (raw.waiver_signed_at as string) ?? null,
    approvalStatus: (raw.approval_status as string) ?? 'auto_approved',
    checkedInAt: (raw.checked_in_at as string) ?? null,
    createdAt: raw.created_at as string,
    addonOrders: [],
  }
}
