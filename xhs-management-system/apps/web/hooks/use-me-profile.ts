import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getMeProfile, uploadProfileImage } from "@/lib/me"
import { useToast } from "@workspace/ui/components/toast"

const meProfileQueryKey = ["me-profile"] as const

function useMeProfile() {
  return useQuery({
    queryFn: getMeProfile,
    queryKey: meProfileQueryKey,
  })
}

function useUploadProfileImageMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (file: File) => uploadProfileImage(file),
    onSuccess: () => {
      toast({
        title: "Profile picture updated",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: meProfileQueryKey })
    },
  })
}

export { useMeProfile, useUploadProfileImageMutation }
