import { asc, desc, eq, inArray } from "drizzle-orm"
import { AzureOpenAI } from "openai"

import { db } from "../../db/client.js"
import {
  contentAiMessages,
  contentAiSessions,
  contentAssistantSettings,
  contents,
  invitations,
  type ContentAiMessage,
  type ContentAssistantConfigSnapshot,
} from "../../db/schema/index.js"
import type {
  AddAiMessageDto,
  AssistantSettingsDto,
  ContentInputDto,
  StartAiSessionDto,
} from "./content.dto.js"

type GeneratedPost = {
  body: string
  changeSummary: {
    body: string[]
    tags: string[]
    title: string[]
  }
  tags: string[]
  title: string
}

const assistantSettingsId = "default"
const eligibleContentStatuses = [
  "Pending Review",
  "Scheduled",
  "Completed",
] as const

const defaultAssistantSettings: AssistantSettingsDto = {
  bannedWords: [
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
  ],
  language: "Simplified Chinese",
  maxWords: 500,
  minWords: 200,
  outputPrompt: [
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
  ].join("\n"),
  tone: "sincere, casual, sharing angle",
}

const generatedPostSchema = {
  additionalProperties: false,
  properties: {
    body: { type: "string" },
    changeSummary: {
      additionalProperties: false,
      properties: {
        body: {
          items: { type: "string" },
          type: "array",
        },
        tags: {
          items: { type: "string" },
          type: "array",
        },
        title: {
          items: { type: "string" },
          type: "array",
        },
      },
      required: ["title", "body", "tags"],
      type: "object",
    },
    tags: {
      items: { type: "string" },
      type: "array",
    },
    title: { type: "string" },
  },
  required: ["title", "body", "tags", "changeSummary"],
  type: "object",
} as const

async function listContentInvitations() {
  const rows = await db
    .select({
      content: contents,
      invitation: invitations,
    })
    .from(invitations)
    .leftJoin(contents, eq(contents.invitationId, invitations.id))
    .where(inArray(invitations.status, eligibleContentStatuses))
    .orderBy(desc(invitations.createdAt))

  return rows.map((row) => ({
    content: row.content,
    invitation: row.invitation,
  }))
}

async function getContentByInvitation(invitationId: string) {
  const [content] = await db
    .select()
    .from(contents)
    .where(eq(contents.invitationId, invitationId))
    .limit(1)

  return content
}

async function createContentForInvitation(
  invitationId: string,
  input: ContentInputDto
) {
  const existingContent = await getContentByInvitation(invitationId)

  if (existingContent) {
    return updateContent(existingContent.id, input)
  }

  const [content] = await db
    .insert(contents)
    .values({
      ...input,
      invitationId,
    })
    .returning()

  if (!content) {
    throw new Error("Failed to create content.")
  }

  return content
}

async function updateContent(id: string, input: ContentInputDto) {
  const [content] = await db
    .update(contents)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(contents.id, id))
    .returning()

  return content
}

async function ensureContentForInvitation(invitationId: string) {
  const existingContent = await getContentByInvitation(invitationId)

  if (existingContent) {
    return existingContent
  }

  const [content] = await db
    .insert(contents)
    .values({
      body: "",
      invitationId,
      tags: [],
      title: "",
    })
    .returning()

  if (!content) {
    throw new Error("Failed to prepare content.")
  }

  return content
}

async function getAssistantSettings() {
  const [settings] = await db
    .select()
    .from(contentAssistantSettings)
    .where(eq(contentAssistantSettings.id, assistantSettingsId))
    .limit(1)

  if (settings) {
    return settings
  }

  const [createdSettings] = await db
    .insert(contentAssistantSettings)
    .values({
      ...defaultAssistantSettings,
      id: assistantSettingsId,
    })
    .returning()

  if (!createdSettings) {
    throw new Error("Failed to initialize assistant settings.")
  }

  return createdSettings
}

async function updateAssistantSettings(input: Partial<AssistantSettingsDto>) {
  const currentSettings = await getAssistantSettings()
  const [settings] = await db
    .update(contentAssistantSettings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(contentAssistantSettings.id, currentSettings.id))
    .returning()

  if (!settings) {
    throw new Error("Failed to update assistant settings.")
  }

  return settings
}

