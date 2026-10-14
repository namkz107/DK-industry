import { CheckCircle2, Crosshair, ExternalLink, LoaderCircle, MapPin, Search } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { customerClient } from "@/lib/customer-client"
import { googleMapsPlaceUrl } from "@/lib/google-maps"
import type { LocationDetails, PlaceSuggestion } from "@/types/customer"

export function LocationPicker({ value, onLocation }: {
  value?: { formattedAddress?: string; latitude?: number; longitude?: number; accuracyMeters?: number; locationConfirmed?: boolean }
  onLocation: (location: Partial<LocationDetails> & { locationConfirmed: boolean }) => void
}) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [resolvingPlaceId, setResolvingPlaceId] = useState("")
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState("")
  const positionRequestId = useRef(0)

  async function search() {
    const input = query.trim()
    if (input.length < 4) { setSuggestions([]); setMessage("Nhập ít nhất 4 ký tự rồi bấm Tìm"); return }
    try {
      setSearching(true)
      const result = await customerClient.searchLocations(input, crypto.randomUUID())
      setSuggestions(result.data)
      setMessage(result.data.length ? "" : "Không tìm thấy địa chỉ phù hợp")
    } catch (error) {
      setSuggestions([])
      setMessage(error instanceof Error ? error.message : "Không thể tìm địa chỉ")
    } finally {
      setSearching(false)
    }
  }

  async function choose(suggestion: PlaceSuggestion) {
    positionRequestId.current += 1
    setQuery(suggestion.mainText)
    setResolvingPlaceId(suggestion.placeId)
    setMessage("Đang lấy địa chỉ và tọa độ từ Google Maps…")
    try {
      const result = await customerClient.placeDetails(suggestion.placeId, suggestion.sessionToken)
      setSuggestions([])
      onLocation({ ...result.data, locationConfirmed: true })
      setMessage("Đã xác nhận điểm giao hàng bằng Google Maps")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lấy chi tiết địa điểm")
    } finally {
      setResolvingPlaceId("")
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setMessage("Trình duyệt này không hỗ trợ định vị"); return }
    setLocating(true)
    setMessage("Đang lấy vị trí gần nhất…")
    const applyPosition = async (position: GeolocationPosition, requestHighAccuracy: boolean) => {
      const currentPositionRequest = ++positionRequestId.current
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: Math.round(position.coords.accuracy),
        locationConfirmed: true
      }
      onLocation(coordinates)
      setMessage(`Đã lấy vị trí với sai số khoảng ${coordinates.accuracyMeters} m`)
      const shouldRefine = requestHighAccuracy && position.coords.accuracy > 30
      if (shouldRefine) {
        navigator.geolocation.getCurrentPosition(
          precise => void applyPosition(precise, false),
          () => { if (currentPositionRequest === positionRequestId.current) setLocating(false) },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
        )
      }
      try {
        const result = await customerClient.reverseLocation(coordinates.latitude, coordinates.longitude)
        if (currentPositionRequest === positionRequestId.current) onLocation({ ...result.data, accuracyMeters: coordinates.accuracyMeters, locationConfirmed: true })
      } catch (error) {
        if (currentPositionRequest === positionRequestId.current) setMessage(`${error instanceof Error ? error.message : "Không đổi được vị trí thành địa chỉ"}. Bạn vẫn có thể nhập địa chỉ bên dưới.`)
      }
      if (!shouldRefine && currentPositionRequest === positionRequestId.current) setLocating(false)
    }
    navigator.geolocation.getCurrentPosition(
      position => void applyPosition(position, true),
      error => { setLocating(false); setMessage(error.code === error.PERMISSION_DENIED ? "Bạn chưa cấp quyền truy cập vị trí" : "Không thể xác định vị trí hiện tại") },
      { enableHighAccuracy: false, timeout: 4_000, maximumAge: 60_000 }
    )
  }

  const mapUrl = value?.latitude !== undefined && value.longitude !== undefined
    ? googleMapsPlaceUrl(value.latitude, value.longitude)
    : ""

  return <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
    <div className="flex items-center gap-2 text-sm font-bold text-emerald-950"><MapPin className="size-5 text-orange-600"/>Chọn chính xác điểm giao hàng</div>
    <p className="mt-1 text-xs leading-5 text-slate-600">Nhập địa chỉ rồi bấm Tìm, hoặc cho phép trình duyệt lấy vị trí hiện tại. Địa chỉ và tọa độ được đối chiếu bằng Google Maps.</p>
    <div className="mt-4 flex items-start gap-2" role="search">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-3.5 size-5 text-slate-400"/>
        <Input className="pl-10" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void search() } }} placeholder="Nhập tên đường, tòa nhà, công ty…" autoComplete="off"/>
        {suggestions.length > 0 && <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">{suggestions.map(item => <li key={item.placeId}><button type="button" disabled={Boolean(resolvingPlaceId)} className="w-full rounded-lg px-3 py-3 text-left hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" onClick={() => void choose(item)}><strong className="flex items-center gap-2 text-sm text-slate-800">{resolvingPlaceId === item.placeId && <LoaderCircle className="size-4 animate-spin"/>}{item.mainText}</strong>{item.secondaryText && <span className="mt-1 block text-xs text-slate-500">{item.secondaryText}</span>}</button></li>)}</ul>}
      </div>
      <Button type="button" onClick={() => void search()} disabled={searching || Boolean(resolvingPlaceId) || query.trim().length < 4}>{searching ? <LoaderCircle className="size-4 animate-spin"/> : <Search className="size-4"/>}Tìm</Button>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <Button type="button" size="sm" variant="outline" disabled={locating || searching || Boolean(resolvingPlaceId)} onClick={useCurrentLocation}>{locating ? <LoaderCircle className="size-4 animate-spin"/> : <Crosshair className="size-4"/>}Vị trí của tôi</Button>
      {mapUrl && <a className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-emerald-800 hover:text-orange-700" href={mapUrl} target="_blank" rel="noreferrer">Kiểm tra điểm ghim <ExternalLink className="size-4"/></a>}
    </div>
    {message && <p role="status" className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600">{value?.locationConfirmed && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700"/>}{message}</p>}
    {value?.formattedAddress && <p className="mt-3 rounded-xl bg-white p-3 text-sm leading-6 text-slate-700"><strong className="block text-emerald-900">Điểm đã chọn</strong>{value.formattedAddress}{value.accuracyMeters !== undefined && <span className="block text-xs text-slate-500">Sai số thiết bị: khoảng {Math.round(value.accuracyMeters)} m</span>}</p>}
    <p className="mt-3 text-[11px] text-slate-500">Dữ liệu địa điểm do <span className="font-semibold" translate="no">Google Maps</span> cung cấp.</p>
  </div>
}
