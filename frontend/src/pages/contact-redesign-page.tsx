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
  const [quoteTrigger, setQuoteTrigger] = useState<HTMLElement | null>(null)
  const openContactForm = (trigger?: HTMLElement) => {
    if (user?.role === "customer") { navigate("/tai-khoan/yeu-cau?product=Y%C3%AAu%20c%E1%BA%A7u%20t%C6%B0%20v%E1%BA%A5n"); return }
    setQuoteTrigger(trigger || null)
    setQuoteOpen(true)
  }

  return <>
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <img aria-hidden="true" className="absolute inset-0 -z-30 size-full scale-105 object-cover opacity-30 blur-[2px]" src="/images/equipment/dot-dap-xuong.jpg" alt=""/>
      <img className="absolute inset-0 -z-20 size-full object-contain object-right opacity-95" src="/images/equipment/dot-dap-xuong.jpg" alt="Thiết bị dập tại xưởng sản xuất cơ khí" fetchPriority="high"/>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,.96)_0%,rgba(2,6,23,.88)_44%,rgba(2,6,23,.40)_72%,rgba(2,6,23,.20)_100%)]"/>
      <div className="container-page relative flex min-h-[38rem] items-center py-16 sm:min-h-[42rem] lg:min-h-[46rem] lg:py-24">
        <div className="relative z-10 max-w-[780px]">
          <div className="eyebrow-pill"><Sparkles className="size-4"/>Kết nối với chúng tôi</div>
          <h1 className="heading-hero mt-7 max-w-3xl">Bắt đầu từ một cuộc <span className="text-orange-400">trao đổi rõ ràng.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-100/78">Chia sẻ bài toán, bản vẽ hoặc nhu cầu thực tế. Đội ngũ Đăng Khoa sẽ cùng bạn làm rõ yêu cầu và lựa chọn hướng triển khai phù hợp.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><a href={`tel:${company.phone}`}>Gọi {company.phoneLabel}<Phone className="size-5"/></a></Button><Button type="button" size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-slate-950" onClick={event => openContactForm(event.currentTarget)}>Gửi yêu cầu<ArrowRight className="size-5"/></Button></div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-7 text-sm font-semibold text-slate-100/70"><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-orange-400"/>Bảo mật thông tin yêu cầu</span><span className="flex items-center gap-2"><CalendarCheck2 className="size-5 text-orange-400"/>Chủ động hẹn lịch khảo sát</span></div>
        </div>
      </div>
    </section>

    <section className="relative z-10 bg-[#f4f5f2] pb-8 sm:pb-10"><div className="container-page -mt-8 grid gap-4 md:-mt-10 md:grid-cols-3">
      <ContactCard icon={Phone} eyebrow="Trao đổi trực tiếp" title={company.phoneLabel} href={`tel:${company.phone}`} action="Gọi ngay"/>
      <ContactCard icon={Mail} eyebrow="Gửi hồ sơ & bản vẽ" title={company.email} action="Mở biểu mẫu" onClick={openContactForm}/>
      <ContactCard icon={Navigation} eyebrow="Đến nhà xưởng" title="Mở chỉ đường Google Maps" href={companyMapUrl} action="Chỉ đường" external/>
    </div></section>

    <section className="overflow-hidden bg-[#f4f5f2] pb-16 pt-10 sm:pb-20 lg:pb-24"><div className="container-page">
      <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Vị trí của chúng tôi</p><h2 className="heading-section mt-3">Ghé thăm năng lực sản xuất thực tế.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Trao đổi trực tiếp với đội ngũ kỹ thuật, xem thiết bị tại xưởng và thống nhất yêu cầu trước khi triển khai.</p></div>
      <div className="mt-10 grid overflow-hidden rounded-[2rem] bg-[#061d17] shadow-[0_30px_80px_-38px_rgba(6,29,23,.65)] lg:grid-cols-[.78fr_1.22fr]">
        <div className="relative isolate flex min-h-[520px] flex-col justify-between overflow-hidden p-7 text-white sm:p-10 lg:p-12">
          <img aria-hidden="true" className="absolute inset-0 -z-20 size-full object-cover opacity-28" src="/images/equipment/xe-nang-xuong.png" alt=""/>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(3,24,19,.76),rgba(3,24,19,.98))]"/>
          <div><span className="grid size-14 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg"><MapPin className="size-7"/></span><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-orange-300">Trụ sở & nhà xưởng</p><address className="mt-4 max-w-md font-display text-3xl font-bold not-italic leading-tight sm:text-4xl">{company.address}</address><p className="mt-6 max-w-md leading-7 text-emerald-50/70">Vui lòng liên hệ trước khi đến để chúng tôi sắp xếp đúng kỹ thuật viên phụ trách nội dung bạn cần trao đổi.</p></div>
          <div className="mt-8"><div className="grid gap-3"><a className="flex min-h-14 items-center gap-3 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[.08] px-4 text-sm font-bold transition hover:bg-white/[.14]" href={`tel:${company.phone}`}><Phone className="size-5 shrink-0 text-orange-300"/><span>{company.phoneLabel}</span></a><a className="flex min-h-14 min-w-0 items-center gap-3 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[.08] px-4 text-sm font-bold transition hover:bg-white/[.14]" href={`mailto:${company.email}`}><Mail className="size-5 shrink-0 text-orange-300"/><span>{company.email}</span></a></div>{company.taxCode ? <p className="mt-5 text-sm font-semibold text-emerald-50/55">Mã số thuế: {company.taxCode}</p> : null}<Button asChild className="mt-6 w-full" size="lg"><a href={companyMapUrl} target="_blank" rel="noreferrer">Mở chỉ đường Google Maps<Navigation className="size-5"/></a></Button></div>
        </div>
        <div className="bg-white p-3 sm:p-4"><div className="h-full overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-100"><CompanyMap/></div></div>
      </div>
    </div></section>

    <section className="bg-white py-16 sm:py-20"><div className="container-page"><div className="grid overflow-hidden rounded-[2rem] bg-orange-600 text-white shadow-[0_28px_70px_-36px_rgba(234,88,12,.75)] lg:grid-cols-[1.12fr_.88fr]">
      <div className="p-7 sm:p-10 lg:p-12"><span className="grid size-14 place-items-center rounded-2xl bg-white/15"><Clock3 className="size-7"/></span><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-orange-100">Hẹn lịch làm việc</p><h2 className="heading-section mt-3 max-w-2xl text-white">Chuẩn bị trước để buổi trao đổi đi thẳng vào vấn đề.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-orange-50/85">Cho chúng tôi biết loại công trình, nội dung cần khảo sát hoặc thiết bị cần xem. Đội ngũ kỹ thuật sẽ chuẩn bị đúng người và thông tin cần thiết.</p><div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-orange-50"><span className="flex items-center gap-2"><ShieldCheck className="size-5"/>Bảo mật hồ sơ</span><span className="flex items-center gap-2"><CalendarCheck2 className="size-5"/>Chủ động lịch khảo sát</span></div></div>
      <div className="m-3 flex flex-col justify-center rounded-[1.45rem] bg-white p-7 text-slate-900 sm:m-4 sm:p-9 lg:p-10"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Phản hồi nhanh</p><h2 className="mt-3 font-display text-3xl font-bold text-emerald-950">Bạn đã có bản vẽ hoặc yêu cầu?</h2><p className="mt-4 leading-7 text-slate-600">Gửi thông tin để đội ngũ kỹ thuật tiếp nhận đầy đủ, hoặc gọi trực tiếp nếu cần trao đổi sơ bộ ngay.</p><div className="mt-8 grid gap-3"><Button type="button" size="lg" onClick={event => openContactForm(event.currentTarget)}><Mail className="size-5"/>Gửi yêu cầu tư vấn</Button><Button asChild size="lg" variant="outline"><a href={`tel:${company.phone}`}><Phone className="size-5"/>Gọi {company.phoneLabel}</a></Button></div></div>
    </div></div></section>
    <QuoteDialog open={quoteOpen} onOpenChange={setQuoteOpen} returnFocusTo={quoteTrigger}/>
  </>
}

function ContactCard({ icon: Icon, eyebrow, title, href, action, external = false, onClick }: { icon: typeof Phone; eyebrow: string; title: string; href?: string; action: string; external?: boolean; onClick?: (trigger: HTMLButtonElement) => void }) {
  const content = <><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white"><Icon className="size-5"/></span><span className="min-w-0 text-left"><span className="block text-xs font-bold uppercase tracking-[.1em] text-slate-400">{eyebrow}</span><strong className="mt-1 block break-words text-base leading-6 text-emerald-950">{title}</strong><span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-700">{action}<ArrowRight className="size-3.5"/></span></span></>
  const className = "group flex min-h-32 min-w-0 items-center gap-4 rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,.55)] transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_24px_55px_-30px_rgba(234,88,12,.38)] sm:p-6"
  if (onClick) return <button type="button" className={className} onClick={event => onClick(event.currentTarget)}>{content}</button>
  return <a className={className} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{content}</a>
}
