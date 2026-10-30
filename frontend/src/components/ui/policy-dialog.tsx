import * as Dialog from "@radix-ui/react-dialog"
import { FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { policyVersion, type Policy } from "@/content/policies"

type PolicyDialogProps = {
  open: boolean
  policy: Policy
  onOpenChange: (open: boolean) => void
}

export function PolicyDialog({ open, policy, onOpenChange }: PolicyDialogProps) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[110] bg-emerald-950/70"/>
      <Dialog.Content aria-describedby="policy-dialog-description" className="fixed left-1/2 top-1/2 z-[111] flex max-h-[min(88vh,760px)] w-[min(760px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-panel border border-slate-200 bg-white shadow-float outline-none">
        <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 pr-16 sm:px-8 sm:py-6 sm:pr-20">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-700"><FileText className="size-4" aria-hidden="true"/>Phiên bản {policyVersion}</p>
          <Dialog.Title className="mt-2 font-display text-2xl font-bold text-emerald-950 sm:text-3xl">{policy.title}</Dialog.Title>
          <Dialog.Description id="policy-dialog-description" className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{policy.intro}</Dialog.Description>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
          <div className="space-y-7">{policy.sections.map(section => <section key={section.title}>
            <h3 className="font-display text-xl font-bold text-emerald-950">{section.title}</h3>
            {section.paragraphs.map(paragraph => <p className="mt-2 leading-7 text-slate-600" key={paragraph}>{paragraph}</p>)}
          </section>)}</div>
        </div>
        <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8">
          <Dialog.Close asChild><Button className="w-full sm:ml-auto sm:flex sm:w-auto" type="button">Đã hiểu</Button></Dialog.Close>
        </footer>
        <Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" aria-label="Đóng chính sách"><X className="size-5"/></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
