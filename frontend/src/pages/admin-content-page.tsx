import { zodResolver } from "@hookform/resolvers/zod"
import * as Dialog from "@radix-ui/react-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Archive, Boxes, FolderKanban, LoaderCircle, Pencil, Plus, Search, Wrench, X } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { useForm, type UseFormRegisterReturn } from "react-hook-form"
import { useSearchParams } from "react-router-dom"
import { z } from "zod"
import { AdminShell } from "@/components/admin/admin-shell"
import { ImageUpload } from "@/components/admin/image-upload"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { IntegerInput, MoneyInput } from "@/components/ui/numeric-input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import { formatGroupedNumber, parseNumericInput } from "@/lib/numeric"
import { cn, formatPrice } from "@/lib/utils"
import type { AdminProduct, AdminProject, AdminService } from "@/types/admin"

type Kind = "products" | "services" | "projects"
type ContentItem = AdminProduct | AdminService | AdminProject
const schema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự"), slug: z.string(), category: z.string(), summary: z.string(), description: z.string(), sku: z.string(), price: z.string(), stock: z.string(), unit: z.string(), client: z.string(), location: z.string(), year: z.string(), image: z.string(), details: z.string(), materials: z.string(), applications: z.string(), extraImages: z.string(), challenge: z.string(), solution: z.string(), order: z.string(), featured: z.boolean(), visible: z.boolean(), priceOnRequest: z.boolean(),
})
type Values = z.infer<typeof schema>
const defaults: Values = { name: "", slug: "", category: "", summary: "", description: "", sku: "", price: "0", stock: "0", unit: "sản phẩm", client: "", location: "", year: String(new Date().getFullYear()), image: "", details: "", materials: "", applications: "", extraImages: "", challenge: "", solution: "", order: "0", featured: false, visible: true, priceOnRequest: false }
const tabs: Array<{ key: Kind; label: string; icon: typeof Boxes }> = [{ key: "products", label: "Sản phẩm", icon: Boxes }, { key: "services", label: "Dịch vụ", icon: Wrench }, { key: "projects", label: "Dự án", icon: FolderKanban }]

