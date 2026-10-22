import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

export function ImageLightbox({ src, title, onClose }: { src: string | null; title: string; onClose: () => void }) {
  return <Dialog.Root open={Boolean(src)} onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[120] bg-emerald-950/80"/>
      <Dialog.Content aria-describedby="image-lightbox-description" className="fixed left-1/2 top-1/2 z-[121] w-[min(1100px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 outline-none">
        <div className="mb-3 flex items-start justify-between gap-4">
          <Dialog.Title className="font-display text-xl font-bold text-white sm:text-2xl">{title}</Dialog.Title>
          <Dialog.Close className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white hover:text-emerald-950">
            <X className="size-5"/>
            <span className="sr-only">Đóng</span>
          </Dialog.Close>
        </div>
        <Dialog.Description id="image-lightbox-description" className="sr-only">Ảnh phóng to để xem rõ hơn.</Dialog.Description>
        {src && <img className="mx-auto max-h-[78vh] w-auto max-w-full rounded-2xl object-contain" src={src} alt={title}/>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
}
