'use client'

import { useState } from 'react'

export function BotDock() {
  const [expanded, setExpanded] = useState(false)

  function handleClick() {
    // TODO: open Jams Bot panel
    console.log('TODO: open Jams Bot panel')
  }

  return (
    <div
      className={`fixed bottom-[14px] right-[14px] z-[250] flex items-center overflow-hidden rounded-[22px] glass-card cursor-pointer bot-dock-transition transition-[width] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)] ${
        expanded ? 'w-[180px]' : 'w-[70px]'
      } h-[70px]`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      role="button"
      tabIndex={0}
      aria-label="Open Jams Bot"
      aria-expanded={expanded}
    >
      {/* Icon */}
      <div className="w-[70px] h-[70px] flex items-center justify-center shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/Jams Bot (Default).svg"
          alt=""
          width={28}
          height={28}
          className="no-drag"
          draggable={false}
        />
      </div>

      {/* Label */}
      <span
        className={`whitespace-nowrap text-text-primary pl-1 transition-opacity duration-150 ${
          expanded ? 'opacity-100 delay-75' : 'opacity-0'
        }`}
        style={{ fontSize: '20px', fontWeight: 400 }}
        aria-hidden={!expanded}
      >
        Jams Bot
      </span>
    </div>
  )
}
