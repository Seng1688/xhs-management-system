import { useMutation } from "@tanstack/react-query"

import {
  searchShops,
  type SearchShopsRequest,
} from "@/lib/shop-search"

function useShopSearchMutation() {
  return useMutation({
    mutationFn: (input: SearchShopsRequest) => searchShops(input),
  })
}

export { useShopSearchMutation }
