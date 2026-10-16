import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"

type WorkspaceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  eyebrow?: string
  children: ReactNode
  busy?: boolean
  width?: "wide" | "medium"
}

export function WorkspaceModal({ open, onOpenChange, title, description, eyebrow, children, busy = false, width = "wide" }: WorkspaceModalProps) {
  return <Dialog.Root open={open} onOpenChange={value => { if (!busy) onOpenChange(value) }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-emerald-950/55 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in"/>
      <Dialog.Content className={`fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100%-1.25rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/20 bg-slate-50 shadow-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${width === "medium" ? "max-w-2xl" : "max-w-6xl"}`}>
        <header className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-5 text-white sm:px-7">
          <div className="min-w-0">{eyebrow && <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">{eyebrow}</p>}<Dialog.Title className="mt-1 truncate font-display text-2xl font-bold">{title}</Dialog.Title>{description && <Dialog.Description className="mt-1 text-sm text-emerald-100/75">{description}</Dialog.Description>}</div>
          <Dialog.Close disabled={busy} className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Đóng cửa sổ"><X className="size-5"/></Dialog.Close>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