async function startAiSession(contentId: string, { overview }: StartAiSessionDto) {
  const content = await getContent(contentId)

  if (!content) {
    return undefined
  }

  const settings = await getAssistantSettings()
  const assistantConfigSnapshot = toAssistantConfigSnapshot(settings)
  const firstUserMessage = [
    "User request a XHS post by providing the following overview:",
    overview,
  ].join("\n\n")

  const session = await db.transaction(async (tx) => {
    const [createdSession] = await tx
      .insert(contentAiSessions)
      .values({
        assistantConfigSnapshot,
        contentId: content.id,
        invitationId: content.invitationId,
        overview,
      })
      .returning()

    if (!createdSession) {
      throw new Error("Failed to create AI session.")
    }

    await tx.insert(contentAiMessages).values({
      message: firstUserMessage,
      role: "user",
      sessionId: createdSession.id,
    })

    return createdSession
  })

  const generatedPost = await generatePost({
    assistantConfig: assistantConfigSnapshot,
    history: [],
    latestUserMessage: firstUserMessage,
    overview,
    previousGeneratedPost: null,
  })

  await db.insert(contentAiMessages).values({
    changeSummary: generatedPost.changeSummary,
    generatedBody: generatedPost.body,
    generatedTags: generatedPost.tags,
    generatedTitle: generatedPost.title,
    message: "Generated XHS post draft.",
    role: "assistant",
    sessionId: session.id,
  })

  return getAiSession(session.id)
}

async function getAiSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(contentAiSessions)
    .where(eq(contentAiSessions.id, sessionId))
    .limit(1)

  if (!session) {
    return undefined
  }

  const messages = await getAiSessionMessages(session.id)

  return {
    messages,
    session,
  }
}

async function addAiSessionMessage(
  sessionId: string,
  { message }: AddAiMessageDto
) {
  const currentSession = await getAiSession(sessionId)

  if (!currentSession) {
    return undefined
  }

  const previousGeneratedPost = getLatestGeneratedPost(currentSession.messages)

  await db.insert(contentAiMessages).values({
    message,
    role: "user",
    sessionId,
  })

  const generatedPost = await generatePost({
    assistantConfig: currentSession.session.assistantConfigSnapshot,
    history: currentSession.messages,
    latestUserMessage: message,
    overview: currentSession.session.overview,
    previousGeneratedPost,
  })

  await db.insert(contentAiMessages).values({
    changeSummary: generatedPost.changeSummary,
    generatedBody: generatedPost.body,
    generatedTags: generatedPost.tags,
    generatedTitle: generatedPost.title,
    message: "Refined XHS post draft.",
    role: "assistant",
    sessionId,
  })

  return getAiSession(sessionId)
}

async function getContent(id: string) {
  const [content] = await db
    .select()
    .from(contents)
    .where(eq(contents.id, id))
    .limit(1)

  return content
}

async function getAiSessionMessages(sessionId: string) {
  return db
    .select()
    .from(contentAiMessages)
    .where(eq(contentAiMessages.sessionId, sessionId))
    .orderBy(asc(contentAiMessages.createdAt))
}

function getLatestGeneratedPost(messages: ContentAiMessage[]) {
  const assistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.generatedTitle)

  if (
    !assistantMessage?.generatedTitle ||
    !assistantMessage.generatedBody ||
    !assistantMessage.generatedTags
  ) {
    return null
  }

  return {
    body: assistantMessage.generatedBody,
    tags: assistantMessage.generatedTags,
    title: assistantMessage.generatedTitle,
  }
}

function toAssistantConfigSnapshot(
  settings: Awaited<ReturnType<typeof getAssistantSettings>>
): ContentAssistantConfigSnapshot {
  return {
    bannedWords: settings.bannedWords,
    language: settings.language,
    maxWords: settings.maxWords,
    minWords: settings.minWords,
    outputPrompt: settings.outputPrompt,
    tone: settings.tone,
  }
}

