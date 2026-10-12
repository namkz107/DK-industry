import { Check, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function Select({ value, options, onChange, disabled = false, ariaLabel, className }: SelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find(option => option.value === value) ?? options[0]

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  return <div ref={rootRef} className={cn("relative", className)}>
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      disabled={disabled}
      className={cn("flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 text-left font-semibold text-slate-800 transition hover:border-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400", open && "border-orange-500 ring-4 ring-orange-100")}
      onClick={() => setOpen(current => !current)}
    >
      <span className="truncate">{selected?.label}</span>
      <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}/>
    </button>
    {open && !disabled && <div role="listbox" aria-label={ariaLabel} className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15">
      {options.map(option => <button
        type="button"
        role="option"
        aria-selected={option.value === value}
        key={option.value}
        className={cn("flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-800", option.value === value && "bg-emerald-950 text-white hover:bg-emerald-900 hover:text-white")}
        onClick={() => { onChange(option.value); setOpen(false) }}
      >
        <span>{option.label}</span>
        {option.value === value && <Check className="size-4 shrink-0"/>}
      </button>)}
    </div>}
  </div>
}
