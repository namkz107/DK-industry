const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

export function publicAssetUrl(value?: string | null) {
  const path = String(value || "")
  if (!path.startsWith("/uploads/")) return path
  if (/^https?:\/\//i.test(API_URL)) return `${API_URL.replace(/\/api\/?$/, "")}${path}`
  return path
}
