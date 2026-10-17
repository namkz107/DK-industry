import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BadgeCheck, CheckCircle2, DraftingCompass, Handshake, HeartHandshake, Lightbulb, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { FadeContent } from "@/components/react-bits/fade-content"
import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/use-page-meta"
import { api } from "@/lib/api"

const capabilities = [
  { icon: DraftingCompass, number: "01", title: "Tư vấn & thiết kế", text: "Khảo sát, phân tích yêu cầu và thiết kế giải pháp kỹ thuật phù hợp với từng công trình." },
  { icon: Users, number: "02", title: "Đội ngũ chuyên môn", text: "Kỹ sư và kỹ thuật viên giàu kinh nghiệm đồng hành xuyên suốt từ ý tưởng đến bàn giao." },
  { icon: Handshake, number: "03", title: "Thi công đồng bộ", text: "Tổ chức gia công, lắp đặt và nghiệm thu theo một quy trình rõ ràng, nhất quán." },
  { icon: ShieldCheck, number: "04", title: "Cam kết chất lượng", text: "Kiểm soát chất lượng, tiến độ và an toàn để mỗi hạng mục vận hành bền bỉ." },
]

const values = [
  { icon: HeartHandshake, title: "Tận tâm", text: "Lắng nghe nhu cầu và chủ động chịu trách nhiệm đến cùng." },
  { icon: BadgeCheck, title: "Minh bạch", text: "Thông tin, tiến độ và chi phí được trao đổi rõ ràng." },
  { icon: TrendingUp, title: "Phát triển", text: "Không ngừng cải tiến để tạo ra giá trị lâu dài." },
]

