import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangle, LoaderCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Xác nhận", cancelLabel = "Quay lại", destructive = false, busy = false, onConfirm, onOpenChange }: ConfirmDialogProps) {
  return <Dialog.Root open={open} onOpenChange={value => { if (!busy) onOpenChange(value) }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[110] bg-emerald-950/65 backdrop-blur-sm"/>
      <Dialog.Content aria-describedby="confirm-dialog-description" className="fixed left-1/2 top-1/2 z-[111] w-[min(460px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none sm:p-7">
        <div className="flex items-start gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${destructive ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}><AlertTriangle className="size-6" aria-hidden="true"/></span>
          <div className="min-w-0"><Dialog.Title className="font-display text-2xl font-bold text-emerald-950">{title}</Dialog.Title><Dialog.Description id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</Dialog.Description></div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Dialog.Close asChild><Button type="button" variant="outline" disabled={busy}>{cancelLabel}</Button></Dialog.Close>
          <Button type="button" variant={destructive ? "destructive" : "default"} disabled={busy} onClick={onConfirm}>{busy && <LoaderCircle className="size-4 animate-spin"/>}{busy ? "Đang xử lý..." : confirmLabel}</Button>
        </div>
        <Dialog.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50" disabled={busy} aria-label="Đóng hộp thoại"><X className="size-4"/></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
