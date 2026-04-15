import { requireAdmin } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { Users, Ship, Navigation, UserCheck, Shield, Globe } from 'lucide-react'

async function getStats() {
  const supabase = createServiceClient()
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [operators, boats, tripsWeek, tripsMonth, tripsAll, guestsToday, guestsWeek, dictTopics, dictAudio, dictImages] = await Promise.all([
    supabase.from('operators').select('subscription_status, admin_role', { count: 'exact' }),
    supabase.from('boats').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('trips').select('id', { count: 'exact', head: true }).gte('trip_date', startOfWeek.toISOString().split('T')[0]),
    supabase.from('trips').select('id', { count: 'exact', head: true }).gte('trip_date', startOfMonth.toISOString().split('T')[0]),
    supabase.from('trips').select('id', { count: 'exact', head: true }),
    supabase.from('guests').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('guests').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
    supabase.from('global_safety_dictionary').select('topic_key, language_code'),
    supabase.from('global_safety_dictionary').select('topic_key').not('audio_url', 'is', null),
    supabase.from('global_safety_dictionary').select('topic_key').not('default_image_url', 'is', null),
  ])

  const opData = operators.data ?? []
  const totalOps = opData.length
  const trialOps = opData.filter(o => o.subscription_status === 'trial').length
  const activeOps = opData.filter(o => o.subscription_status === 'active').length

  const dictData = dictTopics.data ?? []
  const uniqueTopics = new Set(dictData.map(d => d.topic_key)).size
  const uniqueLangs = new Set(dictData.map(d => d.language_code)).size

  return {
    operators: { total: totalOps, trial: trialOps, active: activeOps },
    boats: boats.count ?? 0,
    trips: { week: tripsWeek.count ?? 0, month: tripsMonth.count ?? 0, all: tripsAll.count ?? 0 },
    guests: { today: guestsToday.count ?? 0, week: guestsWeek.count ?? 0 },
    dictionary: {
      topics: uniqueTopics,
      languages: uniqueLangs,
      totalRows: dictData.length,
      withAudio: dictAudio.data?.length ?? 0,
      withImage: dictImages.data?.length ?? 0,
    },
  }
}

async function getRecentSignups() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('operators')
    .select('id, full_name, email, subscription_tier, subscription_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

export default async function AdminPulsePage() {
  await requireAdmin('member')
  const [stats, recentSignups] = await Promise.all([getStats(), getRecentSignups()])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] font-bold text-navy">Platform Pulse</h2>
        <p className="text-[14px] text-text-mid">Live overview of BoatCheckin</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Operators" value={stats.operators.total} sub={`${stats.operators.trial} trial · ${stats.operators.active} active`} />
        <KpiCard icon={Ship} label="Active Boats" value={stats.boats} />
        <KpiCard icon={Navigation} label="Trips This Week" value={stats.trips.week} sub={`${stats.trips.month} month · ${stats.trips.all} all time`} />
        <KpiCard icon={UserCheck} label="Guests Today" value={stats.guests.today} sub={`${stats.guests.week} this week`} />
      </div>

      {/* Dictionary Coverage */}
      <div className="bg-white rounded-[14px] border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-navy" />
          <h3 className="text-[16px] font-bold text-navy">Safety Dictionary Coverage</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Topics" value={stats.dictionary.topics} />
          <MiniStat label="Languages" value={stats.dictionary.languages} />
          <MiniStat label="With Audio" value={stats.dictionary.withAudio} total={stats.dictionary.totalRows} />
          <MiniStat label="With Image" value={stats.dictionary.withImage} total={stats.dictionary.totalRows} />
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-[14px] border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Shield size={18} className="text-navy" />
          <h3 className="text-[16px] font-bold text-navy">Recent Signups</h3>
        </div>
        <div className="divide-y divide-border">
          {recentSignups.map(op => (
            <div key={op.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-navy">{op.full_name}</p>
                <p className="text-[12px] text-text-mid">{op.email}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  op.subscription_status === 'active' ? 'bg-[#E8F9F4] text-teal' :
                  op.subscription_status === 'trial' ? 'bg-gold-dim text-gold' :
                  'bg-bg text-text-mid'
                }`}>
                  {op.subscription_tier}
                </span>
                <p className="text-[11px] text-text-mid mt-0.5">
                  {new Date(op.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub }: {
  icon: typeof Users; label: string; value: number; sub?: string
}) {
  return (
    <div className="bg-white rounded-[14px] border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-[8px] bg-gold-dim flex items-center justify-center">
          <Icon size={16} className="text-navy" />
        </div>
      </div>
      <p className="text-[28px] font-black text-navy leading-none">{value}</p>
      <p className="text-[13px] font-medium text-text-mid mt-1">{label}</p>
      {sub && <p className="text-[11px] text-text-dim mt-0.5">{sub}</p>}
    </div>
  )
}

function MiniStat({ label, value, total }: { label: string; value: number; total?: number }) {
  return (
    <div>
      <p className="text-[22px] font-bold text-navy">
        {value}{total ? <span className="text-[14px] text-text-dim font-normal">/{total}</span> : null}
      </p>
      <p className="text-[12px] text-text-mid">{label}</p>
    </div>
  )
}
