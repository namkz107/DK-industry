import { useQuery } from "@tanstack/react-query"
import { ArrowRight, BadgeCheck, CheckCircle2, DraftingCompass, Handshake, Lightbulb, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { FadeContent } from "@/components/react-bits/fade-content"
import { Button } from "@/components/ui/button"
import { defaultOrgUnits, orgTierLabels } from "@/content/site-content"
import { usePageMeta } from "@/hooks/use-page-meta"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { OrgUnit } from "@/types/admin"

const capabilities = [
  { icon: DraftingCompass, number: "01", title: "Đường ống nhà máy", text: "Gia công, lắp đặt ống khí nén, ống nhiệt, ống nước, ống inox và ống thép mạ kẽm." },
  { icon: Users, number: "02", title: "Ống gió và bảo ôn", text: "Chế tạo ống gió, lắp đặt và bọc bảo ôn cho Chiller, AHU và FCU." },
  { icon: Handshake, number: "03", title: "Hook-up cơ điện", text: "Thi công điện, ống gió, ống khí, sàn nâng và sàn thao tác cho dây chuyền." },
  { icon: ShieldCheck, number: "04", title: "Thi công và bảo dưỡng", text: "Thi công, cải tạo và bảo dưỡng công trình công nghiệp, hỗ trợ kỹ thuật 24/24." },
]

const values = [
  { icon: DraftingCompass, title: "Kỹ thuật", text: "Phương án và tay nghề được kiểm tra theo yêu cầu của từng hạng mục." },
  { icon: BadgeCheck, title: "Kế hoạch", text: "Công việc được triển khai theo kế hoạch đã thống nhất với chủ đầu tư." },
  { icon: ShieldCheck, title: "An toàn", text: "Nhân sự có chứng chỉ an toàn lao động và làm việc trên cao." },
  { icon: TrendingUp, title: "Chi phí", text: "Phạm vi việc và chi phí được làm rõ trước khi thi công." },
]

export function AboutPage() {
  usePageMeta("Giới thiệu", "Năng lực cơ điện, cơ cấu tổ chức và cách Cơ khí Đăng Khoa triển khai công trình.")
  const aboutSettings = useQuery({ queryKey: ["site-settings", "about"], queryFn: api.aboutSettings, staleTime: 60_000 })
  const ceoImage = aboutSettings.data?.data.leaderImage ?? import.meta.env.VITE_CLOUDINARY_CEO_IMAGE_URL
  const orgUnits = aboutSettings.data?.data.orgUnits ?? defaultOrgUnits

  return <>
    <section className="relative isolate overflow-hidden bg-[#061d17] text-white">
      <img className="absolute inset-0 -z-20 size-full object-cover object-[62%_center]" src="/images/heroes/about-hero.jpg" alt="Đội ngũ kỹ thuật trao đổi bản vẽ tại xưởng" fetchPriority="high"/>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,27,22,.99)_0%,rgba(3,27,22,.94)_42%,rgba(3,27,22,.48)_72%,rgba(3,27,22,.18)_100%)]"/>
      <div className="container-page relative flex min-h-[650px] items-start pb-24 pt-10 lg:items-center lg:py-24"><div className="max-w-[770px]">
        <div className="eyebrow-pill"><Sparkles className="size-4"/>Về Cơ khí Đăng Khoa</div>
        <h1 className="heading-hero mt-7">Kỹ thuật vững vàng.<br/><span className="text-orange-400">Đồng hành dài lâu.</span></h1>
        <p className="mt-7 max-w-2xl text-base leading-8 text-emerald-50/72 sm:text-lg">CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA hoạt động trong ngành cơ điện và xây dựng từ năm 2014, với vốn điều lệ 3 tỷ đồng và mã số thuế 0106426038.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/du-an">Xem dự án đã thực hiện<ArrowRight className="size-5"/></Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"><Link to="/lien-he">Trao đổi cùng chúng tôi</Link></Button></div>
        <div className="mt-11 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/10 pt-7"><HeroFact value="2014" label="Năm thành lập"/><HeroFact value="38" label="Nhân sự"/><HeroFact value="9" label="Kỹ sư"/></div>
      </div></div>
    </section>

    <section className="bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page">
      <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Nền tảng phát triển</p><h2 className="heading-section mt-3">Điều chúng tôi theo đuổi trong mỗi công trình.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Không chỉ hoàn thành một hạng mục, chúng tôi hướng đến một giải pháp phù hợp thực tế, vận hành ổn định và tạo giá trị lâu dài cho khách hàng.</p></div>
      <div className="mt-12 grid overflow-hidden rounded-panel border border-slate-200 bg-white lg:grid-cols-2">
        <FadeContent><article className="h-full p-7 sm:p-10 lg:p-12"><span className="font-display text-sm font-black text-orange-600">01 / SỨ MỆNH</span><h3 className="mt-7 font-display text-3xl font-bold text-emerald-950 sm:text-4xl">Giải pháp thiết thực,<br/>hiệu quả có thể đo lường.</h3><p className="mt-5 text-lg leading-8 text-slate-600">Mang đến dịch vụ gia công, lắp đặt đường ống, hệ thống làm lạnh, sản phẩm cơ khí và thi công, bảo dưỡng công trình công nghiệp. Sự hài lòng của khách hàng là mục tiêu của từng hạng mục.</p><div className="mt-8 h-1 w-16 rounded-full bg-orange-500"/></article></FadeContent>
        <FadeContent delay={.08}><article className="relative h-full overflow-hidden bg-emerald-950 p-7 text-white sm:p-10 lg:p-12"><span className="relative font-display text-sm font-black text-orange-400">02 / TẦM NHÌN</span><h3 className="relative mt-7 font-display text-3xl font-bold sm:text-4xl">Trở thành lựa chọn<br/>đáng tin cậy.</h3><p className="relative mt-5 text-lg leading-8 text-emerald-50/68">Trở thành thương hiệu đáng tin cậy trong lĩnh vực cơ khí công nghiệp tại Việt Nam, được lựa chọn nhờ năng lực kỹ thuật, quy trình chuyên nghiệp và tinh thần đổi mới liên tục.</p><div className="relative mt-8 h-1 w-16 rounded-full bg-orange-500"/></article></FadeContent>
      </div>
    </div></section>

    <section className="relative overflow-hidden bg-[#071f19] py-16 text-white sm:py-20 lg:py-24"><div className="container-page relative grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-400">Năng lực của chúng tôi</p><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Một đầu mối.<br/><span className="text-orange-400">Trọn giải pháp.</span></h2><p className="mt-6 max-w-md text-lg leading-8 text-emerald-50/65">Từ phương án thi công đến nghiệm thu, đội ngũ Đăng Khoa bám sát chất lượng, tiến độ và an toàn.</p><div className="mt-8 overflow-hidden rounded-panel border border-white/10"><img className="aspect-[16/9] w-full object-cover opacity-80" src="/images/heroes/about-hero.jpg" alt="Năng lực kỹ thuật tại xưởng" loading="lazy"/></div></div>
      <div className="grid gap-px overflow-hidden rounded-panel border border-white/10 bg-white/10 sm:grid-cols-2">{capabilities.map(({icon: Icon, number, title, text}, index) => <FadeContent delay={index * .06} key={title}><article className="group h-full bg-[#0a2a22] p-7 transition hover:bg-[#0d3329] sm:p-8 lg:min-h-[285px]"><div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-white/[.07] text-orange-400 transition group-hover:bg-orange-500 group-hover:text-white"><Icon className="size-6"/></span><span className="font-display text-sm font-black text-white/30">{number}</span></div><h3 className="mt-8 font-display text-2xl font-bold">{title}</h3><p className="mt-4 leading-7 text-emerald-50/58">{text}</p></article></FadeContent>)}</div>
    </div></section>

    <section className="bg-white py-16 sm:py-20 lg:py-24"><div className="container-page"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Kim chỉ nam</p><h2 className="heading-section mt-3">Giá trị tạo nên cách chúng tôi làm việc.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Chất lượng của mỗi công trình được nhìn bằng bốn yếu tố: kỹ thuật, kế hoạch, an toàn và chi phí.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{values.map(({icon: Icon, title, text}, index) => <FadeContent delay={index * .07} key={title}><article className="group relative h-full overflow-hidden rounded-card border border-slate-200 bg-[#f8f9f7] p-7 transition hover:border-emerald-300 sm:p-8"><span className="absolute right-6 top-5 font-display text-5xl font-bold text-emerald-950/[.05]">0{index + 1}</span><Icon className="size-9 text-orange-600"/><h3 className="mt-10 font-display text-2xl font-bold text-emerald-950">{title}</h3><p className="mt-3 leading-7 text-slate-600">{text}</p></article></FadeContent>)}</div></div></section>

    <section className="bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page"><div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Cơ cấu tổ chức</p><h2 className="heading-section mt-3">Mỗi phòng ban phụ trách một phần của công trình.</h2><p className="mt-5 text-lg leading-8 text-slate-600">Công ty hoạt động theo điều lệ và pháp luật. Hội đồng cổ đông là cơ quan quyền lực cao nhất. Giám đốc điều hành hoạt động hằng ngày, rồi giao việc cho các phòng ban và xí nghiệp.</p></div><OrgChart units={orgUnits}/></div></section>

    <section className="bg-white py-16 sm:py-20 lg:py-24"><div className="container-page"><FadeContent><article className="grid overflow-hidden rounded-panel border border-slate-200 bg-white lg:grid-cols-[.9fr_1.1fr]">
      <div className="relative min-h-[420px] bg-emerald-950 lg:min-h-[590px]">{ceoImage ? <img className="absolute inset-0 size-full object-cover object-top" src={ceoImage} alt="Giám đốc Cơ khí Đăng Khoa"/> : <div className="grid h-full min-h-[420px] place-items-center p-10 text-center text-emerald-50/55"><div><Users className="mx-auto size-16"/><p className="mt-4 text-sm">Ảnh giám đốc đang được cập nhật</p></div></div>}<div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Lãnh đạo bằng trách nhiệm</p></div></div>
      <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><span className="grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Lightbulb className="size-7"/></span><p className="mt-8 text-xs font-black uppercase tracking-[.2em] text-orange-600">Giám đốc</p><h2 className="heading-section mt-3">Nguyễn Đức Khương</h2><p className="mt-6 text-lg leading-8 text-slate-600">Đại diện điều hành công ty. Mỗi công trình được nhìn theo bốn yếu tố đã cam kết: kỹ thuật, kế hoạch, an toàn và chi phí.</p><ul className="mt-8 space-y-3 border-t border-slate-200 pt-7">{["Điều hành hoạt động hằng ngày", "Chịu trách nhiệm trước hội đồng quản trị", "38 nhân sự, trong đó 1 thạc sĩ và 9 kỹ sư"].map(item => <li className="flex items-center gap-3 font-semibold text-slate-700" key={item}><CheckCircle2 className="size-5 text-emerald-700"/>{item}</li>)}</ul></div>
    </article></FadeContent></div></section>

    <section className="bg-orange-600 py-14 text-white sm:py-16"><div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-100">Bắt đầu một công trình mới</p><h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Cùng chúng tôi biến yêu cầu kỹ thuật thành kết quả thực tế.</h2></div><Button asChild size="lg" className="shrink-0 bg-emerald-950 text-white hover:bg-emerald-900"><Link to="/lien-he">Liên hệ tư vấn<ArrowRight className="size-5"/></Link></Button></div></section>
  </>
}

function OrgChart({ units }: { units: OrgUnit[] }) {
  const rows = [1, 2, 3, 4].map(tier => ({ tier, units: units.filter(unit => unit.tier === tier) })).filter(row => row.units.length > 0)
  return <div className="mx-auto mt-12 max-w-5xl">{rows.map((row, index) => <div key={row.tier}>{index > 0 && <div className="mx-auto h-10 w-px bg-emerald-800/25" aria-hidden="true"/>}<p className="mb-3 text-center text-xs font-black uppercase tracking-[.18em] text-emerald-800/45">{orgTierLabels[row.tier]}</p><div className={cn("grid gap-3", row.units.length === 1 && "mx-auto max-w-sm", row.units.length === 2 && "mx-auto max-w-3xl sm:grid-cols-2", row.units.length > 2 && "sm:grid-cols-2 lg:grid-cols-3")}>{row.units.map((unit, unitIndex) => <article className="rounded-2xl border border-emerald-900/10 bg-white px-5 py-4 text-center shadow-[0_16px_40px_-28px_rgba(6,78,59,.85)]" key={`${unit.name}-${unitIndex}`}><h3 className="font-display text-lg font-bold text-emerald-950">{unit.name}</h3>{unit.note && <p className="mt-1 text-sm leading-6 text-slate-500">{unit.note}</p>}</article>)}</div></div>)}</div>
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return <div><strong className="font-display text-3xl font-bold">{value}</strong><span className="mt-1 block text-xs font-bold uppercase tracking-wider text-emerald-100/45">{label}</span></div>
}
