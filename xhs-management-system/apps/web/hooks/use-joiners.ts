import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createJoiner,
  deleteJoiner,
  getJoiners,
  type JoinerInput,
  type JoinerUpdate,
  updateJoiner,
} from "@/lib/joiners"
import { useToast } from "@workspace/ui/components/toast"

const joinersQueryKey = ["joiners"] as const
const invitationsQueryKey = ["invitations"] as const

function useJoiners() {
  return useQuery({
    queryFn: getJoiners,
    queryKey: joinersQueryKey,
  })
}

function useCreateJoinerMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: JoinerInput) => createJoiner(input),
    onSuccess: () => {
      toast({
        title: "Joiner created",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: joinersQueryKey })
    },
  })
}

function useUpdateJoinerMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: JoinerUpdate }) =>
      updateJoiner(id, input),
    onSuccess: () => {
      toast({
        title: "Joiner saved",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: joinersQueryKey })
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
    },
  })
}

function useDeleteJoinerMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteJoiner(id),
    onSuccess: () => {
      toast({
        title: "Joiner deleted",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: joinersQueryKey })
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
    },
  })
}

export {
  useCreateJoinerMutation,
  useDeleteJoinerMutation,
  useJoiners,
  useUpdateJoinerMutation,
}
