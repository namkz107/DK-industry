import { ExternalLink, MapPinned } from "lucide-react"
import { useState } from "react"
import { company, companyMapUrl } from "@/config/company"
import { Button } from "@/components/ui/button"

const embedUrl = "https://www.openstreetmap.org/export/embed.html?bbox=105.852915%2C20.885803%2C105.872915%2C20.905803&layer=mapnik&marker=20.895803%2C105.862915"

export function CompanyMap() {
  const [loadMap, setLoadMap] = useState(false)
  if (loadMap) {
    return <div><iframe
      className="min-h-[420px] w-full border-0"
      title="Bản đồ vị trí Cơ khí Đăng Khoa"
      src={embedUrl}
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    /><p className="bg-white p-2 text-center text-xs text-slate-500">© <a className="font-semibold underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p></div>
  }

  return <div className="grid min-h-[420px] place-items-center bg-[radial-gradient(circle_at_top_right,_#fed7aa,_transparent_36%),linear-gradient(135deg,#ecfdf5,#f8fafc)] p-7 text-center">
    <div className="max-w-md">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-950 text-white shadow-lg"><MapPinned className="size-8"/></span>
      <h2 className="mt-6 font-display text-2xl font-bold text-emerald-950">Trụ sở & nhà xưởng</h2>
      <p className="mt-3 leading-7 text-slate-600">{company.address}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => setLoadMap(true)}>Xem bản đồ tại đây</Button>
        <Button asChild variant="outline"><a href={companyMapUrl} target="_blank" rel="noreferrer">Mở OpenStreetMap <ExternalLink className="size-4"/></a></Button>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">Bản đồ chỉ tải sau khi bạn bấm xem để tiết kiệm dữ liệu.</p>
    </div>
  </div>
}
