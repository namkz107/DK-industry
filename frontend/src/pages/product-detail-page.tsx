import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, LoaderCircle, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom"
import type { LayoutContext } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { usePageMeta } from "@/hooks/use-page-meta"
import { api } from "@/lib/api"
import { customerClient } from "@/lib/customer-client"
import { cn, formatPrice } from "@/lib/utils"

export function ProductDetailPage() {
  const { slug = "" } = useParams()
  const { user } = useAuth()
  const { openQuote, canRequestQuote } = useOutletContext<LayoutContext>()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [imageIndex, setImageIndex] = useState(0)
  const query = useQuery({ queryKey: ["product", slug], queryFn: () => api.product(slug), enabled: Boolean(slug), retry: 1 })
  useEffect(() => { setImageIndex(0) }, [slug])
  const product = query.data?.data
  usePageMeta(product?.name || "Chi tiết sản phẩm", product?.description || "Thông tin kỹ thuật sản phẩm công nghiệp.")
  const add = useMutation({ mutationFn: () => customerClient.addCartItem(product!._id), onSuccess: () => { void client.invalidateQueries({ queryKey: ["customer", "cart"] }); navigate("/gio-hang") } })
  const orderable = Boolean(product?.price && !product.priceOnRequest && product.stock && product.stock > 0)
  const requestQuote = () => user?.role === "customer" ? navigate(`/tai-khoan/yeu-cau?productId=${product?._id}&product=${encodeURIComponent(product?.name || "")}`) : openQuote(product?.name)
  const addToCart = () => { if (!user) navigate("/dang-nhap", { state: { from: `/san-pham/${slug}` } }); else if (user.role === "customer") add.mutate() }

  if (query.isLoading) return <div className="section-space container-page" role="status"><p className="rounded-card border border-slate-200 bg-white p-8 text-center font-semibold text-slate-600">Đang tải sản phẩm...</p></div>
  if (query.error || !product) return <div className="section-space container-page"><div className="rounded-card border border-slate-200 bg-white p-10 text-center"><h1 className="page-title text-3xl text-emerald-950">Không tìm thấy sản phẩm</h1><p className="mt-3 text-slate-600">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không còn đúng.</p><Button asChild className="mt-6"><Link to="/san-pham"><ArrowLeft className="size-4"/>Về danh mục</Link></Button></div></div>

  const images = [product.image, ...(product.images || [])].filter(Boolean).filter((value, index, list) => list.indexOf(value) === index)
  const activeIndex = Math.min(imageIndex, Math.max(images.length - 1, 0))
  const activeImage = images[activeIndex]
  const specifications = Object.entries(product.specifications || {})
  return <div className="section-space bg-stone-50">
    <div className="container-page">
      <Link className="inline-flex min-h-11 items-center gap-2 font-semibold text-emerald-800" to="/san-pham"><ArrowLeft className="size-4"/>Danh mục sản phẩm</Link>
      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-12">
        <div>
          <div className="aspect-[4/3] overflow-hidden rounded-card border border-slate-200 bg-slate-100">{activeImage && <img className="size-full object-cover" src={activeImage} alt={product.name}/>}</div>
          {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">{images.map((image, index) => <button type="button" key={image} className={cn("aspect-square overflow-hidden rounded-control border bg-white", index === activeIndex ? "border-orange-600" : "border-slate-200")} aria-label={`Ảnh ${index + 1} của ${product.name}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => setImageIndex(index)}><img className="size-full object-cover" src={image} alt="" loading="lazy"/></button>)}</div>}
        </div>
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-orange-700">{product.category}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">{product.name}</h1>
          {product.sku && <p className="mt-2 font-mono text-sm text-slate-500">Mã: {product.sku}</p>}
          <p className="mt-5 font-display text-2xl font-bold text-orange-700">{formatPrice(product.price)}{product.price ? <span className="text-base font-semibold text-slate-500"> / {product.unit}</span> : null}</p>
          {product.description && <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">{product.description}</p>}
          {orderable ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="size-5 text-emerald-700"/>Có thể đặt: {product.stock} {product.unit}</p> : <p className="mt-4 text-sm font-semibold text-slate-700">Báo giá theo cấu hình và số lượng thực tế.</p>}
          {canRequestQuote && <div className="mt-6 flex flex-wrap gap-3">{orderable ? <Button size="lg" disabled={add.isPending} onClick={addToCart}>{add.isPending ? <LoaderCircle className="size-5 animate-spin"/> : <ShoppingCart className="size-5"/>}{add.isPending ? "Đang thêm..." : "Thêm vào giỏ"}</Button> : <Button size="lg" onClick={requestQuote}>Yêu cầu báo giá</Button>}</div>}
          {add.error && <p role="alert" className="mt-4 rounded-control bg-red-50 p-3 text-sm font-semibold text-red-700">{add.error.message}</p>}
        </div>
      </div>
      {specifications.length > 0 && <section className="mt-10 border-t border-slate-200 pt-8">
        <h2 className="font-display text-2xl font-bold text-emerald-950">Thông số kỹ thuật</h2>
        <dl className="mt-4 border-y border-slate-200">{specifications.map(([key, value]) => <div className="grid gap-1 border-b border-slate-200 py-3 last:border-b-0 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-baseline sm:gap-6" key={key}><dt className="text-sm font-semibold text-slate-500">{key}</dt><dd className="text-base text-slate-900">{value}</dd></div>)}</dl>
      </section>}
    </div>
  </div>
}
