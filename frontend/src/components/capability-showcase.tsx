import { ArrowRight, BadgeCheck, Factory, Headphones, Ruler, Wrench, type LucideIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

interface Capability {
  label: string
  eyebrow: string
  title: string
  description: string
  points: string[]
  image: string
  alt: string
  icon: LucideIcon
}

const capabilities: Capability[] = [
  {
    label: "Tư vấn",
    eyebrow: "Hiểu đúng bài toán",
    title: "Khảo sát kỹ. Đề xuất đúng.",
    description: "Đội ngũ kỹ thuật đi từ hiện trạng sản xuất, mục tiêu vận hành và ngân sách để xây dựng phương án khả thi ngay từ đầu.",
    points: ["Khảo sát trực tiếp", "Phương án rõ ràng", "Dự toán minh bạch"],
    image: "/images/products/vo-tu-dien.jpg",
    alt: "Tủ điện công nghiệp do Cơ khí Đăng Khoa cung cấp",
    icon: Ruler,
  },
  {
    label: "Chế tạo",
    eyebrow: "Biến thiết kế thành sản phẩm",
    title: "Gia công chính xác. Kiểm soát từng bước.",
    description: "Gia công đường ống, ống gió, sàn thao tác và chi tiết cơ khí theo phương án đã chốt, rồi kiểm tra trước khi đưa ra công trường.",
    points: ["Máy chấn, cắt, hàn", "Vật tư rõ nguồn gốc", "Kiểm soát chất lượng"],
    image: "/images/stages/che-tao-laser.jpg",
    alt: "Máy cắt laser đang cắt tấm kim loại trong xưởng",
    icon: Factory,
  },
  {
    label: "Thi công",
    eyebrow: "Đưa giải pháp vào vận hành",
    title: "Lắp đặt đồng bộ. Bám sát tiến độ.",
    description: "Đội thi công phối hợp chặt chẽ tại công trường, quản lý an toàn và nghiệm thu theo từng hạng mục để hạn chế gián đoạn sản xuất.",
    points: ["Kế hoạch theo mốc", "An toàn công trường", "Nghiệm thu đầy đủ"],
    image: "/images/products/ban-ghe-an-inox.jpg",
    alt: "Hệ thống bàn ghế inox hoàn thiện cho khu công nghiệp",
    icon: Wrench,
  },
  {
    label: "Bảo trì",
    eyebrow: "Đồng hành sau bàn giao",
    title: "Phản hồi nhanh. Vận hành bền vững.",
    description: "Sau nghiệm thu, Đăng Khoa tiếp tục hỗ trợ kiểm tra, bảo trì và xử lý phát sinh để hệ thống duy trì hiệu suất ổn định.",
    points: ["Hỗ trợ kỹ thuật", "Lịch bảo trì chủ động", "Bảo hành rõ ràng"],
    image: "/images/stages/bao-tri-van.jpg",
    alt: "Kỹ thuật viên chỉnh cụm van trên hệ thống đường ống",
    icon: Headphones,
  },
]

const slideMs = 4200
const travelMs = 700

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function CapabilityShowcase() {
  const count = capabilities.length
  const [index, setIndex] = useState(0)
  const [sliding, setSliding] = useState(true)
  const [run, setRun] = useState(0)
  const slides = [...capabilities, capabilities[0]]
  const shown = capabilities[index % count]
  const Icon = shown.icon

  const choose = (step: number) => {
    setSliding(index < count)
    setIndex(step)
    setRun(value => value + 1)
  }

  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = window.setInterval(() => {
      setSliding(true)
      setIndex(current => current + 1)
    }, slideMs)
    return () => window.clearInterval(timer)
  }, [run])

  useEffect(() => {
    if (index < count) return
    const timer = window.setTimeout(() => {
      setSliding(false)
      setIndex(0)
    }, travelMs)
    return () => window.clearTimeout(timer)
  }, [index, count])

  return <section className="section-space bg-stone-100" aria-labelledby="capability-heading">
    <div className="container-page">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-orange-700">Năng lực cốt lõi</p>
        <h2 id="capability-heading" className="heading-section">Một quy trình liền mạch.<br/><span>Một đối tác xuyên suốt.</span></h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Từ bài toán ban đầu đến vận hành dài hạn, mỗi giai đoạn đều có đội ngũ Đăng Khoa đồng hành.</p>
      </div>

      <div className="mt-8 flex max-w-full gap-1 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Các giai đoạn năng lực">
        {capabilities.map((item, step) => {
          const selected = step === index % count
          return <button className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition-colors ${selected ? "border-orange-600 text-emerald-950" : "border-transparent text-slate-600 hover:text-emerald-900"}`} aria-selected={selected} id={`capability-tab-${step}`} key={item.label} role="tab" type="button" onClick={() => choose(step)}>0{step + 1} {item.label}</button>
        })}
      </div>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
        <div className="capability-reel overflow-hidden rounded-card border border-slate-200 bg-white">
          <div className={`capability-reel__track flex ${sliding ? "transition-transform duration-700 ease-out" : ""}`} style={{ transform: `translateX(-${index * 100}%)` }}>
            {slides.map((item, step) => <img className="aspect-[4/3] object-cover" key={`${item.label}-${step}`} src={item.image} alt={step === index ? item.alt : ""} />)}
          </div>
          <p className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 text-sm font-semibold text-emerald-950"><Icon className="size-4 text-orange-600" aria-hidden="true"/>Giai đoạn 0{(index % count) + 1} · {shown.label}</p>
        </div>
        <div aria-live="polite">
          <p className="text-sm font-semibold text-orange-700">{shown.eyebrow}</p>
          <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-emerald-950 sm:text-3xl">{shown.title}</h3>
          <p className="mt-4 text-base leading-7 text-slate-600">{shown.description}</p>
          <ul className="mt-5 grid gap-2">
            {shown.points.map(point => <li className="flex items-center gap-2 text-sm font-semibold text-slate-800" key={point}><BadgeCheck className="size-4 shrink-0 text-orange-600" aria-hidden="true"/>{point}</li>)}
          </ul>
          <Button asChild variant="dark" className="mt-6"><Link to="/dich-vu">Xem dịch vụ <ArrowRight className="size-4"/> </Link></Button>
        </div>
      </div>
    </div>
  </section>
}
