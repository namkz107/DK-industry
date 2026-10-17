export interface Product {
  _id: string
  name: string
  slug?: string
  category: string
  description?: string
  price?: number | null
  unit?: string
  image: string
  stock?: number
  priceOnRequest?: boolean
  sku?: string
  images?: string[]
  specifications?: Record<string, string>
}

export interface Project {
  _id: string
  title: string
  slug?: string
  category: string
  location?: string
  year?: string
  description?: string
  objective?: string
  projectScale?: string
  durationDays?: number | null
  teamSize?: number | null
  scope?: string[]
  requirements?: string[]
  workItems?: string[]
  technicalHighlights?: string[]
  challenge?: string
  solution?: string
  results?: string
  customerFeedback?: string
  stages?: Array<{ phase: "before" | "during" | "after"; title: string; description?: string; images: Array<{ url: string; caption?: string }> }>
  gallery?: string[]
  image: string
}

export interface Service {
  _id: string
  name: string
  slug: string
  summary: string
  description?: string
  capabilities: string[]
  materials: string[]
  applications: string[]
  image: string
}

export interface ApiList<T> {
  success: boolean
  count: number
  total?: number
  page?: number
  pages?: number
  categories?: string[]
  data: T[]
}
