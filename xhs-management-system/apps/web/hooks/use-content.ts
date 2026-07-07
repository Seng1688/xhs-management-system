import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  ensureContentForInvitation,
  getAssistantSettings,
  getContentInvitations,
  saveContentForInvitation,
  sendContentAiMessage,
  startContentAiSession,
  updateAssistantSettings,
  updateContent,
  type AssistantSettings,
  type ContentInput,
} from "@/lib/content"
import { useToast } from "@workspace/ui/components/toast"

const contentInvitationsQueryKey = ["content-invitations"] as const
const assistantSettingsQueryKey = ["content-assistant-settings"] as const

function useContentInvitations() {
  return useQuery({
    queryFn: getContentInvitations,
    queryKey: contentInvitationsQueryKey,
  })
}

function useEnsureContentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => ensureContentForInvitation(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: contentInvitationsQueryKey,
      })
    },
  })
}

function useSaveContentForInvitationMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      input,
      invitationId,
    }: {
      input: ContentInput
      invitationId: string
    }) => saveContentForInvitation(invitationId, input),
    onSuccess: () => {
      toast({ title: "Content saved", variant: "success" })
      void queryClient.invalidateQueries({
        queryKey: contentInvitationsQueryKey,
      })
    },
  })
}

function useUpdateContentMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      contentId,
      input,
    }: {
      contentId: string
      input: ContentInput
    }) => updateContent(contentId, input),
    onSuccess: () => {
      toast({ title: "Content saved", variant: "success" })
      void queryClient.invalidateQueries({
        queryKey: contentInvitationsQueryKey,
      })
    },
  })
}

function useAssistantSettings() {
  return useQuery({
    queryFn: getAssistantSettings,
    queryKey: assistantSettingsQueryKey,
  })
}

function useUpdateAssistantSettingsMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: Omit<AssistantSettings, "id" | "updatedAt">) =>
      updateAssistantSettings(input),
    onSuccess: () => {
      toast({ title: "Assistant settings saved", variant: "success" })
      void queryClient.invalidateQueries({
        queryKey: assistantSettingsQueryKey,
      })
    },
  })
}

function useStartContentAiSessionMutation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      contentId,
      overview,
    }: {
      contentId: string
      overview: string
    }) => startContentAiSession(contentId, overview),
    onSuccess: () => {
      toast({ title: "AI content generated", variant: "success" })
    },
  })
}

function useSendContentAiMessageMutation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      message,
      sessionId,
    }: {
      message: string
      sessionId: string
    }) => sendContentAiMessage(sessionId, message),
    onSuccess: () => {
      toast({ title: "AI content refined", variant: "success" })
    },
  })
}

export {
  useAssistantSettings,
  useContentInvitations,
  useEnsureContentMutation,
  useSaveContentForInvitationMutation,
  useSendContentAiMessageMutation,
  useStartContentAiSessionMutation,
  useUpdateAssistantSettingsMutation,
  useUpdateContentMutation,
}
