import type { SearchShopsDto } from "./shop-search.dto.js"

type NominatimSearchResult = {
  address?: Record<string, string>
  category?: string
  display_name?: string
  lat?: string
  lon?: string
  name?: string
  namedetails?: Record<string, string>
  osm_id?: number
  osm_type?: string
  place_id?: number
  type?: string
}

type ShopSearchResult = {
  address: string
  category: string | null
  id: string
  latitude: string | null
  longitude: string | null
  name: string
  sourceUrl: string
}

async function searchShops({
  near,
  query,
}: SearchShopsDto): Promise<{ results: ShopSearchResult[] }> {
  const searchParams = new URLSearchParams({
    addressdetails: "1",
    format: "jsonv2",
    limit: "5",
    namedetails: "1",
    q: near ? `${query} ${near}` : query,
  })

  const countryCodes = process.env.SHOP_SEARCH_COUNTRY_CODES

  if (countryCodes) {
    searchParams.set("countrycodes", countryCodes)
  }

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.search = searchParams.toString()

  const response = await fetch(url, {
    headers: {
      "Accept-Language": process.env.SHOP_SEARCH_ACCEPT_LANGUAGE ?? "en",
      "User-Agent":
        process.env.SHOP_SEARCH_USER_AGENT ??
        "xhs-management-system/1.0 local-shop-lookup",
    },
  })

  if (!response.ok) {
    throw new Error("Unable to search shop details right now.")
  }

  const payload = (await response.json()) as NominatimSearchResult[]

  return {
    results: payload.map((result) => normalizeSearchResult(result)),
  }
}

function normalizeSearchResult(result: NominatimSearchResult): ShopSearchResult {
  const id = [
    result.osm_type,
    result.osm_id,
    result.place_id,
  ].filter(Boolean).join(":")

  return {
    address: result.display_name ?? "",
    category:
      [result.category, result.type].filter(Boolean).join(" / ") || null,
    id: id || String(result.place_id ?? result.display_name ?? "unknown-place"),
    latitude: result.lat ?? null,
    longitude: result.lon ?? null,
    name:
      result.name ??
      result.namedetails?.name ??
      result.display_name?.split(",")[0]?.trim() ??
      "Unnamed place",
    sourceUrl:
      result.lat && result.lon
        ? `https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=18/${result.lat}/${result.lon}`
        : "https://www.openstreetmap.org/",
  }
}

export { searchShops, type ShopSearchResult }
