export function googleMapsPlaceUrl(latitude: string | number, longitude: string | number) {
  const query = encodeURIComponent(`${latitude},${longitude}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export function googleMapsDirectionsUrl(latitude: string | number, longitude: string | number) {
  const destination = encodeURIComponent(`${latitude},${longitude}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

export function googleMapsEmbedPlaceUrl(apiKey: string, latitude: string | number, longitude: string | number) {
  const query = encodeURIComponent(`${latitude},${longitude}`)
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${query}&zoom=17`
}
