export function readActionToken() {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  return fragment.get("token") || ""
}

export function clearActionTokenFromUrl() {
  const url = new URL(window.location.href)
  const hadToken = url.hash || url.searchParams.has("token")
  if (!hadToken) return
  url.hash = ""
  url.searchParams.delete("token")
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`)
}
