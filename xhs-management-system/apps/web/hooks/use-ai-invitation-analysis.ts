import { useMutation } from "@tanstack/react-query"

import {
  analyzeInvitation,
  generateVisitPrepBriefing,
  type AnalyzeInvitationRequest,
} from "@/lib/ai"
import { useToast } from "@workspace/ui/components/toast"

function useAiInvitationAnalysisMutation() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (input: AnalyzeInvitationRequest) => analyzeInvitation(input),
    onSuccess: () => {
      toast({
        title: "AI draft generated",
        variant: "success",
      })
    },
  })
}

function useVisitPrepBriefingMutation() {
  return useMutation({
    mutationFn: (invitationId: string) => generateVisitPrepBriefing(invitationId),
  })
}

export { useAiInvitationAnalysisMutation, useVisitPrepBriefingMutation }
