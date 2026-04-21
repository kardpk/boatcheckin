'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react'

interface IntegrationRow {
  id: string
  platform: string
  boatNameMap: Record<string, string>
  autoCreateTrips: boolean
  autoSendLink: boolean
  linkDelayHours: number
  isActive: boolean
  lastEventAt: string | null
  createdAt: string
  webhookUrl: string
}

interface Boat {
  id: string
  boat_name: string
}

interface IntegrationSettingsClientProps {
  integrations: IntegrationRow[]
  boats: Boat[]
}

const PLATFORM_LABELS: Record<string, string> = {
  fareharbor: 'FareHarbor',
  rezdy:      'Rezdy',
  bookeo:     'Bookeo',
  checkfront: 'Checkfront',
  manual:     'Manual',
}

const SUPPORTED_PLATFORMS = ['fareharbor', 'rezdy', 'bookeo'] as const

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => null)
  }, [value])

  return (
    <button
      onClick={handleCopy}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           4,
        padding:       '4px 10px',
        background:    'var(--color-bg)',
        border:        '1px solid var(--color-line-soft)',
        borderRadius:  'var(--r-1)',
        cursor:        'pointer',
        fontSize:      12,
        color:         copied ? 'var(--color-teal)' : 'var(--color-ink-muted)',
        fontFamily:    'var(--font-mono)',
        letterSpacing: '0.06em',
        flexShrink:    0,
      }}
      aria-label={label}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'COPIED' : 'COPY'}
    </button>
  )
}

