'use client'

import { useState } from 'react'

export function ReadMoreBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = bio.length > 200

  return (
    <div className="mt-3">
      <p className="text-[14px] text-text-mid leading-relaxed">
        {!expanded && isLong ? `${bio.slice(0, 200)}…` : bio}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[13px] text-navy font-medium mt-1"
        >
          {expanded ? 'Read less' : 'Read more →'}
        </button>
      )}
    </div>
  )
}
