import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : xhs n8n tool - 'ai_agentic_link_reader'
// Nodes   : 8  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceiveAgenticLinkRequest          webhook
// NormalizeAgenticLinkRequest        code
// LinkRouterAgent                    agent                      [AI]
// ReturnAgenticLinkResult            respondToWebhook
// GoogleGeminiChatModel              lmChatGoogleGemini         [creds] [ai_languageModel]
// AnalyzeImageUrlTool                googleGeminiTool           [creds] [ai_tool]
// AnalyzeDocumentUrlTool             googleGeminiTool           [creds] [ai_tool]
// ReadWebpageTextTool                httpRequestTool            [ai_tool]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceiveAgenticLinkRequest
//    → NormalizeAgenticLinkRequest
//      → LinkRouterAgent
//        → ReturnAgenticLinkResult
//
// AI CONNECTIONS
// LinkRouterAgent.uses({ ai_languageModel: GoogleGeminiChatModel, ai_tool: [AnalyzeImageUrlTool, AnalyzeDocumentUrlTool, ReadWebpageTextTool] })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'R16Oxe2ZEOctmxax',
    name: "xhs n8n tool - 'ai_agentic_link_reader'",
    active: true,
    description:
        'Experimental webhook workflow where an AI Agent decides whether a URL is an image, document, or webpage, calls the matching tool, and returns the result.',
    isArchived: false,
    settings: { executionOrder: 'v1', availableInMCP: false },
})
export class XhsN8nToolAiAgenticLinkReaderWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '9efc0d0e-1bc9-4214-840e-5468a8037c3e',
        webhookId: 'xhs-ai-agentic-link-reader',
        name: 'Receive Agentic Link Request',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [160, 320],
    })
    ReceiveAgenticLinkRequest = {
        httpMethod: 'POST',
        path: 'xhs-ai-agentic-link-reader',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'a43e1293-72b1-4796-94d2-3bb62e0129fb',
        name: 'Normalize Agentic Link Request',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, 320],
    })
    NormalizeAgenticLinkRequest = {
        jsCode: `const source = items[0]?.json ?? {};

function tryParseJson(value) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  }

  return '';
}

const parsedSource = tryParseJson(source);
const rawBody = parsedSource.body ?? parsedSource;
const body = tryParseJson(rawBody);
const nestedBody = tryParseJson(body?.body);
const query = parsedSource.query ?? body?.query ?? {};
const params = parsedSource.params ?? body?.params ?? {};

const rawUrl = firstString(
  body?.url,
  body?.link,
  body?.text,
  nestedBody?.url,
  nestedBody?.link,
  nestedBody?.text,
  query.url,
  query.link,
  query.text,
  params.url,
  params.link,
  params.text,
  parsedSource.url,
  parsedSource.link,
  parsedSource.text
);

const rawQuestion = firstString(
  body?.question,
  body?.prompt,
  nestedBody?.question,
  nestedBody?.prompt,
  query.question,
  query.prompt,
  params.question,
  params.prompt,
  parsedSource.question,
  parsedSource.prompt
);

const url = rawUrl.trim().replace(/^<|>$/g, '');
const question = rawQuestion.trim() || 'Read this URL and summarize the useful content.';

if (!url) {
  throw new Error('Missing required field: url');
}

const urlRegex = /^https?:\\/\\/[^\\s$.?#].[^\\s]*$/i;

if (!urlRegex.test(url)) {
  throw new Error(\`Invalid URL or unsupported protocol: \${url}\`);
}

const prompt = [
  'You are a universal link reader and tool router.',
  '',
  'You must inspect the URL and choose the best tool.',
  'Rules:',
  '1. If the URL appears to be an image, call AnalyzeImageUrlTool.',
  '2. If the URL appears to be a PDF, DOC, DOCX, TXT, or other document, call AnalyzeDocumentUrlTool.',
  '3. If the URL appears to be a normal webpage, call ReadWebpageTextTool.',
  '4. If the URL type is unclear, infer from the URL. Prefer image/document tools for known file extensions.',
  '5. Never call the webpage text tool for image URLs.',
  '6. Use only the selected tool result to answer the user question.',
  '7. Return concise JSON text with keys: mode, url, question, content, confidence, caveats.',
  '',
  \`URL: \${url}\`,
  \`Question: \${question}\`,
].join('\\n');

return [
  {
    json: {
      url,
      question,
      prompt,
      requestedAt: new Date().toISOString(),
    },
  },
];`,
    };

    @node({
        id: 'cd6d86b0-c758-4acd-95c2-47ee425d0f56',
        name: 'Link Router Agent',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3.1,
        position: [736, 320],
    })
    LinkRouterAgent = {
        promptType: 'define',
        text: '={{ $json.prompt }}',
        options: {},
    };

    @node({
        id: '339da4c1-27f8-48e7-b529-0a84d671672f',
        name: 'Return Agentic Link Result',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1024, 320],
    })
    ReturnAgenticLinkResult = {
        respondWith: 'json',
        responseBody:
            '={{ { ok: true, url: $("Normalize Agentic Link Request").first().json.url, question: $("Normalize Agentic Link Request").first().json.question, content: $json.output, rawAgentResult: $json, generatedAt: new Date().toISOString() } }}',
        options: {},
    };

    @node({
        id: '3645c20b-4952-46f1-b8d3-6c9d0ebdd185',
        name: 'Google Gemini Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        version: 1.1,
        position: [608, 560],
        credentials: { googlePalmApi: { id: 'ZoTbYnqZ8tyFoWs0', name: 'Google Gemini(PaLM) Api account' } },
    })
    GoogleGeminiChatModel = {
        modelName: 'models/gemini-2.5-flash',
        options: {},
    };

    @node({
        id: 'eef28f5e-a0a7-4f70-8f7d-06aec30f84cf',
        name: 'Analyze Image URL Tool',
        type: '@n8n/n8n-nodes-langchain.googleGeminiTool',
        version: 1.2,
        position: [832, 560],
        credentials: { googlePalmApi: { id: 'ZoTbYnqZ8tyFoWs0', name: 'Google Gemini(PaLM) Api account' } },
    })
    AnalyzeImageUrlTool = {
        resource: 'image',
        operation: 'analyze',
        modelId: {
            mode: 'list',
            value: 'models/gemini-2.5-flash',
            cachedResultName: 'models/gemini-2.5-flash',
        },
        text: '={{ $json.question || "Analyze this image and summarize visible content. If it is a form or document image, list visible fields." }}',
        inputType: 'url',
        imageUrls: '={{ $json.url }}',
        simplify: true,
        descriptionType: 'manual',
        toolDescription:
            'Use this tool only for image URLs such as PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF. It analyzes image content from the provided URL and answers the user question.',
        options: {},
    };

    @node({
        id: 'c9f4c3bb-a2cc-4b82-bc17-98c1bf2b6b85',
        name: 'Analyze Document URL Tool',
        type: '@n8n/n8n-nodes-langchain.googleGeminiTool',
        version: 1.2,
        position: [1056, 560],
        credentials: { googlePalmApi: { id: 'ZoTbYnqZ8tyFoWs0', name: 'Google Gemini(PaLM) Api account' } },
    })
    AnalyzeDocumentUrlTool = {
        resource: 'document',
        operation: 'analyze',
        modelId: {
            mode: 'list',
            value: 'models/gemini-2.5-flash',
            cachedResultName: 'models/gemini-2.5-flash',
        },
        text: '={{ $json.question || "Analyze this document and summarize the useful content." }}',
        inputType: 'url',
        documentUrls: '={{ $json.url }}',
        simplify: true,
        descriptionType: 'manual',
        toolDescription:
            'Use this tool only for document URLs such as PDF, DOC, DOCX, TXT, CSV, or other document-like files. It analyzes document content from the provided URL and answers the user question.',
        options: {},
    };

    @node({
        id: '1fd4e9b8-f3f8-4f50-b27c-d1b99e65fdd9',
        name: 'Read Webpage Text Tool',
        type: 'n8n-nodes-base.httpRequestTool',
        version: 4.4,
        position: [1280, 560],
    })
    ReadWebpageTextTool = {
        toolDescription:
            'Use this tool only for normal HTML or text webpages. Do not use it for image or document file URLs. It fetches readable webpage text for the agent to summarize.',
        method: 'GET',
        url: '={{ $json.url }}',
        authentication: 'none',
        sendHeaders: true,
        specifyHeaders: 'keypair',
        nodeCredentialType: '',
        genericAuthType: '',
        headerParameters: {
            parameters: [
                {
                    name: 'User-Agent',
                    value: 'Mozilla/5.0 (compatible; n8n-agentic-link-reader/1.0)',
                },
                {
                    name: 'Accept',
                    value: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
                },
            ],
        },
        optimizeResponse: true,
        responseType: 'html',
        onlyContent: true,
        truncateResponse: true,
        maxLength: 18000,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ReceiveAgenticLinkRequest.out(0).to(this.NormalizeAgenticLinkRequest.in(0));
        this.NormalizeAgenticLinkRequest.out(0).to(this.LinkRouterAgent.in(0));
        this.LinkRouterAgent.out(0).to(this.ReturnAgenticLinkResult.in(0));

        this.LinkRouterAgent.uses({
            ai_languageModel: this.GoogleGeminiChatModel.output,
            ai_tool: [
                this.AnalyzeImageUrlTool.output,
                this.AnalyzeDocumentUrlTool.output,
                this.ReadWebpageTextTool.output,
            ],
        });
    }
}
