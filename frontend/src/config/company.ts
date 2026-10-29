import { googleMapsEmbedPlaceUrl, googleMapsViewPlaceUrl } from "@/lib/google-maps"

const mapDestination = import.meta.env.VITE_COMPANY_MAP_DESTINATION || "20.895803,105.862915"
const [mapLatitude = "20.895803", mapLongitude = "105.862915"] = mapDestination.split(",").map((value: string) => value.trim())
const publicPhone = "0983688326"
const publicPhoneLabel = "098 3688326"

export const company = {
  name: import.meta.env.VITE_COMPANY_NAME || "CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA",
  phone: publicPhone,
  phoneLabel: publicPhoneLabel,
  email: import.meta.env.VITE_COMPANY_EMAIL || "namkz107@gmail.com",
  address: import.meta.env.VITE_COMPANY_ADDRESS || "Cụm 3, thôn Duyên Trường, xã Hồng Vân, thành phố Hà Nội, Việt Nam",
  mapDestination,
  taxCode: import.meta.env.VITE_COMPANY_TAX_CODE || "0106426038",
  registrationNumber: import.meta.env.VITE_COMPANY_REGISTRATION_NUMBER || "",
  legalRepresentative: import.meta.env.VITE_COMPANY_LEGAL_REPRESENTATIVE || "",
  zaloUrl: `https://zalo.me/${publicPhone}`,
}

export const companyMapUrl = googleMapsViewPlaceUrl(mapLatitude, mapLongitude)
export const companyMapEmbedUrl = googleMapsEmbedPlaceUrl(mapLatitude, mapLongitude)
