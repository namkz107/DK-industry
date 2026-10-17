import { ArrowRight, CalendarCheck2, Clock3, Mail, MapPin, Navigation, Phone, ShieldCheck, Sparkles } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CompanyMap } from "@/components/company-map"
import { QuoteDialog } from "@/components/quote-dialog"
import { Button } from "@/components/ui/button"
import { company, companyMapUrl } from "@/config/company"
import { useAuth } from "@/contexts/auth-context"
import { usePageMeta } from "@/hooks/use-page-meta"

export function ContactPage() {
  usePageMeta("Liên hệ", "Thông tin liên hệ, địa chỉ nhà xưởng và chỉ đường đến Cơ khí Đăng Khoa.")
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const openContactForm = () => {
    if (user?.role === "customer") { navigate("/tai-khoan/yeu-cau?product=Y%C3%AAu%20c%E1%BA%A7u%20t%C6%B0%20v%E1%BA%A5n"); return }
    setQuoteOpen(true)
  }

  return <>
    <section className="relative isolate overflow-hidden bg-[#061d17] text-white">
      <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_16%_18%,rgba(249,115,22,.18),transparent_25%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,.16),transparent_30%)]"/>
      <div className="absolute inset-0 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:64px_64px]"/>
      <div className="container-page relative grid min-h-[650px] items-center gap-12 py-20 lg:grid-cols-[.92fr_1.08fr] lg:py-24">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-orange-300 backdrop-blur"><Sparkles className="size-4"/>Kết nối với chúng tôi</div>
          <h1 className="mt-7 max-w-3xl font-display text-[clamp(3rem,6.3vw,5.5rem)] font-bold leading-[.96] tracking-[-.055em]">Bắt đầu từ một cuộc <span className="text-orange-400">trao đổi rõ ràng.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-emerald-50/70">Chia sẻ bài toán, bản vẽ hoặc nhu cầu thực tế. Đội ngũ Đăng Khoa sẽ cùng bạn làm rõ yêu cầu và lựa chọn hướng triển khai phù hợp.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><a href={`tel:${company.phone}`}>Gọi {company.phoneLabel}<Phone className="size-5"/></a></Button><Button type="button" size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white" onClick={openContactForm}>Gửi yêu cầu<ArrowRight className="size-5"/></Button></div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/10 pt-7 text-sm font-semibold text-emerald-50/65"><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-orange-400"/>Bảo mật thông tin yêu cầu</span><span className="flex items-center gap-2"><CalendarCheck2 className="size-5 text-orange-400"/>Chủ động hẹn lịch khảo sát</span></div>
        </div>
        <div className="relative hidden min-h-[500px] lg:block">
          <div className="absolute inset-y-0 right-0 w-[91%] overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/30"><img className="size-full object-cover" src="/images/heroes/contact-hero.jpg" alt="Nhà xưởng Cơ khí Đăng Khoa" fetchPriority="high"/><div className="absolute inset-0 bg-gradient-to-t from-[#061d17]/90 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-8"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Trụ sở & nhà xưởng</p><p className="mt-3 max-w-md text-sm leading-6 text-white/72">{company.address}</p></div></div>
          <div className="absolute left-0 top-10 max-w-[220px] rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"><MapPin className="size-6 text-orange-400"/><p className="mt-3 font-display text-lg font-bold">Hẹn trước để được tiếp đón tốt nhất</p></div>
        </div>
      </div>
    </section>

    <section className="border-b border-slate-200 bg-white py-8 sm:py-10"><div className="container-page grid gap-3 md:grid-cols-3">
      <ContactCard icon={Phone} eyebrow="Trao đổi trực tiếp" title={company.phoneLabel} href={`tel:${company.phone}`} action="Gọi ngay"/>
      <ContactCard icon={Mail} eyebrow="Gửi hồ sơ & bản vẽ" title={company.email} action="Mở biểu mẫu" onClick={openContactForm}/>
      <ContactCard icon={Navigation} eyebrow="Đến nhà xưởng" title="Mở chỉ đường Google Maps" href={companyMapUrl} action="Chỉ đường" external/>
    </div></section>

    <section className="bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page">
      <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Vị trí của chúng tôi</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl">Ghé thăm năng lực sản xuất thực tế.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Đến nhà xưởng để trao đổi trực tiếp với đội ngũ kỹ thuật, xem năng lực thiết bị và thống nhất yêu cầu công trình.</p></div>
      <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_75px_rgba(2,44,34,.08)] lg:grid-cols-[.68fr_1.32fr]">
        <div className="flex flex-col justify-between border-b border-slate-200 p-7 sm:p-9 lg:border-b-0 lg:border-r lg:p-10"><div><span className="grid size-14 place-items-center rounded-2xl bg-emerald-950 text-white"><MapPin className="size-7"/></span><p className="mt-8 text-xs font-black uppercase tracking-[.18em] text-orange-600">Trụ sở & nhà xưởng</p><address className="mt-4 font-display text-2xl font-bold not-italic leading-snug text-emerald-950">{company.address}</address><p className="mt-5 leading-7 text-slate-600">Vui lòng liên hệ trước khi đến để đội ngũ kỹ thuật sắp xếp người phụ trách phù hợp với nội dung bạn cần trao đổi.</p></div><Button asChild className="mt-8 w-full sm:w-auto lg:w-full" size="lg"><a href={companyMapUrl} target="_blank" rel="noreferrer">Mở chỉ đường<Navigation className="size-5"/></a></Button></div>
        <div className="min-h-[460px] bg-slate-100"><CompanyMap/></div>
      </div>
    </div></section>

    <section className="bg-white py-16 sm:py-20"><div className="container-page grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <article className="relative overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white sm:p-10"><div className="absolute -right-20 -top-28 size-72 rounded-full border border-white/10"/><span className="relative grid size-14 place-items-center rounded-2xl bg-white/10 text-orange-400"><Clock3 className="size-7"/></span><p className="relative mt-8 text-xs font-black uppercase tracking-[.18em] text-orange-400">Hẹn lịch làm việc</p><h2 className="relative mt-3 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Một cuộc hẹn trước giúp buổi trao đổi hiệu quả hơn.</h2><p className="relative mt-5 max-w-xl text-lg leading-8 text-emerald-50/65">Cho chúng tôi biết loại công trình, nội dung cần khảo sát hoặc thiết bị cần xem. Đội ngũ kỹ thuật sẽ chuẩn bị đúng người và thông tin cần thiết.</p></article>
      <article className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-[#f8f9f7] p-7 sm:p-10"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Kênh liên hệ ưu tiên</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-emerald-950">Bạn cần phản hồi nhanh?</h2><p className="mt-4 leading-7 text-slate-600">Gọi trực tiếp để trao đổi sơ bộ. Với bản vẽ hoặc hồ sơ kỹ thuật, hãy gửi qua biểu mẫu để chúng tôi tiếp nhận và phản hồi đầy đủ.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Button asChild size="lg"><a href={`tel:${company.phone}`}><Phone className="size-5"/>Gọi hotline</a></Button><Button type="button" size="lg" variant="outline" onClick={openContactForm}><Mail className="size-5"/>Gửi yêu cầu</Button></div></article>
    </div></section>
    <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen}/>
  </>
}

function ContactCard({ icon: Icon, eyebrow, title, href, action, external = false, onClick }: { icon: typeof Phone; eyebrow: string; title: string; href?: string; action: string; external?: boolean; onClick?: () => void }) {
  const content = <><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white"><Icon className="size-5"/></span><span className="min-w-0 text-left"><span className="block text-xs font-black uppercase tracking-[.14em] text-slate-400">{eyebrow}</span><strong className="mt-1 block truncate text-base text-emerald-950">{title}</strong><span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-orange-700">{action}<ArrowRight className="size-3.5"/></span></span></>
  const className = "group flex min-w-0 items-center gap-4 rounded-2xl border border-transparent p-4 transition hover:border-slate-200 hover:bg-slate-50"
  if (onClick) return <button type="button" className={className} onClick={onClick}>{content}</button>
  return <a className={className} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{content}</a>
}
