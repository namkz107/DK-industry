import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, BadgeCheck, Boxes, LoaderCircle, PackageSearch, Search, ShoppingCart, Sparkles, X } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useNavigate, useOutletContext } from "react-router-dom"
import type { LayoutContext } from "@/components/app-layout"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/contexts/auth-context"
import { usePageMeta } from "@/hooks/use-page-meta"
import { api } from "@/lib/api"
import { customerClient } from "@/lib/customer-client"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/types"

const productsPerPage = 9

export function ProductsPage() {
  usePageMeta("Sản phẩm công nghiệp", "Bọc bảo ôn, nhà để xe, cover máy, bàn thao tác, băng tải, chi tiết phay tiện, vỏ tủ điện và tủ locker inox, gia công theo yêu cầu.")
  const { openQuote, canRequestQuote } = useOutletContext<LayoutContext>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Tất cả")
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ["products"], queryFn: api.products, staleTime: 5 * 60_000, retry: 1 })
  const products = useMemo(() => query.data?.data || [], [query.data?.data])
  const categories = useMemo(() => ["Tất cả", ...new Set(products.map(item => item.category))], [products])
  const filtered = useMemo(() => products.filter(item => (category === "Tất cả" || item.category === category) && `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [products, search, category])
  const pages = Math.max(1, Math.ceil(filtered.length / productsPerPage))
  const activePage = Math.min(page, pages)
  const visibleProducts = filtered.slice((activePage - 1) * productsPerPage, activePage * productsPerPage)
  const add = useMutation({
    mutationFn: (product: Product) => customerClient.addCartItem(product._id),
    onSuccess: (_, product) => {
      toast.success(`Đã thêm “${product.name}” vào giỏ hàng.`, { action: { label: "Xem giỏ hàng", onClick: () => navigate("/gio-hang") } })
      void queryClient.invalidateQueries({ queryKey: ["customer", "cart"] })
      void queryClient.invalidateQueries({ queryKey: ["customer", "summary"] })
    },
    onError: error => toast.error(error.message, { title: "Không thể thêm vào giỏ" }),
  })

  const addToCart = (product: Product) => {
    if (!user) { navigate("/dang-nhap", { state: { from: "/san-pham" } }); return }
    if (user.role !== "customer") return
    add.mutate(product)
  }
  const requestQuote = (product: Product) => {
    if (user?.role === "customer") navigate(`/tai-khoan/yeu-cau?productId=${product._id}&product=${encodeURIComponent(product.name)}`)
    else openQuote(product.name)
  }

  const clearFilters = () => { setSearch(""); setCategory("Tất cả"); setPage(1) }
  const hasFilters = Boolean(search || category !== "Tất cả")

  return <>
    <section className="relative isolate overflow-hidden bg-[#061d17] text-white">
      <div className="container-page relative grid min-h-[610px] items-start gap-12 pb-24 pt-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:py-24">
        <div className="relative z-10"><div className="eyebrow-pill"><Sparkles className="size-4"/>Thiết bị & vật tư công nghiệp</div><h1 className="heading-hero mt-7 max-w-3xl">Sản phẩm phù&nbsp;hợp với <span className="text-orange-400">từng nhu&nbsp;cầu vận&nbsp;hành.</span></h1><p className="mt-7 max-w-2xl text-lg leading-8 text-emerald-50/70">Các sản phẩm được gia công và lắp đặt theo kích thước, vật liệu và số lượng thực tế. Mỗi hạng mục đều nhận báo giá sau khi làm rõ yêu cầu.</p><div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg"><a href="#danh-muc-san-pham">Khám phá sản phẩm<ArrowRight className="size-5"/></a></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 hover:text-white"><Link to="/lien-he">Trao đổi nhu cầu</Link></Button></div><div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/10 pt-7"><HeroFact value={products.length || "—"} label="Sản phẩm công bố"/><HeroFact value={Math.max(0, categories.length - 1) || "—"} label="Nhóm sản phẩm"/><HeroFact value="Báo giá" label="Theo yêu cầu thực tế"/></div></div>
        <div className="relative hidden min-h-[470px] lg:block"><div className="hero-frame absolute inset-y-3 right-0 w-[89%]"><img className="size-full object-cover" src="/images/heroes/products-hero.jpg" alt="Thiết bị và sản phẩm cơ khí công nghiệp" fetchPriority="high"/><div className="absolute inset-0 bg-gradient-to-t from-[#061d17]/90 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-8"><span className="grid size-12 place-items-center rounded-2xl bg-orange-600"><Boxes className="size-6"/></span><p className="mt-5 max-w-sm font-display text-2xl font-bold">Sẵn sàng cung ứng. Linh hoạt chế tạo theo yêu cầu.</p></div></div><div className="hero-note absolute left-0 top-10 p-5"><BadgeCheck className="size-6 text-orange-400"/><p className="mt-3 text-sm font-bold">Báo giá theo cấu hình thực tế</p></div></div>
      </div>
    </section>

    <section id="danh-muc-san-pham" className="scroll-mt-24 bg-[#f4f5f2] py-16 sm:py-20 lg:py-24"><div className="container-page">
      <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Danh mục sản phẩm</p><h2 className="heading-section mt-3">Tìm đúng thiết bị cho công việc.</h2></div><p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">Tìm theo tên hoặc chọn nhóm sản phẩm. Mỗi hạng mục có mô tả, đơn vị tính và cách gửi yêu cầu báo giá.</p></div>

      <div className="mt-10 grid gap-4 md:grid-cols-[minmax(0,1fr)_290px] md:items-end">
        <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">Tìm kiếm sản phẩm</span><span className="relative block"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-emerald-800"/><Input className="min-h-14 pl-12 pr-11" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Nhập tên sản phẩm hoặc nhóm thiết bị..."/>{search && <button type="button" className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => { setSearch(""); setPage(1) }} aria-label="Xóa từ khóa"><X className="size-4"/></button>}</span></label>
        <div><span className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-slate-500">Nhóm sản phẩm</span><Select className="[&>button]:min-h-14" ariaLabel="Chọn nhóm sản phẩm" value={category} onChange={value => { setCategory(value); setPage(1) }} options={categories.map(item => ({ value: item, label: item === "Tất cả" ? "Tất cả nhóm sản phẩm" : item }))}/></div>
      </div>

      {query.error && <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700"><p className="font-semibold">Không thể tải danh mục sản phẩm. Vui lòng thử lại hoặc liên hệ hotline.</p><button className="shrink-0 text-sm font-black underline underline-offset-4" onClick={() => void query.refetch()}>Thử lại</button></div>}
      <div className="mb-7 mt-8 flex items-center justify-between gap-4"><p className="text-sm font-semibold text-slate-500">Tìm thấy <strong className="font-display text-xl text-emerald-950">{filtered.length}</strong> sản phẩm{filtered.length > productsPerPage && <span> · Trang {activePage}/{pages}</span>}</p>{hasFilters && <button type="button" className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 transition hover:text-orange-800" onClick={clearFilters}>Xóa bộ lọc<X className="size-4"/></button>}</div>
      {query.isLoading ? <ProductsSkeleton/> : filtered.length ? <><div className="reveal-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleProducts.map(product => {
        const orderable = Boolean(product.price && !product.priceOnRequest && product.stock && product.stock > 0)
        const addingThisProduct = add.isPending && add.variables?._id === product._id
        return <article className="motion-card group overflow-hidden rounded-card border border-slate-200 bg-white" key={product._id}>
          <Link className="block aspect-[4/3] bg-slate-100" to={`/san-pham/${product.slug}`}>{product.image && <img loading="lazy" className="size-full object-cover" src={product.image} alt={product.name}/>}</Link>
          <div className="p-6"><span className="text-xs font-bold uppercase tracking-wider text-orange-700">{product.category}</span><h2 className="mt-2 font-display text-xl font-bold text-emerald-950"><Link className="hover:text-orange-700" to={`/san-pham/${product.slug}`}>{product.name}</Link></h2><p className="mt-3 font-bold text-orange-700">{formatPrice(product.price)} {product.price ? `/ ${product.unit}` : ""}</p>{orderable && <p className="mt-1 text-xs text-slate-500">Còn {product.stock} {product.unit}</p>}
            <div className="mt-6 grid gap-2"><Button asChild variant="outline"><Link to={`/san-pham/${product.slug}`}>Xem chi tiết</Link></Button>{canRequestQuote && (orderable ? <Button disabled={add.isPending} onClick={() => addToCart(product)}>{addingThisProduct ? <LoaderCircle className="size-4 animate-spin"/> : <ShoppingCart className="size-4"/>}{addingThisProduct ? "Đang thêm..." : "Thêm vào giỏ"}</Button> : <Button onClick={() => requestQuote(product)}>Yêu cầu báo giá <ArrowRight className="size-4"/></Button>)}</div>
          </div>
        </article>
      })}</div><Pagination page={activePage} pages={pages} onChange={nextPage => { setPage(nextPage); document.getElementById("danh-muc-san-pham")?.scrollIntoView({ behavior: "smooth", block: "start" }) }}/></> : <div className="rounded-panel border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100"><PackageSearch className="size-8 text-slate-400"/></span><h2 className="mt-5 font-display text-2xl font-bold text-emerald-950">{query.error ? "Không thể tải sản phẩm" : "Không tìm thấy sản phẩm phù hợp"}</h2><p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">{query.error ? "Vui lòng tải lại trang sau ít phút." : "Thử một từ khóa ngắn hơn hoặc quay lại xem toàn bộ danh mục."}</p>{hasFilters && <Button className="mt-6" variant="outline" onClick={clearFilters}>Xem tất cả sản phẩm</Button>}</div>}

      <div className="mt-16 overflow-hidden rounded-panel bg-emerald-950 text-white lg:grid lg:grid-cols-[1fr_auto] lg:items-center"><div className="p-7 sm:p-10 lg:p-12"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">Chưa thấy sản phẩm phù hợp?</p><h2 className="heading-section mt-3 max-w-2xl text-white">Chúng tôi có thể chế tạo theo kích thước và yêu cầu riêng.</h2><p className="mt-4 max-w-xl leading-7 text-emerald-50/65">Gửi bản vẽ, thông số hoặc mô tả nhu cầu để đội ngũ kỹ thuật cùng bạn làm rõ phương án.</p></div><div className="border-t border-white/10 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">{canRequestQuote ? <Button size="lg" onClick={() => openQuote("Sản phẩm chế tạo theo yêu cầu")}>Yêu cầu tư vấn<ArrowRight className="size-5"/></Button> : <Button asChild size="lg"><Link to="/lien-he">Liên hệ kỹ thuật<ArrowRight className="size-5"/></Link></Button>}</div></div>
    </div></section>
  </>
}

function HeroFact({ value, label }: { value: string | number; label: string }) {
  return <div><strong className="font-display text-3xl font-bold">{value}</strong><span className="mt-1 block text-xs font-bold uppercase tracking-wider text-emerald-100/45">{label}</span></div>
}

function ProductsSkeleton() {
  return <div className="grid animate-pulse gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="overflow-hidden rounded-card border border-slate-200 bg-white" key={index}><div className="aspect-[4/3] bg-slate-200"/><div className="space-y-4 p-6"><div className="h-3 w-24 rounded bg-orange-100"/><div className="h-7 w-4/5 rounded bg-slate-200"/><div className="h-5 w-1/3 rounded bg-slate-100"/><div className="mt-6 h-24 rounded-xl bg-slate-100"/></div></div>)}</div>
}
