/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_CLOUDINARY_LOGO_URL?: string
  readonly VITE_CLOUDINARY_CEO_IMAGE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
