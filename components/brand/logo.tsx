import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

/** The Rapidash mark: a dashboard layout of tiles with a rising bar chart. Same geometry as `assets/logo.svg`. */
export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 256 256" role="img" aria-label="Rapidash" className={cn("h-8 w-8 shrink-0", className)}>
      <rect width="256" height="256" rx="56" fill="#0054ee" />
      <rect x="48" y="48" width="160" height="44" rx="12" fill="#ffffff" />
      <rect x="48" y="108" width="92" height="100" rx="12" fill="#ffffff" />
      <rect x="64" y="166" width="14" height="26" rx="3" fill="#0054ee" />
      <rect x="87" y="146" width="14" height="46" rx="3" fill="#0054ee" />
      <rect x="110" y="124" width="14" height="68" rx="3" fill="#0054ee" />
      <rect x="156" y="108" width="52" height="42" rx="12" fill="#ffffff" />
      <rect x="156" y="166" width="52" height="42" rx="12" fill="#ffffff" fillOpacity={0.7} />
    </svg>
  )
}
