import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : xhs n8n tool - 'ai_link_reader'
// Nodes   : 11  |  Connections: 10
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceiveLinkRequest                 webhook
// NormalizeLinkRequest               code
// IsImageUrl                         if
// AnalyzeImageWithGemini             googleGemini               [creds]
// BuildImageResponse                 code
// FetchLinkContent                   httpRequest
// BuildAiPrompt                      code
// ReadLinkWithAi                     agent                      [AI]
// BuildTextResponse                  code
// ReturnLinkSummary                  respondToWebhook
// GoogleGeminiChatModel              lmChatGoogleGemini         [creds] [ai_languageModel]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceiveLinkRequest
//    → NormalizeLinkRequest
//      → IsImageUrl
//        → AnalyzeImageWithGemini
//          → BuildImageResponse
//            → ReturnLinkSummary
//       .out(1) → FetchLinkContent
//          → BuildAiPrompt
//            → ReadLinkWithAi
//              → BuildTextResponse
//                → ReturnLinkSummary (↩ loop)
//
// AI CONNECTIONS
// ReadLinkWithAi.uses({ ai_languageModel: GoogleGeminiChatModel })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'KnM53LsgcvwylO8b',
    name: "xhs n8n tool - 'ai_link_reader'",
    active: true,
    description:
        'Webhook workflow that receives a URL, fetches the page content, asks AI to read it, and returns the result through the webhook response.',
    isArchived: false,
    projectId: 'o7lAaWMwDhQuWY6j',
    settings: { executionOrder: 'v1', availableInMCP: false, binaryMode: 'separate' },
})
export class XhsN8nToolAiLinkReaderWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '10f76869-e9e1-42e8-8cc9-4fbefad5b5a9',
        webhookId: 'xhs-ai-link-reader',
        name: 'Receive Link Request',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [160, 336],
    })
    ReceiveLinkRequest = {
        httpMethod: 'POST',
        path: 'xhs-ai-link-reader',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'ac887ba1-318e-4937-9cf8-029c039e4fd6',
        name: 'Normalize Link Request',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [384, 336],
    })
    NormalizeLinkRequest = {
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
const question = rawQuestion.trim();

if (!url) {
  throw new Error('Missing required field: url');
}

// Use a regex to check if it starts with http:// or https://
const urlRegex = /^https?:\\/\\/[^\\s$.?#].[^\\s]*$/i;

if (!urlRegex.test(url)) {
  const receivedShape = {
    sourceKeys: Object.keys(source),
    bodyType: typeof rawBody,
    bodyKeys: body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [],
  };
  throw new Error(\`Invalid URL or unsupported protocol: \${url}. Received shape: \${JSON.stringify(receivedShape)}\`);
}

return [
  {
    json: {
      url: url, // Directly pass the verified string
      question,
      isImageUrl: /\\.(png|jpe?g|webp|gif|bmp|tiff?)(\\?.*)?$/i.test(url),
      requestedAt: new Date().toISOString(),
    },
  },
];`,
    };

    @node({
        id: 'ffbde8d4-fdca-440a-86d4-e1fb9b0af845',
        name: 'Is Image URL',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [608, 336],
    })
    IsImageUrl = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '2c9115a9-4c25-4a82-b51d-39f3b28b0df1',
                    leftValue: '={{ $json.isImageUrl }}',
                    rightValue: true,
                    operator: {
                        type: 'boolean',
                        operation: 'equals',
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '8a4c3b65-3f2f-489d-a2ec-45d9d8a09820',
        name: 'Analyze Image With Gemini',
        type: '@n8n/n8n-nodes-langchain.googleGemini',
        version: 1.2,
        position: [1344, 192],
        credentials: { googlePalmApi: { id: 'ZoTbYnqZ8tyFoWs0', name: 'Google Gemini(PaLM) Api account' } },
    })
    AnalyzeImageWithGemini = {
        resource: 'image',
        operation: 'analyze',
        modelId: {
            mode: 'list',
            value: 'models/gemini-2.5-flash',
            cachedResultName: 'models/gemini-2.5-flash',
        },
        text: '={{ $json.question || "Read this image and summarize the visible content. If it is a form or document, list the visible sample fields." }}',
        imageUrls: '={{ $json.url }}',
        options: {},
    };

    @node({
        id: '94058f28-4c1a-418b-9888-1287666dfd40',
        name: 'Build Image Response',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1632, 192],
    })
    BuildImageResponse = {
        jsCode: `function firstFromNode(name) {
  if (typeof $ === 'function') return $(name).first();
  return $items(name)[0];
}

const request = firstFromNode('Normalize Link Request').json;
const result = $input.first().json;
const content = result.text ?? result.output ?? result.content ?? result.response ?? JSON.stringify(result);

return [
  {
    json: {
      ok: true,
      mode: 'image',
      url: request.url,
      question: request.question || null,
      content,
      rawGeminiResult: result,
      generatedAt: new Date().toISOString(),
    },
  },
];`,
    };

    @node({
        id: '51f6d9ab-af1c-4a82-b39a-0b4b1a976f73',
        name: 'Fetch Link Content',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [832, 496],
    })
    FetchLinkContent = {
        url: '={{ $json.url }}',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'User-Agent',
                    value: 'Mozilla/5.0 (compatible; n8n-link-reader/1.0)',
                },
                {
                    name: 'Accept',
                    value: 'text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
                },
            ],
        },
        options: {
            response: {
                response: {
                    responseFormat: 'text',
                },
            },
            timeout: 30000,
        },
    };

    @node({
        id: 'b4100e65-2834-404a-9cf3-cec42e862b1c',
        name: 'Build AI Prompt',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1056, 496],
    })
    BuildAiPrompt = {
        jsCode: `function firstFromNode(name) {
  if (typeof $ === 'function') return $(name).first();
  return $items(name)[0];
}

const request = firstFromNode('Normalize Link Request').json;
const fetched = $input.first().json;
const rawContent = typeof fetched === 'string'
  ? fetched
  : typeof fetched.data === 'string'
    ? fetched.data
    : typeof fetched.body === 'string'
      ? fetched.body
      : JSON.stringify(fetched);

const readableText = rawContent
  .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')
  .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\\s+/g, ' ')
  .trim()
  .slice(0, 18000);

const prompt = [
  'You are a careful web page reading assistant.',
  'Read the content fetched from the URL and return a useful concise summary.',
  'If the user included a question, answer that question using only the fetched content.',
  'Do not invent facts. Say when the page content is insufficient.',
  '',
  \`URL: \${request.url}\`,
  request.question ? \`User question: \${request.question}\` : 'User question: Summarize the useful content.',
  '',
  'Return the response in this structure:',
  '1. Short summary',
  '2. Key points',
  '3. Useful details',
  '4. Caveats or missing information',
  '',
  \`Fetched page text:\\n\${readableText || '[No readable text extracted]'}\`,
].join('\\n');

return [
  {
    json: {
      url: request.url,
      question: request.question,
      prompt,
      extractedCharacters: readableText.length,
    },
  },
];`,
    };

    @node({
        id: '582ae6cb-61af-4d66-bc4e-adc9b864a6c0',
        name: 'Read Link With AI',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3.1,
        position: [1280, 496],
    })
    ReadLinkWithAi = {
        promptType: 'define',
        text: '={{ $json.prompt }}',
        options: {},
    };

    @node({
        id: '8a3e4e1c-c0ea-488a-af71-bbd27c28a4c4',
        name: 'Build Text Response',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1632, 496],
    })
    BuildTextResponse = {
        jsCode: `function firstFromNode(name) {
  if (typeof $ === 'function') return $(name).first();
  return $items(name)[0];
}

const request = firstFromNode('Build AI Prompt').json;

return [
  {
    json: {
      ok: true,
      mode: 'text',
      url: request.url,
      question: request.question || null,
      content: $input.first().json.output,
      rawAgentResult: $input.first().json,
      generatedAt: new Date().toISOString(),
    },
  },
];`,
    };

    @node({
        id: 'ba09bdf8-1449-4ba1-9ab2-5b92b16e6b55',
        name: 'Return Link Summary',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1856, 336],
    })
    ReturnLinkSummary = {
        respondWith: 'json',
        responseBody: '={{ $json }}',
        options: {},
    };

    @node({
        id: 'b34ac280-11b3-412b-92e4-07cdb7756183',
        name: 'Google Gemini Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        version: 1.1,
        position: [1360, 720],
        credentials: { googlePalmApi: { id: 'ZoTbYnqZ8tyFoWs0', name: 'Google Gemini(PaLM) Api account' } },
    })
    GoogleGeminiChatModel = {
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ReceiveLinkRequest.out(0).to(this.NormalizeLinkRequest.in(0));
        this.NormalizeLinkRequest.out(0).to(this.IsImageUrl.in(0));
        this.IsImageUrl.out(0).to(this.AnalyzeImageWithGemini.in(0));
        this.IsImageUrl.out(1).to(this.FetchLinkContent.in(0));
        this.AnalyzeImageWithGemini.out(0).to(this.BuildImageResponse.in(0));
        this.BuildImageResponse.out(0).to(this.ReturnLinkSummary.in(0));
        this.FetchLinkContent.out(0).to(this.BuildAiPrompt.in(0));
        this.BuildAiPrompt.out(0).to(this.ReadLinkWithAi.in(0));
        this.ReadLinkWithAi.out(0).to(this.BuildTextResponse.in(0));
        this.BuildTextResponse.out(0).to(this.ReturnLinkSummary.in(0));

        this.ReadLinkWithAi.uses({
            ai_languageModel: this.GoogleGeminiChatModel.output,
        });
    }
}
