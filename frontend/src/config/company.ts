import { googleMapsEmbedPlaceUrl, googleMapsViewPlaceUrl } from "@/lib/google-maps"

const mapDestination = import.meta.env.VITE_COMPANY_MAP_DESTINATION || "20.895803,105.862915"
const [mapLatitude = "20.895803", mapLongitude = "105.862915"] = mapDestination.split(",").map((value: string) => value.trim())

export const company = {
  name: import.meta.env.VITE_COMPANY_NAME || "CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA",
  phone: import.meta.env.VITE_COMPANY_PHONE || "0983688336",
  phoneLabel: import.meta.env.VITE_COMPANY_PHONE_LABEL || "098 368 8336",
  email: import.meta.env.VITE_COMPANY_EMAIL || "namkz107@gmail.com",
  address: import.meta.env.VITE_COMPANY_ADDRESS || "Cụm 3, thôn Duyên Trường, xã Hồng Vân, thành phố Hà Nội, Việt Nam",
  mapDestination,
  taxCode: import.meta.env.VITE_COMPANY_TAX_CODE || "0106426038",
  registrationNumber: import.meta.env.VITE_COMPANY_REGISTRATION_NUMBER || "",
  legalRepresentative: import.meta.env.VITE_COMPANY_LEGAL_REPRESENTATIVE || "",
  zaloUrl: import.meta.env.VITE_COMPANY_ZALO_URL || "https://zalo.me/0983688326",
}

export const companyMapUrl = googleMapsViewPlaceUrl(mapLatitude, mapLongitude)
export const companyMapEmbedUrl = googleMapsEmbedPlaceUrl(mapLatitude, mapLongitude)
