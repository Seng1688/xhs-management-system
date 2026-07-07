"use client"

import { Save, X } from "lucide-react"
import * as React from "react"

import { useEscapeKey } from "@/hooks/use-escape-key"
import type { AssistantSettings } from "@/lib/content"
import { Button } from "@workspace/ui/components/button"

type AssistantConfigInput = Omit<AssistantSettings, "id" | "updatedAt">

type AssistantConfigModalProps = {
  isSaving: boolean
  settings: AssistantSettings | null
  onClose: () => void
  onSave: (input: AssistantConfigInput) => void
}

const defaultBannedWords = [
  "很",
  "超级",
  "非常",
  "首",
  "第一",
  "绝对",
  "一定",
  "肯定",
  "顶",
  "推荐",
  "完美",
  "治愈",
  "最",
  "安全",
  "电话",
  "联系",
  "联络",
]

const defaultOutputPrompt = [
  "请按照以下格式输出小红书内容：",
  "",
  "1. 输出结构必须包含：",
  "- title",
  "- content",
  "- tagging",
  "",
  "2. title 规则：",
  "- 标题必须以 🇲🇾 开头",
  "- 标题少于 15 个字",
  "- 标题需要自然、有吸引力，但不要夸张",
  "",
  "3. content 规则：",
  "- 正文使用段落 + 列点混合",
  "- 可以在列点前加入合适 emoji",
  "- 内容要像真实体验分享，不要像广告",
  "- 避免过度夸张或承诺式表达",
  "",
  "4. tagging 规则：",
  "- 标签必须刚好 10 个",
  "- 每个标签必须是 #xxxx 格式",
  "- 标签要常见、热门、容易搜索",
  "- 标签可以混合不同语言，例如 #大阪 #Osaka",
].join("\n")

function AssistantConfigModal({
  isSaving,
  onClose,
  onSave,
  settings,
}: AssistantConfigModalProps) {
  const [language, setLanguage] = React.useState(
    settings?.language ?? "Simplified Chinese"
  )
  const [tone, setTone] = React.useState(
    settings?.tone ?? "sincere, casual, sharing angle"
  )
  const [minWords, setMinWords] = React.useState(settings?.minWords ?? 200)
  const [maxWords, setMaxWords] = React.useState(settings?.maxWords ?? 500)
  const [bannedWordsText, setBannedWordsText] = React.useState(
    (settings?.bannedWords ?? defaultBannedWords).join("、")
  )
  const [outputPrompt, setOutputPrompt] = React.useState(
    settings?.outputPrompt ?? defaultOutputPrompt
  )

  useEscapeKey(onClose, !isSaving)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      bannedWords: parseList(bannedWordsText),
      language,
      maxWords,
      minWords,
      outputPrompt,
      tone,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <form
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">
              Assistant settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Default rules for XHS post generation.
            </p>
          </div>
          <Button
            aria-label="Close assistant settings"
            disabled={isSaving}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Language
              <input
                className={inputClassName}
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Tone
              <input
                className={inputClassName}
                value={tone}
                onChange={(event) => setTone(event.target.value)}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Minimum words
              <input
                className={inputClassName}
                min={1}
                type="number"
                value={minWords}
                onChange={(event) => setMinWords(Number(event.target.value))}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Maximum words
              <input
                className={inputClassName}
                min={1}
                type="number"
                value={maxWords}
                onChange={(event) => setMaxWords(Number(event.target.value))}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Banned words
            <textarea
              className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={bannedWordsText}
              onChange={(event) => setBannedWordsText(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Output prompt
            <textarea
              className="min-h-72 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={outputPrompt}
              onChange={(event) => setOutputPrompt(event.target.value)}
            />
          </label>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border p-4">
          <Button disabled={isSaving} type="submit">
            <Save aria-hidden="true" />
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function parseList(value: string) {
  return value
    .split(/[,\n、，]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const inputClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export { AssistantConfigModal }
