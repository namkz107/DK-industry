import { ExternalLink, MapPinned } from "lucide-react"
import { useState } from "react"
import { company, companyMapEmbedUrl, companyMapUrl } from "@/config/company"
import { Button } from "@/components/ui/button"

export function CompanyMap() {
  const [loadMap, setLoadMap] = useState(false)
  if (loadMap && companyMapEmbedUrl) {
    return <div><iframe
      className="min-h-[420px] w-full border-0"
      title="Bản đồ vị trí Cơ khí Đăng Khoa"
      src={companyMapEmbedUrl}
      loading="lazy"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    /></div>
  }

  return <div className="grid min-h-[420px] place-items-center bg-[radial-gradient(circle_at_top_right,_#fed7aa,_transparent_36%),linear-gradient(135deg,#ecfdf5,#f8fafc)] p-7 text-center">
    <div className="max-w-md">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-950 text-white shadow-lg"><MapPinned className="size-8"/></span>
      <h2 className="mt-6 font-display text-2xl font-bold text-emerald-950">Trụ sở & nhà xưởng</h2>
      <p className="mt-3 leading-7 text-slate-600">{company.address}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => setLoadMap(true)} disabled={!companyMapEmbedUrl}>Xem bản đồ tại đây</Button>
        <Button asChild variant="outline"><a href={companyMapUrl} target="_blank" rel="noreferrer">Mở Google Maps <ExternalLink className="size-4"/></a></Button>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{companyMapEmbedUrl ? "Bản đồ Google chỉ tải sau khi bạn bấm xem để tiết kiệm dữ liệu." : "Chưa cấu hình Google Maps Embed API key. Bạn vẫn có thể mở vị trí bằng nút Google Maps."}</p>
    </div>
  </div>
}
