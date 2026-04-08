import { PostTripPageData } from '@/types'

function formatDuration(hours: number) {
  if (hours === Math.floor(hours)) return `${hours} hrs`
  return `${Math.floor(hours)} hrs ${Math.round((hours % 1) * 60)} min`
}

export function PostTripHero({ data }: { data: PostTripPageData }) {
  return (
    <div className="bg-[#1D9E75] pt-12 pb-8 px-5 rounded-b-[32px] text-white">
      <div className="max-w-[480px] mx-auto text-center">
        <div className="text-[48px] leading-none mb-3">⚓</div>
        
        <p className="text-[14px] font-medium opacity-80 uppercase tracking-widest mb-1">
          Trip Completed
        </p>
        
        <h1 className="text-[32px] font-bold leading-tight mb-6">
          {data.boatName}
        </h1>

        <div className="flex items-center justify-center gap-2">
          <div className="bg-black/10 px-4 py-2 rounded-full text-[14px] font-medium backdrop-blur-sm">
            📅 {new Date(data.tripDate).toLocaleDateString()}
          </div>
          <div className="bg-black/10 px-4 py-2 rounded-full text-[14px] font-medium backdrop-blur-sm">
            ⏱️ {formatDuration(data.durationHours)}
          </div>
        </div>

        {data.weather && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[14px] font-medium opacity-90">
            <span>{data.weather.icon}</span>
            <span>{data.weather.temperature}°F — {data.weather.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
