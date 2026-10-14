import { Check, ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
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
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex(option => option.value === value)))
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listboxId = useId()
  const selected = options.find(option => option.value === value) ?? options[0]

  const openMenu = () => {
    const selectedIndex = options.findIndex(option => option.value === value)
    setActiveIndex(Math.max(0, selectedIndex))
    setOpen(true)
  }

  const selectOption = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

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

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" })
  }, [activeIndex, open])

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) event.preventDefault()
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) openMenu()
      return
    }
    if (event.key === "ArrowDown") setActiveIndex(index => (index + 1) % options.length)
    else if (event.key === "ArrowUp") setActiveIndex(index => (index - 1 + options.length) % options.length)
    else if (event.key === "Home") setActiveIndex(0)
    else if (event.key === "End") setActiveIndex(options.length - 1)
    else if (event.key === "Enter" || event.key === " ") selectOption(activeIndex)
  }

  return <div ref={rootRef} className={cn("relative", className)}>
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listboxId : undefined}
      aria-activedescendant={open ? `${listboxId}-${activeIndex}` : undefined}
      disabled={disabled}
      className={cn("flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 text-left text-[15px] font-semibold text-slate-800 shadow-sm transition hover:border-orange-400 hover:shadow-md focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none", open && "border-orange-500 ring-4 ring-orange-100")}
      onClick={() => open ? setOpen(false) : openMenu()}
      onKeyDown={onKeyDown}
    >
      <span className="truncate">{selected?.label}</span>
      <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}/>
    </button>
    {open && !disabled && <div id={listboxId} role="listbox" aria-label={ariaLabel} className="absolute z-[80] mt-2 max-h-72 w-full min-w-max overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgb(2_44_34_/_0.2)]">
      {options.map((option, index) => <button
        type="button"
        role="option"
        id={`${listboxId}-${index}`}
        aria-selected={option.value === value}
        ref={element => { optionRefs.current[index] = element }}
        key={option.value}
        className={cn("flex min-h-11 w-full items-center justify-between gap-5 rounded-xl px-3.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-800", index === activeIndex && option.value !== value && "bg-orange-50 text-orange-800", option.value === value && "bg-emerald-950 text-white hover:bg-emerald-900 hover:text-white")}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectOption(index)}
      >
        <span>{option.label}</span>
        {option.value === value && <Check className="size-4 shrink-0"/>}
      </button>)}
    </div>}
  </div>
}