async function generatePost({
  assistantConfig,
  history,
  latestUserMessage,
  overview,
  previousGeneratedPost,
}: {
  assistantConfig: ContentAssistantConfigSnapshot
  history: ContentAiMessage[]
  latestUserMessage: string
  overview: string
  previousGeneratedPost: { body: string; tags: string[]; title: string } | null
}): Promise<GeneratedPost> {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT

  if (!apiKey || !endpoint || !apiVersion || !deployment) {
    throw new Error(
      "AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION, and AZURE_OPENAI_CHAT_DEPLOYMENT are required for AI generation."
    )
  }

  const client = new AzureOpenAI({
    apiKey,
    apiVersion,
    deployment,
    endpoint,
  })

  const response = await client.chat.completions.create({
    messages: [
      {
        content: buildSystemPrompt(assistantConfig),
        role: "system",
      },
      {
        content: buildGenerationPrompt({
          history,
          latestUserMessage,
          overview,
          previousGeneratedPost,
        }),
        role: "user",
      },
    ],
    model: deployment,
    response_format: {
      json_schema: {
        name: "xhs_content_generation",
        schema: generatedPostSchema,
        strict: true,
      },
      type: "json_schema",
    },
  })

  const outputText = response.choices[0]?.message.content

  if (!outputText) {
    throw new Error("AI response did not include content.")
  }

  return normalizeGeneratedPost(JSON.parse(outputText) as GeneratedPost)
}

function buildSystemPrompt(assistantConfig: ContentAssistantConfigSnapshot) {
  return [
    "You are an XHS content writing assistant.",
    "Return only JSON that matches the provided schema.",
    "Use the assistant configuration for every response.",
    `Language: ${assistantConfig.language}`,
    `Tone: ${assistantConfig.tone}`,
    `Minimum words: ${assistantConfig.minWords}`,
    `Maximum words: ${assistantConfig.maxWords}`,
    `Banned words: ${assistantConfig.bannedWords.join("、")}`,
    "Output rules:",
    assistantConfig.outputPrompt,
    "The title, body, and tags are the final public XHS post.",
    "Never mention revision history, previous responses, changed sections, improvements, or what you adjusted inside title, body, or tags.",
    "The user should not see any editing commentary inside the generated post content.",
    "If banned words appear in your draft, rewrite before returning.",
    "The changeSummary must contain only actual changes in short point form.",
    "All revision commentary belongs only in changeSummary.",
    "Do not mention unchanged title, body, or tags. Use an empty array for unchanged sections.",
    "If this is the first generation, summarize only the key created parts in short point form.",
  ].join("\n\n")
}

function buildGenerationPrompt({
  history,
  latestUserMessage,
  overview,
  previousGeneratedPost,
}: {
  history: ContentAiMessage[]
  latestUserMessage: string
  overview: string
  previousGeneratedPost: { body: string; tags: string[]; title: string } | null
}) {
  return [
    "<overview>",
    overview,
    "</overview>",
    previousGeneratedPost
      ? `<previous_generated_post>\n${JSON.stringify(previousGeneratedPost, null, 2)}\n</previous_generated_post>`
      : "<previous_generated_post>null</previous_generated_post>",
    "<conversation_history>",
    JSON.stringify(
      history.map((message) => ({
        body: message.generatedBody,
        message: message.message,
        role: message.role,
        tags: message.generatedTags,
        title: message.generatedTitle,
      })),
      null,
      2
    ),
    "</conversation_history>",
    "<latest_user_message>",
    latestUserMessage,
    "</latest_user_message>",
    "<task>",
    "Generate or refine the XHS post. Return title, body, tags, and changeSummary.",
    "title, body, and tags must be clean publishable content only. Do not include explanations of what changed.",
    "In changeSummary, include only actual changes and omit unchanged sections by returning empty arrays.",
    "</task>",
  ].join("\n\n")
}

function normalizeGeneratedPost(payload: GeneratedPost): GeneratedPost {
  return {
    body: payload.body,
    changeSummary: {
      body: normalizeChangeItems(payload.changeSummary?.body ?? []),
      tags: normalizeChangeItems(payload.changeSummary?.tags ?? []),
      title: normalizeChangeItems(payload.changeSummary?.title ?? []),
    },
    tags: payload.tags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
    title: payload.title,
  }
}

function normalizeChangeItems(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => !/^no (change|changes)$/i.test(item))
    .filter((item) => !/^(unchanged|无变化|没有变化|未更改)$/i.test(item))
}

export {
  createContentForInvitation,
  ensureContentForInvitation,
  getAiSession,
  getAssistantSettings,
  getContentByInvitation,
  listContentInvitations,
  startAiSession,
  addAiSessionMessage,
  updateAssistantSettings,
  updateContent,
}
