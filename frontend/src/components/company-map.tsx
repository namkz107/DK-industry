import { ExternalLink, MapPinned } from "lucide-react"
import { useState } from "react"
import { company, companyMapEmbedUrl, companyMapUrl } from "@/config/company"
import { Button } from "@/components/ui/button"

export function CompanyMap() {
  const [loadMap, setLoadMap] = useState(false)
  if (loadMap) {
    return <div><iframe
      className="min-h-[520px] w-full border-0 lg:min-h-[600px]"
      title="Bản đồ vị trí Cơ khí Đăng Khoa"
      src={companyMapEmbedUrl}
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    /></div>
  }

  return <div className="relative grid min-h-[520px] place-items-center overflow-hidden bg-[#e8efeb] p-5 text-center lg:min-h-[600px] lg:p-8">
    <div aria-hidden="true" className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(6,78,59,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(6,78,59,.12)_1px,transparent_1px)] [background-size:42px_42px]"/>
    <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full border-[52px] border-orange-500/10"/>
    <div aria-hidden="true" className="absolute -bottom-28 -left-24 size-72 rounded-full border-[48px] border-emerald-900/10"/>
    <div className="relative max-w-lg rounded-[1.6rem] border border-white/80 bg-white/92 p-7 shadow-[0_28px_65px_-35px_rgba(6,78,59,.6)] backdrop-blur sm:p-9">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-950 text-white shadow-lg"><MapPinned className="size-7"/></span>
      <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-orange-600">Bản đồ nhà xưởng</p>
      <h2 className="mt-3 font-display text-3xl font-bold text-emerald-950">Xem vị trí chính xác</h2>
      <p className="mt-4 leading-7 text-slate-600">{company.address}</p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Button type="button" size="lg" onClick={() => setLoadMap(true)}>Hiện bản đồ</Button>
        <Button asChild size="lg" variant="outline"><a href={companyMapUrl} target="_blank" rel="noreferrer">Google Maps <ExternalLink className="size-4"/></a></Button>
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-500">Bản đồ chỉ tải khi bạn chọn xem, giúp trang mở nhanh hơn và tiết kiệm dữ liệu.</p>
    </div>
  </div>
}
