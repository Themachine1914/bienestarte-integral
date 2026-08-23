import type { ReactNode } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

/**
 * Collapsible help block. Built on <details> so it never traps focus and works
 * without JS state — the booking flow stays usable with the panel open, which
 * a modal would not allow.
 */
export function HelpPanel({
  title,
  children,
  defaultOpen = false,
  tone = 'sage',
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  tone?: 'sage' | 'lavender'
}) {
  const accent =
    tone === 'lavender'
      ? 'border-lavender-200 bg-lavender-50'
      : 'border-sage-200 bg-sage-50'
  const heading = tone === 'lavender' ? 'text-lavender-700' : 'text-sage-700'

  return (
    <details open={defaultOpen} className={`group border ${accent} p-4`}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium marker:content-none">
        <HelpCircle size={16} className={heading} />
        <span className={heading}>{title}</span>
        <ChevronDown
          size={16}
          className={`ml-auto transition-transform group-open:rotate-180 ${heading}`}
        />
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </details>
  )
}
