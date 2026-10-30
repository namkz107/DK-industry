import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))
const dist = process.env.FRONTEND_DIST_DIR
  ? path.resolve(frontendRoot, process.env.FRONTEND_DIST_DIR)
  : path.join(frontendRoot, "dist")

function parseEnv(file) {
  if (!fs.existsSync(file)) return {}
  return Object.fromEntries(fs.readFileSync(file, "utf8").split(/\r?\n/).flatMap(line => {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) return []
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    return [[match[1], value]]
  }))
}

const env = { ...parseEnv(path.join(frontendRoot, ".env")), ...parseEnv(path.join(frontendRoot, ".env.production")), ...process.env }
const siteUrl = String(env.VITE_SITE_URL || "").replace(/\/$/, "")
if (!/^https:\/\//i.test(siteUrl) || /example\.(com|invalid)|your_/i.test(siteUrl)) {
  console.log("SEO: bỏ qua sitemap vì VITE_SITE_URL production chưa được cấu hình")
  process.exit(0)
}

const routes = ["/", "/gioi-thieu", "/dich-vu", "/du-an", "/san-pham", "/lien-he", "/chinh-sach/bao-mat", "/chinh-sach/giao-hang", "/chinh-sach/thanh-toan", "/chinh-sach/bao-hanh-doi-tra", "/chinh-sach/dieu-khoan"]
const today = new Date().toISOString().slice(0, 10)
const urls = routes.map(route => `  <url><loc>${siteUrl}${route}</loc><lastmod>${today}</lastmod></url>`).join("\n")
fs.writeFileSync(path.join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
console.log(`SEO: đã tạo sitemap cho ${routes.length} route tại ${siteUrl}`)
