"use client"

import { Bot, SearchCheck, Settings2, SquarePen } from "lucide-react"
import * as React from "react"

import { AssistantConfigModal } from "@/components/content/assistant-config-modal"
import { ContentAiChatModal } from "@/components/content/content-ai-chat-modal"
import { ContentAiOverviewModal } from "@/components/content/content-ai-overview-modal"
import { ContentEditorModal } from "@/components/content/content-editor-modal"
import { ContentInvitationList } from "@/components/content/content-invitation-list"
import {
  useAssistantSettings,
  useContentInvitations,
  useEnsureContentMutation,
  useSendContentAiMessageMutation,
  useStartContentAiSessionMutation,
  useUpdateAssistantSettingsMutation,
  useUpdateContentMutation,
} from "@/hooks/use-content"
import type {
  AssistantSettings,
  Content,
  ContentAiSession,
  ContentInput,
  ContentInvitationItem,
} from "@/lib/content"
import { Button } from "@workspace/ui/components/button"
import { useToast } from "@workspace/ui/components/toast"

const externalTools = [
  {
    href: "https://creator.xiaohongshu.com/login",
    icon: SquarePen,
    label: "创作者中心",
  },
  {
    href: "https://www.lingkechaci.com/",
    icon: SearchCheck,
    label: "零克查词",
  },
  {
    href: "https://gemini.google.com/app",
    icon: Bot,
    label: "Gemini",
  },
] as const

function ContentPage() {
  const { toast } = useToast()
  const invitationsQuery = useContentInvitations()
  const assistantSettingsQuery = useAssistantSettings()
  const ensureContentMutation = useEnsureContentMutation()
  const updateContentMutation = useUpdateContentMutation()
  const updateAssistantSettingsMutation = useUpdateAssistantSettingsMutation()
  const startAiSessionMutation = useStartContentAiSessionMutation()
  const sendAiMessageMutation = useSendContentAiMessageMutation()
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [editingItem, setEditingItem] =
    React.useState<ContentInvitationItem | null>(null)
  const [editingContent, setEditingContent] = React.useState<Content | null>(
    null
  )
  const [aiItem, setAiItem] = React.useState<ContentInvitationItem | null>(null)
  const [aiContent, setAiContent] = React.useState<Content | null>(null)
  const [aiSession, setAiSession] = React.useState<ContentAiSession | null>(
    null
  )

  const items = invitationsQuery.data?.items ?? []

  async function openEditor(item: ContentInvitationItem) {
    try {
      const response = await ensureContentMutation.mutateAsync(
        item.invitation.id
      )
      setEditingItem(item)
      setEditingContent(response.content)
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to open content editor."),
        variant: "destructive",
      })
    }
  }

  async function openAiGenerate(item: ContentInvitationItem) {
    try {
      const response = await ensureContentMutation.mutateAsync(
        item.invitation.id
      )
      setAiItem(item)
      setAiContent(response.content)
      setAiSession(null)
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to prepare AI generation."),
        variant: "destructive",
      })
    }
  }

  async function saveContent(input: ContentInput) {
    if (!editingContent) {
      return
    }

    try {
      const response = await updateContentMutation.mutateAsync({
        contentId: editingContent.id,
        input,
      })
      setEditingContent(response.content)
      closeEditor()
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to save content."),
        variant: "destructive",
      })
    }
  }

  async function saveAiContent(input: ContentInput) {
    if (!aiContent) {
      return
    }

    try {
      const response = await updateContentMutation.mutateAsync({
        contentId: aiContent.id,
        input,
      })
      setAiContent(response.content)
      setEditingItem(aiItem)
      setEditingContent(response.content)
      closeAiGenerate()

      if (editingContent?.id === response.content.id) {
        setEditingContent(response.content)
      }
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to save AI content."),
        variant: "destructive",
      })
    }
  }

  async function startAiSession(overview: string) {
    if (!aiContent) {
      return
    }

    try {
      const session = await startAiSessionMutation.mutateAsync({
        contentId: aiContent.id,
        overview,
      })
      setAiSession(session)
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to generate content."),
        variant: "destructive",
      })
    }
  }

  async function sendAiMessage(message: string) {
    if (!aiSession) {
      return
    }

    try {
      const session = await sendAiMessageMutation.mutateAsync({
        message,
        sessionId: aiSession.session.id,
      })
      setAiSession(session)
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to refine content."),
        variant: "destructive",
      })
    }
  }

  async function saveAssistantSettings(
    input: Omit<AssistantSettings, "id" | "updatedAt">
  ) {
    try {
      await updateAssistantSettingsMutation.mutateAsync(input)
      setIsSettingsOpen(false)
    } catch (error) {
      toast({
        title: getErrorMessage(error, "Unable to save assistant settings."),
        variant: "destructive",
      })
    }
  }

  function closeEditor() {
    setEditingItem(null)
    setEditingContent(null)
  }

  function closeAiGenerate() {
    setAiItem(null)
    setAiContent(null)
    setAiSession(null)
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Creator CRM</p>
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-semibold tracking-normal">
              Content
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Draft XHS posts for pending, scheduled, and completed invitations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
          <Button
            aria-label="Assistant settings"
            disabled={assistantSettingsQuery.isLoading}
            size="icon"
            title="Assistant settings"
            type="button"
            variant="outline"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings2 aria-hidden="true" />
          </Button>
          {externalTools.map((tool) => {
            const Icon = tool.icon

            return (
              <Button
                key={tool.href}
                asChild
                size="icon"
                type="button"
                variant="outline"
              >
                <a
                  aria-label={tool.label}
                  href={tool.href}
                  rel="noreferrer"
                  target="_blank"
                  title={tool.label}
                >
                  <Icon aria-hidden="true" />
                </a>
              </Button>
            )
          })}
        </div>
      </header>

      <ContentInvitationList
        isLoading={invitationsQuery.isLoading}
        items={items}
        onAiGenerate={openAiGenerate}
        onEdit={openEditor}
      />

      {editingItem && editingContent ? (
        <ContentEditorModal
          key={`${editingContent.id}-${editingContent.updatedAt}`}
          content={editingContent}
          invitation={editingItem.invitation}
          isSaving={updateContentMutation.isPending}
          onAiGenerate={() => void openAiGenerate(editingItem)}
          onClose={closeEditor}
          onSave={(input) => void saveContent(input)}
        />
      ) : null}

      {isSettingsOpen ? (
        <AssistantConfigModal
          isSaving={updateAssistantSettingsMutation.isPending}
          settings={assistantSettingsQuery.data?.settings ?? null}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(input) => void saveAssistantSettings(input)}
        />
      ) : null}

      {aiItem && aiContent && !aiSession ? (
        <ContentAiOverviewModal
          isGenerating={startAiSessionMutation.isPending}
          shopName={aiItem.invitation.shopName}
          onClose={closeAiGenerate}
          onGenerate={(overview) => void startAiSession(overview)}
        />
      ) : null}

      {aiItem && aiSession ? (
        <ContentAiChatModal
          isSending={sendAiMessageMutation.isPending}
          session={aiSession}
          shopName={aiItem.invitation.shopName}
          onClose={closeAiGenerate}
          onFreshSession={() => setAiSession(null)}
          onSave={(input) => void saveAiContent(input)}
          onSend={(message) => void sendAiMessage(message)}
        />
      ) : null}
    </main>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export { ContentPage }
