import { useQuery } from "@tanstack/react-query"

import { getCurrentUser } from "@/lib/auth"

const authSessionQueryKey = ["auth", "me"] as const

function useAuthSession() {
  return useQuery({
    queryFn: getCurrentUser,
    queryKey: authSessionQueryKey,
    retry: false,
  })
}

export { authSessionQueryKey, useAuthSession }
