import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, LoaderCircle, LockKeyhole, Mail, MapPin, Pencil, Phone, Plus, Star, Trash2, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { CustomerShell } from "@/components/customer/customer-shell"
import { LocationPicker } from "@/components/customer/location-picker"
import { PasswordCard } from "@/components/customer/password-card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { WorkspaceModal } from "@/components/workspace-modal"
import { useAuth } from "@/contexts/auth-context"
import { usePageMeta } from "@/hooks/use-page-meta"
import { customerClient } from "@/lib/customer-client"
import { formatAddressParts, scrollToPageTop } from "@/lib/utils"
import type { Address, LocationDetails } from "@/types/customer"

const profileSchema = z.object({ name: z.string().trim().min(2, "Nhập họ tên"), phone: z.string().trim().regex(/^(?:\+84|0)[0-9\s.-]{9,13}$/, "Số điện thoại chưa đúng"), company: z.string().trim().max(200), taxCode: z.string().trim().max(30) })
const addressSchema = z.object({ label: z.string().trim().min(2, "Nhập tên gợi nhớ"), recipientName: z.string().trim().min(2, "Nhập người nhận"), phone: z.string().trim().regex(/^(?:\+84|0)[0-9\s.-]{9,13}$/, "Số điện thoại chưa đúng"), addressLine: z.string().trim().min(5, "Nhập số nhà, tên đường/thôn"), ward: z.string().trim(), district: z.string().trim().min(2, "Nhập quận/huyện"), province: z.string().trim().min(2, "Nhập tỉnh/thành phố"), formattedAddress: z.string().trim().max(500).optional(), placeId: z.string().trim().max(300).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), accuracyMeters: z.number().min(0).max(100000).optional(), locationConfirmed: z.boolean(), isDefault: z.boolean() })
type ProfileData = z.infer<typeof profileSchema>
type AddressData = z.infer<typeof addressSchema>
const emptyAddress: AddressData = { label: "Địa chỉ giao hàng", recipientName: "", phone: "", addressLine: "", ward: "", district: "", province: "", formattedAddress: "", placeId: "", locationConfirmed: false, isDefault: false }

