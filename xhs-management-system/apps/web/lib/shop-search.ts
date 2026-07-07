type ShopSearchResult = {
  address: string
  category: string | null
  id: string
  latitude: string | null
  longitude: string | null
  name: string
  sourceUrl: string
}

type SearchShopsRequest = {
  near?: string
  query: string
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

async function searchShops(input: SearchShopsRequest) {
  const params = new URLSearchParams({
    query: input.query,
  })

  if (input.near) {
    params.set("near", input.near)
  }

  const response = await fetch(`${apiUrl}/shop-search?${params.toString()}`)

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response))
  }

  return (await response.json()) as { results: ShopSearchResult[] }
}

async function getApiErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message ?? "Unable to search shop details."
  } catch {
    return "Unable to search shop details."
  }
}

export {
  searchShops,
  type SearchShopsRequest,
  type ShopSearchResult,
}
