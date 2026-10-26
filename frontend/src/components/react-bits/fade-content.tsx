import type { PropsWithChildren } from "react"

export function FadeContent({ children, className = "" }: PropsWithChildren<{ delay?: number; className?: string }>) {
  return <div className={className}>{children}</div>
}
