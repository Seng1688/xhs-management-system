type ShopCandidate = {
  address: string
  confidence: number | null
  id: string
  latitude: string | null
  longitude: string | null
  name: string
  phone: string | null
  source: string | null
  sourceUrl: string | null
}

type ShopEnrichment = {
  message?: string
  status: "error" | "skipped" | "success"
}

type SearchShopCandidatesInput = {
  draft: Record<string, unknown>
  rawText: string
  shopDescription: string
}

async function searchShopCandidatesFromN8n({
  draft,
  rawText,
  shopDescription,
}: SearchShopCandidatesInput): Promise<{
  enrichment: ShopEnrichment
  results: ShopCandidate[]
}> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL + 'shop-search'

  if (!webhookUrl || shopDescription.trim().length === 0) {
    return {
      enrichment: {
        message: !webhookUrl
          ? "Shop enrichment is not configured."
          : "Shop description is empty.",
        status: "skipped",
      },
      results: [],
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      body: JSON.stringify({
        draft,
        rawText,
        shopDescription,
      }),
      headers: buildHeaders(),
      method: "POST",
      signal: AbortSignal.timeout(getTimeoutMs()),
    })

    if (!response.ok) {
      throw new Error(`n8n shop search failed with ${response.status}`)
    }

    const payload = await response.json()

    return {
      enrichment: {
        status: "success",
      },
      results: normalizeShopCandidates(payload),
    }
  } catch (error) {
    console.warn(
      error instanceof Error
        ? error.message
        : "n8n shop search failed with an unknown error"
    )

    return {
      enrichment: {
        message: "Geographic analysis failed.",
        status: "error",
      },
      results: [],
    }
  }
}

function buildHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  headers["X-API-KEY"] = process.env.N8N_AUTH ?? ""
  return headers
}

function getTimeoutMs() {
  const rawTimeout = Number(process.env.N8N_SHOP_SEARCH_TIMEOUT_MS)

  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 15000
}

function normalizeShopCandidates(payload: unknown): ShopCandidate[] {
  const rawResults = getRawResults(payload)

  return rawResults
    .map((result, index) => normalizeShopCandidate(result, index))
    .filter((result): result is ShopCandidate => result !== null)
}

function getRawResults(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((item) => {
      if (isRecord(item) && isRecord(item.json)) {
        if (Array.isArray(item.json.results)) {
          return item.json.results
        }

        return item.json
      }

      return item
    })
  }

  if (isRecord(payload) && Array.isArray(payload.results)) {
    return payload.results
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

function normalizeShopCandidate(
  result: unknown,
  index: number
): ShopCandidate | null {
  if (!isRecord(result)) {
    return null
  }

  const name = firstString(result.name, result.shopName, result.title)
  const address = firstString(result.address, result.formattedAddress)

  if (!name || !address) {
    return null
  }

  return {
    address,
    confidence: numberValue(result.confidence),
    id: firstString(result.id, result.placeId, result.sourceUrl) ?? `${name}-${index}`,
    latitude: firstString(result.latitude, result.lat),
    longitude: firstString(result.longitude, result.lng, result.lon),
    name,
    phone: firstString(result.phone, result.phoneNumber, result.contactNumber),
    source: firstString(result.source),
    sourceUrl: firstString(result.sourceUrl, result.url),
  }
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

function numberValue(value: unknown) {
  let parsed: number | null = null

  if (typeof value === "number" && Number.isFinite(value)) {
    parsed = value
  } else if (typeof value === "string") {
    const number = Number(value)
    parsed = Number.isFinite(number) ? number : null
  }

  if (parsed === null) {
    return null
  }

  return parsed > 1 && parsed <= 100 ? parsed / 100 : parsed
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export {
  searchShopCandidatesFromN8n,
  type ShopEnrichment,
  type ShopCandidate,
}
