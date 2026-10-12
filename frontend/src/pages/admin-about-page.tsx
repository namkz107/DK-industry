import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"

export function AdminAboutPage() {
  usePageMeta("Ảnh giới thiệu", "Cập nhật ảnh người dẫn đường hiển thị trên trang Giới thiệu.")
  const queryClient = useQueryClient()
  const setting = useQuery({ queryKey: ["admin", "site-settings", "about"], queryFn: adminClient.aboutSettings })
  const [image, setImage] = useState<string | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (setting.data && image === undefined) setImage(setting.data.data.leaderImage ?? import.meta.env.VITE_CLOUDINARY_CEO_IMAGE_URL ?? "")
  }, [setting.data, image])

  const save = useMutation({
    mutationFn: () => adminClient.updateAboutSettings({ leaderImage: image || "" }),
    onSuccess: result => {
      setImage(result.data.leaderImage ?? "")
      void queryClient.invalidateQueries({ queryKey: ["site-settings", "about"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-settings", "about"] })
    },
  })

  return <AdminShell title="Ảnh phần Giới thiệu" description="Thay đổi ảnh người dẫn đường. Ảnh mới sẽ xuất hiện trên trang Giới thiệu sau khi bạn bấm lưu.">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {setting.isLoading ? <p className="py-12 text-center text-slate-500">Đang tải ảnh hiện tại...</p> : <>
        <ImageUpload value={image || ""} onChange={setImage} onBusyChange={setUploading}/>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
          <Button disabled={uploading || save.isPending || image === undefined} onClick={() => save.mutate()}>
            {uploading ? "Đang tải ảnh..." : save.isPending ? "Đang lưu..." : "Lưu ảnh giới thiệu"}
          </Button>
          {save.isSuccess && !save.isPending && <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="size-5"/>Ảnh đã được cập nhật</p>}
        </div>
      </>}
      {(setting.error || save.error) && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{(setting.error || save.error)?.message}</p>}
    </section>
  </AdminShell>
}
