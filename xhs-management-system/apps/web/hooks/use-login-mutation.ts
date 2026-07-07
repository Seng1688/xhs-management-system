import { useMutation } from "@tanstack/react-query"

import { login, type LoginCredentials } from "@/lib/auth"

function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
  })
}

export { useLoginMutation }
