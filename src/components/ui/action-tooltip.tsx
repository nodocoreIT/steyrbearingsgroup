'use client'

interface ActionTooltipProps {
  label: string
  children: React.ReactNode
}

export function ActionTooltip({ label, children }: ActionTooltipProps) {
  return (
    <div className="relative inline-flex group/tooltip">
      {children}
      <span className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-3
        px-2 py-1 rounded text-xs bg-popover text-popover-foreground border shadow-sm
        whitespace-nowrap pointer-events-none
        opacity-0 group-hover/tooltip:opacity-100
        transition-opacity duration-75
        z-50
      ">
        {label}
      </span>
    </div>
  )
}