export function AboutPage() {
  usePageMeta("Giới thiệu", "Năng lực, sứ mệnh, giá trị cốt lõi và đội ngũ lãnh đạo của Cơ khí Đăng Khoa.")
  const aboutSettings = useQuery({ queryKey: ["site-settings", "about"], queryFn: api.aboutSettings, staleTime: 60_000 })
  const ceoImage = aboutSettings.data?.data.leaderImage ?? import.meta.env.VITE_CLOUDINARY_CEO_IMAGE_URL

  return <>
    <section className="relative isolate overflow-hidden bg-[#061d17] text-white">
      <img className="absolute inset-0 -z-20 size-full object-cover object-[62%_center]" src="/images/heroes/about-hero.jpg" alt="Đội ngũ kỹ thuật trao đổi bản vẽ tại xưởng" fetchPriority="high"/>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,27,22,.99)_0%,rgba(3,27,22,.94)_42%,rgba(3,27,22,.48)_72%,rgba(3,27,22,.18)_100%)]"/>
      <div className="absolute inset-0 opacity-[.08] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:64px_64px]"/>
      <div className="absolute -bottom-44 -left-32 size-[430px] rounded-full border border-orange-400/20"/>
      <div className="container-page relative flex min-h-[650px] items-center py-20 lg:py-24"><div className="max-w-[770px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-orange-300 backdrop-blur"><Sparkles className="size-4"/>Về Cơ khí Đăng Khoa</div>
        <h1 className="mt-7 font-display text-[clamp(3rem,6.6vw,6rem)] font-bold leading-[.94] tracking-[-.06em]">Kỹ thuật vững vàng.<br/><span className="text-orange-400">Đồng hành dài lâu.</span></h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-emerald-50/72 sm:text-lg">CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA là đối tác tư vấn, chế tạo và thi công cơ khí công nghiệp toàn diện—kết nối năng lực kỹ thuật với trách nhiệm trong từng công trình.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/du-an">Xem dự án đã thực hiện<ArrowRight className="size-5"/></Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"><Link to="/lien-he">Trao đổi cùng chúng tôi</Link></Button></div>
        <div className="mt-11 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/10 pt-7"><HeroFact value="01" label="Đầu mối xuyên suốt"/><HeroFact value="04" label="Nhóm năng lực"/><HeroFact value="100%" label="Theo sát công trình"/></div>
      </div></div>
    </section>

    <section className="bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page">
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Nền tảng phát triển</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl">Điều chúng tôi theo đuổi trong mỗi công trình.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Không chỉ hoàn thành một hạng mục, chúng tôi hướng đến một giải pháp phù hợp thực tế, vận hành ổn định và tạo giá trị lâu dài cho khách hàng.</p></div>
      <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,44,34,.07)] lg:grid-cols-2">
        <FadeContent><article className="h-full p-7 sm:p-10 lg:p-12"><span className="font-display text-sm font-black text-orange-600">01 / SỨ MỆNH</span><h3 className="mt-7 font-display text-3xl font-bold text-emerald-950 sm:text-4xl">Giải pháp thiết thực,<br/>hiệu quả có thể đo lường.</h3><p className="mt-5 text-lg leading-8 text-slate-600">Cung cấp những giải pháp cơ khí và công nghiệp đồng bộ, giúp doanh nghiệp tối ưu vận hành, kiểm soát chi phí và an tâm về chất lượng trong suốt vòng đời dự án.</p><div className="mt-8 h-1 w-16 rounded-full bg-orange-500"/></article></FadeContent>
        <FadeContent delay={.08}><article className="relative h-full overflow-hidden bg-emerald-950 p-7 text-white sm:p-10 lg:p-12"><div className="absolute -right-24 -top-24 size-64 rounded-full border border-white/10"/><div className="absolute -right-8 -top-8 size-32 rounded-full border border-orange-400/25"/><span className="relative font-display text-sm font-black text-orange-400">02 / TẦM NHÌN</span><h3 className="relative mt-7 font-display text-3xl font-bold sm:text-4xl">Trở thành lựa chọn<br/>đáng tin cậy.</h3><p className="relative mt-5 text-lg leading-8 text-emerald-50/68">Trở thành thương hiệu đáng tin cậy trong lĩnh vực cơ khí công nghiệp tại Việt Nam, được lựa chọn nhờ năng lực kỹ thuật, quy trình chuyên nghiệp và tinh thần đổi mới liên tục.</p><div className="relative mt-8 h-1 w-16 rounded-full bg-orange-500"/></article></FadeContent>
      </div>
    </div></section>

    <section className="relative overflow-hidden bg-[#071f19] py-16 text-white sm:py-20 lg:py-24"><div className="absolute inset-0 opacity-[.055] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px]"/><div className="container-page relative grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-400">Năng lực của chúng tôi</p><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Một đầu mối.<br/><span className="text-orange-400">Trọn giải pháp.</span></h2><p className="mt-6 max-w-md text-lg leading-8 text-emerald-50/65">Từ tư vấn ban đầu đến vận hành, đội ngũ Đăng Khoa luôn bám sát mục tiêu và hiệu quả của khách hàng.</p><div className="mt-8 overflow-hidden rounded-3xl border border-white/10"><img className="aspect-[16/9] w-full object-cover opacity-80" src="/images/heroes/about-hero.jpg" alt="Năng lực kỹ thuật tại xưởng" loading="lazy"/></div></div>
      <div className="grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2">{capabilities.map(({icon: Icon, number, title, text}, index) => <FadeContent delay={index * .06} key={title}><article className="group h-full bg-[#0a2a22] p-7 transition hover:bg-[#0d3329] sm:p-8 lg:min-h-[285px]"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-white/[.07] text-orange-400 transition group-hover:bg-orange-500 group-hover:text-white"><Icon className="size-6"/></span><span className="font-display text-sm font-black text-white/30">{number}</span></div><h3 className="mt-8 font-display text-2xl font-bold">{title}</h3><p className="mt-4 leading-7 text-emerald-50/58">{text}</p></article></FadeContent>)}</div>
    </div></section>

    <section className="bg-white py-16 sm:py-20 lg:py-24"><div className="container-page"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Kim chỉ nam</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-emerald-950 sm:text-5xl">Giá trị tạo nên cách chúng tôi làm việc.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Ba nguyên tắc đơn giản được duy trì từ lần trao đổi đầu tiên đến khi công trình đi vào vận hành.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{values.map(({icon: Icon, title, text}, index) => <FadeContent delay={index * .07} key={title}><article className="group relative h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[#f8f9f7] p-7 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_55px_rgba(2,44,34,.09)] sm:p-8"><span className="absolute right-6 top-5 font-display text-5xl font-bold text-emerald-950/[.05]">0{index + 1}</span><Icon className="size-9 text-orange-600"/><h3 className="mt-10 font-display text-2xl font-bold text-emerald-950">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article></FadeContent>)}</div></div></section>

    <section className="bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page"><FadeContent><article className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(2,44,34,.09)] lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative min-h-[420px] bg-emerald-950 lg:min-h-[590px]">{ceoImage ? <img className="absolute inset-0 size-full object-cover object-top" src={ceoImage} alt="Người sáng lập Cơ khí Đăng Khoa"/> : <div className="grid h-full min-h-[420px] place-items-center p-10 text-center text-emerald-50/55"><div><Users className="mx-auto size-16"/><p className="mt-4 text-sm">Ảnh người sáng lập đang được cập nhật</p></div></div>}<div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Lãnh đạo bằng trách nhiệm</p></div></div>
      <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><span className="grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Lightbulb className="size-7"/></span><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-orange-600">CEO & Founder</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">Người dẫn đường cho một chuẩn mực làm việc bền vững.</h2><p className="mt-6 text-lg leading-8 text-slate-600">Dẫn dắt công ty với định hướng lấy chất lượng kỹ thuật, sự minh bạch và hiệu quả thực tế làm nền tảng cho mọi mối quan hệ hợp tác.</p><ul className="mt-8 space-y-3 border-t border-slate-200 pt-7">{["Chất lượng kỹ thuật làm nền tảng", "Minh bạch trong mọi cam kết", "Hiệu quả thực tế làm thước đo"].map(item => <li className="flex items-center gap-3 font-semibold text-slate-700" key={item}><CheckCircle2 className="size-5 text-emerald-700"/>{item}</li>)}</ul></div>
    </article></FadeContent></div></section>

    <section className="relative overflow-hidden bg-orange-600 py-14 text-white sm:py-16"><div className="absolute -right-20 -top-40 size-96 rounded-full border border-white/20"/><div className="container-page relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-100">Bắt đầu một công trình mới</p><h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Cùng chúng tôi biến yêu cầu kỹ thuật thành kết quả thực tế.</h2></div><Button asChild size="lg" className="shrink-0 bg-emerald-950 text-white hover:bg-emerald-900"><Link to="/lien-he">Liên hệ tư vấn<ArrowRight className="size-5"/></Link></Button></div></section>
  </>
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return <div><strong className="font-display text-3xl font-bold">{value}</strong><span className="mt-1 block text-xs font-bold uppercase tracking-wider text-emerald-100/45">{label}</span></div>
}