export function AdminContentPage() {
  usePageMeta("Sản phẩm và nội dung", "Quản lý dữ liệu hiển thị trên website.")
  const [params, setParams] = useSearchParams(); const queryClient = useQueryClient(); const toast = useToast()
  const kind = (tabs.some(item => item.key === params.get("tab")) ? params.get("tab") : "products") as Kind
  const [filters, setFilters] = useState({ q: "", state: "" }); const [page, setPage] = useState(1); const [editing, setEditing] = useState<ContentItem | null>(null); const [showForm, setShowForm] = useState(false); const [imageUploading, setImageUploading] = useState(false)
  const [pendingHide, setPendingHide] = useState<ContentItem | null>(null)
  const products = useQuery({ queryKey: ["admin", "products", filters, page], queryFn: () => adminClient.products({ ...filters, page }), enabled: kind === "products" })
  const services = useQuery({ queryKey: ["admin", "services", filters, page], queryFn: () => adminClient.services({ ...filters, page }), enabled: kind === "services" })
  const projects = useQuery({ queryKey: ["admin", "projects", filters, page], queryFn: () => adminClient.projects({ ...filters, page }), enabled: kind === "projects" })
  const current = kind === "products" ? products : kind === "services" ? services : projects
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults })
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["admin", kind] }); void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }) }
  const save = useMutation<unknown, Error, { id?: string; body: Record<string, unknown> }>({ mutationFn: ({ id, body }) => {
    if (kind === "products") return id ? adminClient.updateProduct(id, body) : adminClient.createProduct(body)
    if (kind === "services") return id ? adminClient.updateService(id, body) : adminClient.createService(body)
    return id ? adminClient.updateProject(id, body) : adminClient.createProject(body)
  }, onSuccess: (_, variables) => { toast.success(variables.id ? "Đã cập nhật nội dung" : "Đã tạo nội dung mới"); refresh(); closeForm() } })
  const hide = useMutation<unknown, Error, string>({ mutationFn: (id) => kind === "products" ? adminClient.hideProduct(id) : kind === "services" ? adminClient.hideService(id) : adminClient.hideProject(id), onSuccess: () => { toast.success("Đã ẩn nội dung khỏi website"); setPendingHide(null); refresh() }, onError: error => toast.error(error.message, { title: "Không thể ẩn nội dung" }) })

  useEffect(() => { setEditing(null); setShowForm(false); setPage(1); form.reset(defaults) }, [kind, form])
  useEffect(() => setPage(1), [filters])
  const closeForm = () => { setEditing(null); setShowForm(false); form.reset(defaults) }
  const openCreate = () => { setEditing(null); form.reset(defaults); setShowForm(true) }
  const openEdit = (item: ContentItem) => {
    setEditing(item); setShowForm(true)
    if ("stock" in item) form.reset({ ...defaults, name: item.name, slug: item.slug, category: item.category, description: item.description || "", sku: item.sku || "", price: formatGroupedNumber(item.price || 0), stock: String(item.stock), unit: item.unit, image: item.image || "", details: Object.entries(item.specifications || {}).map(([key, value]) => `${key}: ${value}`).join("\n"), extraImages: (item.images || []).join("\n"), featured: item.featured, visible: item.active, priceOnRequest: item.priceOnRequest })
    else if ("summary" in item) form.reset({ ...defaults, name: item.name, slug: item.slug, summary: item.summary, description: item.description || "", image: item.image || "", details: item.capabilities.join("\n"), materials: item.materials.join("\n"), applications: item.applications.join("\n"), order: String(item.order), featured: item.featured, visible: item.published })
    else form.reset({ ...defaults, name: item.title, slug: item.slug, category: item.category, client: item.client || "", location: item.location || "", year: item.year || "", description: item.description || "", image: item.image || "", extraImages: (item.gallery || []).join("\n"), challenge: item.challenge || "", solution: item.solution || "", featured: item.featured, visible: item.published })
  }
  const submit = (values: Values) => {
    const lines = (value: string) => value.split(/\r?\n/).map(item => item.trim()).filter(Boolean)
    const common = { slug: values.slug, description: values.description, image: values.image, featured: values.featured }
    const specifications = Object.fromEntries(lines(values.details).map(line => { const separator = line.indexOf(":"); return separator > 0 ? [line.slice(0, separator).trim(), line.slice(separator + 1).trim()] : [line, ""] }))
    const body = kind === "products" ? { ...common, name: values.name, category: values.category, sku: values.sku, price: parseNumericInput(values.price), stock: parseNumericInput(values.stock), unit: values.unit, priceOnRequest: values.priceOnRequest, specifications, images: lines(values.extraImages), active: values.visible }
      : kind === "services" ? { ...common, name: values.name, summary: values.summary, capabilities: lines(values.details), materials: lines(values.materials), applications: lines(values.applications), order: parseNumericInput(values.order), published: values.visible }
      : { ...common, title: values.name, category: values.category, client: values.client, location: values.location, year: values.year, challenge: values.challenge, solution: values.solution, gallery: lines(values.extraImages), published: values.visible }
    save.mutate({ id: editing?._id, body })
  }

  return <AdminShell title="Sản phẩm và nội dung" description="Cập nhật dữ liệu hiển thị ngoài website; thao tác ẩn vẫn giữ lịch sử và liên kết cũ.">
    <div className="flex flex-col gap-3 rounded-2xl border bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto">{tabs.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => setParams({ tab: key })} className={cn("flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-5 font-bold", kind === key ? "bg-orange-600 text-white" : "text-slate-600 hover:bg-slate-100")}><Icon className="size-5"/>{label}</button>)}</div>
      <Button className="shrink-0" onClick={openCreate}><Plus className="size-5"/>Thêm {tabName(kind).toLowerCase()}</Button>
    </div>
    <Dialog.Root open={showForm} onOpenChange={open => { if (!open && !save.isPending && !imageUploading) closeForm() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-emerald-950/65 backdrop-blur-sm"/>
        <Dialog.Content aria-describedby="content-editor-description" className="fixed left-1/2 top-1/2 z-[111] w-[min(1100px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl outline-none">
          <form className="flex max-h-[calc(100dvh-24px)] min-h-0 flex-col" onSubmit={form.handleSubmit(submit)}>
            <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-5 pr-16 sm:px-7">
              <Dialog.Title className="font-display text-2xl font-bold text-emerald-950 sm:text-3xl">{editing ? "Chỉnh sửa" : "Thêm mới"} {tabName(kind).toLowerCase()}</Dialog.Title>
              <Dialog.Description id="content-editor-description" className="mt-2 text-sm leading-6 text-slate-500">Điền thông tin bên dưới rồi lưu để cập nhật nội dung hiển thị trên website.</Dialog.Description>
            </header>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label={kind === "projects" ? "Tên dự án" : "Tên"} error={form.formState.errors.name?.message}><Input {...form.register("name")}/></Field>{kind !== "services" && <Field label="Danh mục"><Input {...form.register("category")} placeholder="Gia công CNC"/></Field>}
                {kind === "products" && <><Field label="Mã SKU"><Input {...form.register("sku")}/></Field><Field label="Giá bán"><MoneyInput min="0" placeholder="1.000.000" {...form.register("price")}/></Field><Field label="Tồn kho"><IntegerInput min="0" {...form.register("stock")}/></Field><Field label="Đơn vị"><Input {...form.register("unit")}/></Field></>}
                {kind === "services" && <Field label="Mô tả ngắn"><Input {...form.register("summary")}/></Field>}
                {kind === "projects" && <><Field label="Khách hàng"><Input {...form.register("client")}/></Field><Field label="Địa điểm"><Input {...form.register("location")}/></Field><Field label="Năm"><IntegerInput min="1900" max={2200} {...form.register("year")}/></Field></>}
                <ImageUpload value={form.watch("image")} onBusyChange={setImageUploading} onChange={url => form.setValue("image", url, { shouldDirty: true, shouldValidate: true })}/><label className="md:col-span-2 xl:col-span-3 text-sm font-bold text-slate-700">Mô tả<Textarea className="mt-2 min-h-28" {...form.register("description")}/></label>
                {kind === "products" && <><label className="md:col-span-2 text-sm font-bold text-slate-700">Thông số kỹ thuật<Textarea className="mt-2 min-h-28" placeholder={'Mỗi dòng: Tên: Giá trị'} {...form.register("details")}/></label><label className="text-sm font-bold text-slate-700">Ảnh phụ<Textarea className="mt-2 min-h-28" placeholder="Mỗi dòng một URL ảnh" {...form.register("extraImages")}/></label></>}
                {kind === "services" && <><Field label="Thứ tự hiển thị"><IntegerInput min="0" {...form.register("order")}/></Field><label className="text-sm font-bold text-slate-700">Năng lực<Textarea className="mt-2 min-h-28" placeholder="Mỗi dòng một năng lực" {...form.register("details")}/></label><label className="text-sm font-bold text-slate-700">Vật liệu<Textarea className="mt-2 min-h-28" placeholder="Mỗi dòng một vật liệu" {...form.register("materials")}/></label><label className="text-sm font-bold text-slate-700">Ứng dụng<Textarea className="mt-2 min-h-28" placeholder="Mỗi dòng một ứng dụng" {...form.register("applications")}/></label></>}
                {kind === "projects" && <><label className="text-sm font-bold text-slate-700">Thách thức<Textarea className="mt-2 min-h-28" {...form.register("challenge")}/></label><label className="text-sm font-bold text-slate-700">Giải pháp<Textarea className="mt-2 min-h-28" {...form.register("solution")}/></label><label className="text-sm font-bold text-slate-700">Thư viện ảnh<Textarea className="mt-2 min-h-28" placeholder="Mỗi dòng một URL ảnh" {...form.register("extraImages")}/></label></>}
                <div className="flex flex-wrap items-center gap-5 md:col-span-2 xl:col-span-3"><Check register={form.register("featured")} label="Nổi bật"/><Check register={form.register("visible")} label={kind === "products" ? "Đang bán" : "Đang công khai"}/>{kind === "products" && <Check register={form.register("priceOnRequest")} label="Giá liên hệ"/>}</div>
              </div>
              {save.error && <ErrorText error={save.error as Error}/>}
            </div>
            <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <Button type="button" variant="outline" disabled={save.isPending || imageUploading} onClick={closeForm}>Hủy</Button>
              <Button disabled={save.isPending || imageUploading}>{(save.isPending || imageUploading) && <LoaderCircle className="size-4 animate-spin"/>}{imageUploading ? "Đang tải ảnh..." : save.isPending ? "Đang lưu..." : editing ? "Lưu thay đổi" : `Thêm ${tabName(kind).toLowerCase()}`}</Button>
            </footer>
          </form>
          <Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50" disabled={save.isPending || imageUploading} aria-label="Đóng biểu mẫu"><X className="size-5"/></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <div className="mt-5 grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_190px]"><label className="relative"><Search className="absolute left-3 top-3.5 size-5 text-slate-400"/><Input className="pl-10" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder={`Tìm ${tabName(kind).toLowerCase()}...`}/></label><Select ariaLabel="Lọc trạng thái hiển thị" value={filters.state} onChange={state => setFilters({ ...filters, state })} options={[{ value: "", label: "Tất cả trạng thái" }, { value: "published", label: "Đang hiển thị" }, { value: "hidden", label: "Đã ẩn" }]}/></div>
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{current.data?.data.items.map(item => <ContentCard key={item._id} item={item} onEdit={() => openEdit(item)} onHide={() => setPendingHide(item)}/>)}</div>{current.isLoading && <p className="mt-4 rounded-2xl bg-white p-8 text-center">Đang tải nội dung...</p>}{current.error && <ErrorText error={current.error}/>} {!current.isLoading && !current.data?.data.items.length && <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center"><p className="text-slate-500">Chưa có dữ liệu phù hợp.</p><Button className="mt-4" onClick={openCreate}><Plus className="size-5"/>Thêm {tabName(kind).toLowerCase()} đầu tiên</Button></div>}
    <Pagination page={current.data?.data.page || page} pages={current.data?.data.pages || 1} onChange={setPage}/>
    <ConfirmDialog open={Boolean(pendingHide)} title="Ẩn nội dung khỏi website?" description={pendingHide ? `“${"title" in pendingHide ? pendingHide.title : pendingHide.name}” sẽ không còn hiển thị công khai. Bạn vẫn có thể chỉnh sửa và bật hiển thị lại sau.` : ""} confirmLabel="Ẩn nội dung" destructive busy={hide.isPending} onOpenChange={open => { if (!open) setPendingHide(null) }} onConfirm={() => { if (pendingHide) hide.mutate(pendingHide._id) }}/>
  </AdminShell>
}

function ContentCard({ item, onEdit, onHide }: { item: ContentItem; onEdit: () => void; onHide: () => void }) { const title = "title" in item ? item.title : item.name; const visible = "active" in item ? item.active : item.published; return <article className="overflow-hidden rounded-3xl border bg-white shadow-sm">{item.image ? <img className="h-40 w-full object-cover" src={item.image} alt={title}/> : <div className="grid h-32 place-items-center bg-slate-100"><Boxes className="size-10 text-slate-300"/></div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className={cn("rounded-full px-3 py-1 text-xs font-black", visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{visible ? "Đang hiển thị" : "Đã ẩn"}</span><h2 className="mt-3 font-display text-xl font-bold text-emerald-950">{title}</h2></div>{"stock" in item && <strong className={cn("text-sm", item.stock <= 5 ? "text-red-600" : "text-slate-600")}>Kho: {item.stock}</strong>}</div>{"price" in item && <p className="mt-3 font-bold text-orange-700">{item.priceOnRequest ? "Giá liên hệ" : formatPrice(item.price || 0)}</p>}{"summary" in item && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>}{"client" in item && <p className="mt-3 text-sm text-slate-600">{item.client || item.category} · {item.year}</p>}<div className="mt-5 flex gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Pencil className="size-4"/>Sửa</Button>{visible && <Button size="sm" variant="ghost" onClick={onHide}><Archive className="size-4"/>Ẩn</Button>}</div></div></article> }
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="text-sm font-bold text-slate-700">{label}<span className="mt-2 block">{children}</span>{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label> }
function Check({ register, label }: { register: UseFormRegisterReturn; label: string }) { return <label className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" {...register}/>{label}</label> }
function tabName(kind: Kind) { return kind === "products" ? "Sản phẩm" : kind === "services" ? "Dịch vụ" : "Dự án" }
function ErrorText({ error }: { error: Error }) { return <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error.message}</p> }
