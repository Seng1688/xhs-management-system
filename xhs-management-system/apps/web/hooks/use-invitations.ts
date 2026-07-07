import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createInvitation,
  deleteInvitation,
  getInvitations,
  type InvitationFilters,
  type InvitationInput,
  type InvitationUpdate,
  updateInvitation,
} from "@/lib/invitations"
import { useToast } from "@workspace/ui/components/toast"

const invitationsQueryKey = ["invitations"] as const

function useInvitations(filters: InvitationFilters) {
  return useQuery({
    queryFn: () => getInvitations(filters),
    queryKey: [...invitationsQueryKey, filters],
  })
}

function useCreateInvitationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: InvitationInput) => createInvitation(input),
    onSuccess: () => {
      toast({
        title: "Invitation created",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
    },
  })
}

function useUpdateInvitationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvitationUpdate }) =>
      updateInvitation(id, input),
    onSuccess: () => {
      toast({
        title: "Changes saved",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
    },
  })
}

function useDeleteInvitationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: () => {
      toast({
        title: "Invitation deleted",
        variant: "success",
      })
      void queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
    },
  })
}

export {
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
  useInvitations,
  useUpdateInvitationMutation,
}
