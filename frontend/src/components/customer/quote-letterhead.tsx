import type { ReactNode } from "react"

export function QuoteLetterhead({ aside }: { aside?: ReactNode }) {
  return <header className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 border-b border-slate-300 px-4 py-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:px-6">
    <img src="/brand/dk-logo.png" alt="Đăng Khoa" className="h-14 w-16 object-contain"/>
    <div className="text-center">
      <p className="text-sm font-bold tracking-wide text-slate-950 sm:text-base">DANG KHOA CIC AND T.,JSC</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-600">ADD: CỤM 3 - DUYEN TRUONG - DUYEN THAI - THUONG TIN - HA NOI</p>
      <p className="text-[11px] leading-5 text-slate-600">TEL: 098 3688 326 · 097 7361 298</p>
      <p className="text-[11px] leading-5 text-slate-600">MST: 0106426038 · Email: ctydangkhoa8386@gmail.com</p>
    </div>
    {aside && <div className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end">{aside}</div>}
  </header>
}