function IntegrationCard({
  integration,
  boats,
  onUpdate,
}: {
  integration: IntegrationRow
  boats: Boat[]
  onUpdate: (id: string, updates: Partial<IntegrationRow>) => Promise<void>
}) {
  const [expanded, setExpanded]     = useState(false)
  const [nameMap, setNameMap]       = useState(integration.boatNameMap)
  const [newFhName, setNewFhName]   = useState('')
  const [newBoatId, setNewBoatId]   = useState('')
  const [autoCreate, setAutoCreate] = useState(integration.autoCreateTrips)
  const [autoSend, setAutoSend]     = useState(integration.autoSendLink)
  const [delayHours, setDelayHours] = useState(integration.linkDelayHours)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await onUpdate(integration.id, {
        boatNameMap:     nameMap,
        autoCreateTrips: autoCreate,
        autoSendLink:    autoSend,
        linkDelayHours:  delayHours,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [integration.id, nameMap, autoCreate, autoSend, delayHours, onUpdate])

  const addMapping = () => {
    if (!newFhName.trim() || !newBoatId) return
    setNameMap(prev => ({ ...prev, [newFhName.trim()]: newBoatId }))
    setNewFhName('')
    setNewBoatId('')
  }

  const removeMapping = (key: string) => {
    setNameMap(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const lastEvent = integration.lastEventAt
    ? new Date(integration.lastEventAt).toLocaleString()
    : 'Never'

  return (
    <div
      className="tile"
      style={{ overflow: 'hidden', padding: 0 }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          gap:            12,
          padding:        '14px 16px',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          textAlign:      'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-ink)' }}>
            {PLATFORM_LABELS[integration.platform] ?? integration.platform}
          </p>
          <p className="font-mono" style={{
            margin: '2px 0 0', fontSize: 'var(--t-mono-xs)',
            color: 'var(--color-ink-muted)', letterSpacing: '0.04em',
          }}>
            Last event: {lastEvent}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 6px',
          borderRadius: 'var(--r-1)', letterSpacing: '0.1em',
          background: integration.isActive ? '#ECFDF5' : '#F3F4F6',
          color: integration.isActive ? '#059669' : '#6B7C93',
        }}>
          {integration.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Expanded config */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--color-line-soft)', padding: '16px' }}>

          {/* Webhook URL */}
          <section style={{ marginBottom: 20 }}>
            <p className="font-mono" style={{
              fontSize: 'var(--t-mono-xs)', fontWeight: 700,
              letterSpacing: '0.1em', color: 'var(--color-ink-muted)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Step 1 — Webhook URL
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 10 }}>
              Paste this URL into {PLATFORM_LABELS[integration.platform]} under Settings → Webhooks.
            </p>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'var(--color-bg)', borderRadius: 'var(--r-1)',
              border: '1px solid var(--color-line-soft)', padding: '8px 12px',
            }}>
              <code style={{
                flex: 1, fontSize: 11, color: 'var(--color-ink)',
                wordBreak: 'break-all', fontFamily: 'var(--font-mono)',
              }}>
                {integration.webhookUrl}
              </code>
              <CopyButton value={integration.webhookUrl} label="Copy webhook URL" />
            </div>
          </section>

          {/* Boat name mapping */}
          <section style={{ marginBottom: 20 }}>
            <p className="font-mono" style={{
              fontSize: 'var(--t-mono-xs)', fontWeight: 700,
              letterSpacing: '0.1em', color: 'var(--color-ink-muted)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Step 2 — Map Boat Names
            </p>
            <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 12 }}>
              Map the experience name from {PLATFORM_LABELS[integration.platform]} to your DockPass boat.
            </p>

            {/* Existing mappings */}
            {Object.entries(nameMap).map(([fhName, boatId]) => {
              const boat = boats.find(b => b.id === boatId)
              return (
                <div key={fhName} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6, fontSize: 13,
                }}>
                  <span style={{ flex: 1, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    &ldquo;{fhName}&rdquo;
                  </span>
                  <span style={{ color: 'var(--color-ink-muted)' }}>→</span>
                  <span style={{ flex: 1, color: 'var(--color-ink)', fontWeight: 600, fontSize: 13 }}>
                    {boat?.boat_name ?? <em style={{ color: 'var(--color-ink-muted)' }}>Unknown boat</em>}
                  </span>
                  <button
                    onClick={() => removeMapping(fhName)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#DC2626', padding: 4,
                    }}
                    aria-label={`Remove mapping for ${fhName}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}

            {/* Add new mapping */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newFhName}
                onChange={e => setNewFhName(e.target.value)}
                placeholder={`${PLATFORM_LABELS[integration.platform]} name...`}
                style={{
                  flex: 1, padding: '7px 10px', fontSize: 13,
                  border: '1px solid var(--color-line-soft)', borderRadius: 'var(--r-1)',
                  background: 'var(--color-paper)', color: 'var(--color-ink)',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <select
                value={newBoatId}
                onChange={e => setNewBoatId(e.target.value)}
                style={{
                  flex: 1, padding: '7px 10px', fontSize: 13,
                  border: '1px solid var(--color-line-soft)', borderRadius: 'var(--r-1)',
                  background: 'var(--color-paper)', color: 'var(--color-ink)',
                }}
              >
                <option value="">Select boat</option>
                {boats.map(b => (
                  <option key={b.id} value={b.id}>{b.boat_name}</option>
                ))}
              </select>
              <button
                onClick={addMapping}
                disabled={!newFhName.trim() || !newBoatId}
                style={{
                  padding: '7px 12px',
                  background: 'var(--color-rust)', color: 'var(--color-bone)',
                  border: 'none', borderRadius: 'var(--r-1)', cursor: 'pointer',
                  opacity: (!newFhName.trim() || !newBoatId) ? 0.5 : 1,
                }}
                aria-label="Add mapping"
              >
                <Plus size={15} />
              </button>
            </div>
          </section>

          {/* Send settings */}
          <section style={{ marginBottom: 20 }}>
            <p className="font-mono" style={{
              fontSize: 'var(--t-mono-xs)', fontWeight: 700,
              letterSpacing: '0.1em', color: 'var(--color-ink-muted)',
              textTransform: 'uppercase', marginBottom: 12,
            }}>
              Step 3 — Send Settings
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoCreate}
                onChange={e => setAutoCreate(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-teal)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>
                Auto-create trip on confirmed booking
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoSend}
                onChange={e => setAutoSend(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-teal)' }}
              />
              <span style={{ fontSize: 14, color: 'var(--color-ink)' }}>
                Auto-send DockPass link to booker
              </span>
            </label>

            {autoSend && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--color-ink-muted)', whiteSpace: 'nowrap' }}>
                  Delay sending link by
                </span>
                <input
                  type="number"
                  min={0}
                  max={72}
                  value={delayHours}
                  onChange={e => setDelayHours(Number(e.target.value))}
                  style={{
                    width: 60, padding: '5px 8px', fontSize: 13,
                    border: '1px solid var(--color-line-soft)', borderRadius: 'var(--r-1)',
                    textAlign: 'center', background: 'var(--color-paper)', color: 'var(--color-ink)',
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>hours</span>
              </label>
            )}
          </section>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn--rust"
            style={{ width: '100%', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save changes'}
          </button>
        </div>
      )}
    </div>
  )
}

export function IntegrationSettingsClient({ integrations, boats }: IntegrationSettingsClientProps) {
  const [integrationList, setIntegrationList] = useState(integrations)
  const [creating, setCreating]               = useState<string | null>(null)
  const [secretShown, setSecretShown]         = useState<{ url: string; secret: string } | null>(null)

  const handleConnect = useCallback(async (platform: string) => {
    setCreating(platform)
    try {
      const res  = await fetch('/api/dashboard/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      })
      const json = await res.json() as { data?: { id: string; webhookUrl: string; webhookSecret: string; platform: string } }
      if (json.data) {
        setSecretShown({ url: json.data.webhookUrl, secret: json.data.webhookSecret })
        setIntegrationList(prev => [
          {
            id:              json.data!.id,
            platform:        json.data!.platform,
            boatNameMap:     {},
            autoCreateTrips: true,
            autoSendLink:    true,
            linkDelayHours:  0,
            isActive:        true,
            lastEventAt:     null,
            createdAt:       new Date().toISOString(),
            webhookUrl:      json.data!.webhookUrl,
          },
          ...prev,
        ])
      }
    } finally {
      setCreating(null)
    }
  }, [])

  const handleUpdate = useCallback(async (id: string, updates: Partial<IntegrationRow>) => {
    await fetch(`/api/dashboard/integrations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boatNameMap:     updates.boatNameMap,
        autoCreateTrips: updates.autoCreateTrips,
        autoSendLink:    updates.autoSendLink,
        linkDelayHours:  updates.linkDelayHours,
      }),
    })
  }, [])

  const connectedPlatforms = new Set(integrationList.filter(i => i.isActive).map(i => i.platform))

  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
          Booking Integrations
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginTop: 4 }}>
          Connect FareHarbor or other booking platforms to auto-create trips.
        </p>
      </div>

      {/* One-time secret display */}
      {secretShown && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #D97706',
          borderRadius: 'var(--r-2)', padding: '16px',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#7A5C0A' }}>
            Save your webhook secret — shown only once
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <code style={{
              flex: 1, fontSize: 11, background: '#FEF9EC',
              padding: '6px 10px', borderRadius: 4,
              fontFamily: 'var(--font-mono)', wordBreak: 'break-all',
              color: '#7A5C0A',
            }}>
              {secretShown.secret}
            </code>
            <CopyButton value={secretShown.secret} label="Copy secret" />
          </div>
          <button
            onClick={() => setSecretShown(null)}
            style={{
              fontSize: 12, color: '#7A5C0A', background: 'none', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            I have saved it — dismiss
          </button>
        </div>
      )}

      {/* Existing integrations */}
      {integrationList.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {integrationList.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              boats={boats}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}

      {/* Connect new platform */}
      <div>
        <p className="font-mono" style={{
          fontSize: 'var(--t-mono-xs)', fontWeight: 700,
          letterSpacing: '0.1em', color: 'var(--color-ink-muted)',
          textTransform: 'uppercase', marginBottom: 12,
        }}>
          Available platforms
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          {SUPPORTED_PLATFORMS.map(platform => {
            const isConnected = connectedPlatforms.has(platform)
            return (
              <div
                key={platform}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            12,
                  padding:        '12px 14px',
                  background:     'var(--color-paper)',
                  border:         '1px solid var(--color-line-soft)',
                  borderRadius:   'var(--r-1)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
                    {PLATFORM_LABELS[platform]}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-ink-muted)' }}>
                    {platform === 'fareharbor' ? 'Most common charter booking platform' :
                     platform === 'rezdy'      ? 'Popular tours & activities platform' :
                     'Group booking platform'}
                  </p>
                </div>
                {isConnected ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 'var(--r-1)', background: '#ECFDF5',
                    color: '#059669', letterSpacing: '0.08em',
                  }}>
                    CONNECTED
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(platform)}
                    disabled={creating === platform}
                    className="btn btn--rust"
                    style={{ fontSize: 13, padding: '7px 16px', opacity: creating === platform ? 0.7 : 1 }}
                  >
                    {creating === platform ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
