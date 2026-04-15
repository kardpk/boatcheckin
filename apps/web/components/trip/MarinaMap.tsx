'use client'

import { useEffect, useRef } from 'react'

interface MarinaMapProps {
  lat: number
  lng: number
  marinaName: string
  slipNumber: string | null
}

export function MarinaMap({ lat, lng, marinaName, slipNumber }: MarinaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!containerRef.current || !token) return

    let map: mapboxgl.Map | null = null

    // Dynamic import to avoid SSR issues with mapbox-gl
    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = token

      if (!containerRef.current) return

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [lng, lat],
        zoom: 15,
        interactive: true,
      })

      // Custom navy marker
      const el = document.createElement('div')
      el.className = 'marina-marker'
      el.style.cssText = `
        width: 32px; height: 32px;
        background: #0C447C;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 14px;
      `
      el.innerHTML = 'u25C9'

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(
        `<strong>${marinaName}</strong>${slipNumber ? `<br>Slip ${slipNumber}` : ''}`,
      )

      new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map)

      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    }

    initMap().catch(console.error)

    return () => {
      map?.remove()
    }
  }, [lat, lng, marinaName, slipNumber, token])

  // Fallback when no Mapbox token
  if (!token) {
    return (
      <div className="h-[200px] bg-gold-dim flex flex-col items-center justify-center gap-2">
        
        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[14px] text-navy font-medium underline"
        >
          Open marina in Google Maps →
        </a>
      </div>
    )
  }

  return <div ref={containerRef} className="h-[200px] md:h-[240px] w-full" />
}