export function CustomerProfilePage() {
  usePageMeta("Hồ sơ khách hàng", "Quản lý thông tin liên hệ và địa chỉ giao hàng.")
  const queryClient = useQueryClient()
  const toast = useToast()
  const { updateUser } = useAuth()
  const [editingId, setEditingId] = useState<string>()
  const [activeModal, setActiveModal] = useState<"profile" | "password" | "address" | null>(null)
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null)
  const profile = useQuery({ queryKey: ["customer", "profile"], queryFn: customerClient.profile })
  const profileForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema), defaultValues: { name: "", phone: "", company: "", taxCode: "" } })
  const addressForm = useForm<AddressData>({ resolver: zodResolver(addressSchema), defaultValues: emptyAddress })

  useEffect(() => { if (profile.data?.data) { const { name, phone, company, taxCode } = profile.data.data; profileForm.reset({ name, phone, company, taxCode }) } }, [profile.data, profileForm])

  const updateProfile = useMutation({ mutationFn: customerClient.updateProfile, onSuccess: result => { updateUser(result.data); toast.success(result.message || "Đã lưu hồ sơ"); setActiveModal(null); scrollToPageTop(); void queryClient.invalidateQueries({ queryKey: ["customer", "profile"] }) }, onError: error => toast.error(error.message) })
  const saveAddress = useMutation({
    mutationFn: (data: AddressData) => editingId ? customerClient.updateAddress(editingId, data) : customerClient.addAddress(data),
    onSuccess: result => { toast.success(result.message || "Đã lưu địa chỉ"); setEditingId(undefined); setActiveModal(null); addressForm.reset(emptyAddress); scrollToPageTop(); void queryClient.invalidateQueries({ queryKey: ["customer", "profile"] }) },
    onError: error => toast.error(error.message),
  })
  const deleteAddress = useMutation({ mutationFn: customerClient.deleteAddress, onSuccess: result => { toast.success(result.message || "Đã xóa địa chỉ"); setDeletingAddress(null); scrollToPageTop(); void queryClient.invalidateQueries({ queryKey: ["customer", "profile"] }) }, onError: error => toast.error(error.message) })
  const setDefault = useMutation({ mutationFn: (address: Address) => customerClient.updateAddress(address._id, { ...address, isDefault: true }), onSuccess: result => { toast.success(result.message || "Đã cập nhật địa chỉ mặc định"); scrollToPageTop(); void queryClient.invalidateQueries({ queryKey: ["customer", "profile"] }) }, onError: error => toast.error(error.message) })

  const edit = (address: Address) => { setEditingId(address._id); addressForm.reset({ label: address.label, recipientName: address.recipientName, phone: address.phone, addressLine: address.addressLine, ward: address.ward || "", district: address.district, province: address.province, formattedAddress: address.formattedAddress || "", placeId: address.placeId || "", latitude: address.latitude, longitude: address.longitude, accuracyMeters: address.accuracyMeters, locationConfirmed: address.locationConfirmed || false, isDefault: address.isDefault }); setActiveModal("address") }

  const locationValue = {
    formattedAddress: addressForm.watch("formattedAddress"), latitude: addressForm.watch("latitude"), longitude: addressForm.watch("longitude"),
    accuracyMeters: addressForm.watch("accuracyMeters"), locationConfirmed: addressForm.watch("locationConfirmed")
  }
  const applyLocation = (location: Partial<LocationDetails> & { locationConfirmed: boolean }) => {
    if (location.formattedAddress) addressForm.setValue("formattedAddress", location.formattedAddress)
    if (location.placeId) addressForm.setValue("placeId", location.placeId)
    if (location.latitude !== undefined) addressForm.setValue("latitude", location.latitude)
    if (location.longitude !== undefined) addressForm.setValue("longitude", location.longitude)
    if (location.accuracyMeters !== undefined) addressForm.setValue("accuracyMeters", location.accuracyMeters)
    addressForm.setValue("addressLine", location.addressLine || "", { shouldValidate: true })
    addressForm.setValue("ward", location.ward || "")
    addressForm.setValue("district", location.district || "", { shouldValidate: true })
    addressForm.setValue("province", location.province || "", { shouldValidate: true })
    addressForm.setValue("locationConfirmed", location.locationConfirmed)
  }

  if (profile.isLoading) return <CustomerShell title="Hồ sơ & địa chỉ" description="Đang tải thông tin..."><Loading/></CustomerShell>
  if (profile.error) return <CustomerShell title="Hồ sơ & địa chỉ" description="Không thể tải thông tin tài khoản."><ErrorText error={profile.error}/></CustomerShell>
  const data = profile.data!.data
  return <CustomerShell title="Hồ sơ & địa chỉ" description="Thông tin tài khoản được trình bày gọn; chỉ mở biểu mẫu khi bạn cần chỉnh sửa.">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-6 text-white sm:px-7"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/15"><UserRound className="size-7"/></span><div><p className="text-sm text-emerald-100/70">Tài khoản khách hàng</p><h2 className="font-display text-2xl font-bold">{data.name}</h2><p className="mt-1 text-sm text-emerald-100/80">{data.company || "Khách hàng cá nhân"}</p></div></div><Button className="bg-orange-400 text-emerald-950 hover:bg-orange-300" onClick={() => setActiveModal("profile")}><Pencil className="size-4"/>Chỉnh sửa hồ sơ</Button></div></div>
      <div className="grid gap-px bg-slate-200 sm:grid-cols-3"><div className="flex items-center gap-3 bg-white p-5"><Mail className="size-5 text-orange-600"/><div className="min-w-0"><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Email</span><strong className="block truncate text-sm text-emerald-950">{data.email}</strong></div></div><div className="flex items-center gap-3 bg-white p-5"><Phone className="size-5 text-orange-600"/><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Điện thoại</span><strong className="text-sm text-emerald-950">{data.phone}</strong></div></div><div className="flex items-center gap-3 bg-white p-5"><Building2 className="size-5 text-orange-600"/><div><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Mã số thuế</span><strong className="text-sm text-emerald-950">{data.taxCode || "Chưa cập nhật"}</strong></div></div></div>
    </section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_300px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 sm:px-6"><div><h2 className="font-display text-xl font-bold text-emerald-950">Địa chỉ giao hàng</h2><p className="mt-1 text-sm text-slate-500">{data.addresses.length}/5 địa chỉ đã lưu</p></div><Button disabled={data.addresses.length >= 5} onClick={() => { setEditingId(undefined); addressForm.reset({ ...emptyAddress, recipientName: data.name, phone: data.phone }); setActiveModal("address") }}><Plus className="size-4"/>Thêm địa chỉ</Button></header><div className="max-h-[520px] divide-y overflow-y-auto">{data.addresses.length ? data.addresses.map(address => <article className="group p-5 transition hover:bg-orange-50/40" key={address._id}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-600"><MapPin className="size-4"/></span><strong className="text-emerald-950">{address.label}</strong>{address.isDefault && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">Mặc định</span>}</div><p className="mt-3 text-sm font-semibold text-slate-700">{address.recipientName} · {address.phone}</p><p className="mt-1 text-sm leading-6 text-slate-500">{formatAddressParts([address.addressLine, address.ward, address.district, address.province])}</p></div><div className="flex shrink-0 gap-1">{!address.isDefault && <Button size="icon" variant="ghost" title="Đặt làm mặc định" onClick={() => setDefault.mutate(address)}><Star className="size-4"/></Button>}<Button size="icon" variant="ghost" title="Sửa địa chỉ" onClick={() => edit(address)}><Pencil className="size-4"/></Button><Button size="icon" variant="ghost" title="Xóa địa chỉ" onClick={() => setDeletingAddress(address)}><Trash2 className="size-4 text-red-600"/></Button></div></div></article>) : <div className="p-10 text-center"><MapPin className="mx-auto size-10 text-slate-300"/><p className="mt-3 text-sm text-slate-500">Bạn chưa lưu địa chỉ giao hàng.</p></div>}</div></section>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><LockKeyhole className="size-5"/></span><h2 className="mt-4 font-display text-xl font-bold text-emerald-950">Bảo mật tài khoản</h2><p className="mt-2 text-sm leading-6 text-slate-500">Nên sử dụng mật khẩu riêng và thay đổi định kỳ để bảo vệ tài khoản.</p><Button className="mt-5 w-full" variant="outline" onClick={() => setActiveModal("password")}>Đổi mật khẩu</Button></aside>
    </div>
    <WorkspaceModal open={activeModal === "profile"} onOpenChange={open => { if (!open && !updateProfile.isPending) setActiveModal(null) }} busy={updateProfile.isPending} width="medium" eyebrow="Thông tin tài khoản" title="Chỉnh sửa hồ sơ" description="Cập nhật thông tin liên hệ và doanh nghiệp."><form className="rounded-3xl border bg-white p-6 shadow-sm" onSubmit={profileForm.handleSubmit(value => updateProfile.mutate(value))}><div className="grid gap-4 sm:grid-cols-2"><Field label="Họ và tên" error={profileForm.formState.errors.name?.message}><Input {...profileForm.register("name")}/></Field><Field label="Số điện thoại" error={profileForm.formState.errors.phone?.message}><Input inputMode="tel" {...profileForm.register("phone")}/></Field><Field label="Tên công ty (không bắt buộc)"><Input {...profileForm.register("company")}/></Field><Field label="Mã số thuế (không bắt buộc)"><Input {...profileForm.register("taxCode")}/></Field></div><Button disabled={updateProfile.isPending}>{updateProfile.isPending && <LoaderCircle className="size-5 animate-spin"/>}Lưu hồ sơ</Button></form></WorkspaceModal>
    <WorkspaceModal open={activeModal === "password"} onOpenChange={open => { if (!open) setActiveModal(null) }} width="medium" eyebrow="Bảo mật" title="Đổi mật khẩu" description="Mật khẩu mới sẽ được áp dụng cho lần đăng nhập tiếp theo."><PasswordCard/></WorkspaceModal>
    <WorkspaceModal open={activeModal === "address"} onOpenChange={open => { if (!open && !saveAddress.isPending) { setActiveModal(null); setEditingId(undefined); addressForm.reset(emptyAddress) } }} busy={saveAddress.isPending} eyebrow={editingId ? "Cập nhật địa chỉ" : "Địa chỉ mới"} title={editingId ? "Sửa địa chỉ giao hàng" : "Thêm địa chỉ giao hàng"} description="Xác nhận vị trí và thông tin người nhận trước khi lưu."><form className="rounded-3xl border bg-white p-6 shadow-sm" onSubmit={addressForm.handleSubmit(value => saveAddress.mutate(value))}><LocationPicker value={locationValue} onLocation={applyLocation}/><div className="grid gap-4 sm:grid-cols-2"><Field label="Tên gợi nhớ" error={addressForm.formState.errors.label?.message}><Input placeholder="Nhà máy, Văn phòng..." {...addressForm.register("label")}/></Field><Field label="Người nhận" error={addressForm.formState.errors.recipientName?.message}><Input {...addressForm.register("recipientName")}/></Field><Field label="Số điện thoại" error={addressForm.formState.errors.phone?.message}><Input inputMode="tel" {...addressForm.register("phone")}/></Field><Field label="Tỉnh / Thành phố" error={addressForm.formState.errors.province?.message}><Input {...addressForm.register("province")}/></Field><Field label="Quận / Huyện" error={addressForm.formState.errors.district?.message}><Input {...addressForm.register("district")}/></Field><Field label="Phường / Xã"><Input {...addressForm.register("ward")}/></Field></div><Field label="Số nhà, đường hoặc thôn" error={addressForm.formState.errors.addressLine?.message}><Input {...addressForm.register("addressLine")}/></Field><label className="mb-5 flex min-h-11 items-center gap-3 text-sm font-bold text-slate-700"><input className="size-5 accent-orange-600" type="checkbox" {...addressForm.register("isDefault")}/>Đặt làm địa chỉ mặc định</label><Button disabled={saveAddress.isPending}>{saveAddress.isPending && <LoaderCircle className="size-5 animate-spin"/>}{editingId ? "Lưu thay đổi" : "Thêm địa chỉ"}</Button></form></WorkspaceModal>
    <ConfirmDialog open={Boolean(deletingAddress)} title="Xóa địa chỉ đã lưu?" description={deletingAddress ? `Địa chỉ “${deletingAddress.label}” sẽ bị xóa khỏi tài khoản và không thể chọn cho các đơn hàng mới.` : ""} confirmLabel="Xóa địa chỉ" destructive busy={deleteAddress.isPending} onOpenChange={open => { if (!open) setDeletingAddress(null) }} onConfirm={() => { if (deletingAddress) deleteAddress.mutate(deletingAddress._id) }}/>
  </CustomerShell>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="mb-4 block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
function ErrorText({ error }: { error: Error }) { return <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error.message}</p> }
function Loading() { return <div className="grid min-h-60 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div> }
