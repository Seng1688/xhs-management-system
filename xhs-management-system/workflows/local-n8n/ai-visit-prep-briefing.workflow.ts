import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : xhs n8n tool - 'ai_visit_prep_briefing'
// Nodes   : 5  |  Connections: 3
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceiveInvitationPayload           webhook
// NormalizeVisitPayload              code
// GenerateVisitBriefing              agent                      [AI]
// ReturnBriefing                     respondToWebhook
// GoogleGeminiChatModel              lmChatGoogleGemini         [creds] [ai_languageModel]
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceiveInvitationPayload
//    → NormalizeVisitPayload
//      → GenerateVisitBriefing
//        → ReturnBriefing
//
// AI CONNECTIONS
// GenerateVisitBriefing.uses({ ai_languageModel: GoogleGeminiChatModel })
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'CjYqo4RjAtdL6T51',
    name: "xhs n8n tool - 'ai_visit_prep_briefing'",
    active: true,
    description:
        'Webhook workflow that uses an AI Agent to create a practical visit preparation brief from invitation data.',
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class XhsN8nToolAiVisitPrepBriefingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'c2b3f035-71dc-45d5-84c8-8bd4e7f22b9f',
        webhookId: 'xhs-ai-visit-prep-briefing',
        name: 'Receive Invitation Payload',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [240, 304],
    })
    ReceiveInvitationPayload = {
        httpMethod: 'POST',
        path: 'xhs-ai-visit-prep-briefing',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: '938b0874-56fa-4e25-969c-9a924565d697',
        name: 'Normalize Visit Payload',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [528, 304],
    })
    NormalizeVisitPayload = {
        jsCode: `const source = items[0]?.json ?? {};
const body = source.body ?? source;

const shop = body.shop ?? {};
const invitation = body.invitation ?? body;
const joiners = Array.isArray(body.joiners)
  ? body.joiners
  : Array.isArray(invitation.joiners)
    ? invitation.joiners
    : [];

const normalized = {
  invitationId: invitation.id ?? body.invitationId ?? null,
  shopName: shop.name ?? invitation.shopName ?? body.shopName ?? 'Unknown shop',
  address: shop.address ?? invitation.address ?? body.address ?? '',
  compensation: invitation.compensation ?? body.compensation ?? '',
  contactName: invitation.contactName ?? body.contactName ?? '',
  contactNumber: invitation.contactNumber ?? body.contactNumber ?? '',
  contactRole: invitation.contactRole ?? body.contactRole ?? '',
  status: invitation.status ?? body.status ?? 'scheduled',
  visitDatetime: invitation.visitDatetime ?? body.visitDatetime ?? '',
  visitType: invitation.visitType ?? body.visitType ?? '',
  campaign: invitation.campaign ?? body.campaign ?? '',
  notes: invitation.notes ?? invitation.remarks ?? body.notes ?? body.remarks ?? '',
  rawTextBackup: invitation.rawTextBackup ?? body.rawTextBackup ?? '',
  joiners: joiners.map((joiner) => ({
    name: joiner.name ?? '',
    email: joiner.email ?? '',
    sendEmail: joiner.sendEmail ?? true,
  })),
};

const prompt = [
  'You are an operations assistant for an XHS shop visit management system.',
  'Create a concise visit preparation brief for the invitation data below.',
  'Return ONLY a clean HTML fragment. Do not wrap it in markdown code fences. Do not include html, head, body, style, script, iframe, image, or external asset tags.',
  'Allowed tags: section, h2, h3, p, ul, ol, li, strong, em, small, div, span.',
  'Use compact, readable HTML that can be rendered inside a modal iframe.',
  '',
  'Use these sections:',
  '<section><h2>Visit summary</h2>...</section>',
  '<section><h2>Before visit checklist</h2><ul>...</ul></section>',
  '<section><h2>Questions to ask</h2><ul>...</ul></section>',
  '<section><h2>XHS content angles</h2><ul>...</ul></section>',
  '<section><h2>Joiner coordination</h2>...</section>',
  '<section><h2>Risks or missing info</h2><ul>...</ul></section>',
  '',
  'Keep it useful for a busy operator. Do not invent facts that are missing.',
  '',
  JSON.stringify(normalized, null, 2),
].join('\\n');

return [{ json: { normalized, prompt } }];`,
    };

    @node({
        id: '634e99da-4b83-4cfc-b26d-67ef43b42d87',
        name: 'Generate Visit Briefing',
        type: '@n8n/n8n-nodes-langchain.agent',
        version: 3.1,
        position: [800, 304],
    })
    GenerateVisitBriefing = {
        promptType: 'define',
        text: '={{ $json.prompt }}',
        options: {},
    };

    @node({
        id: '3d3099d8-c776-433f-b531-e9ed02052d52',
        name: 'Return Briefing',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1184, 304],
    })
    ReturnBriefing = {
        respondWith: 'json',
        responseBody: '={{ { ok: true, html: $json.output, text: $json.output, rawAgentResult: $json } }}',
        options: {},
    };

    @node({
        id: 'fb6f957b-9a91-48d0-aeab-164b3391f757',
        name: 'Google Gemini Chat Model',
        type: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
        version: 1.1,
        position: [672, 512],
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
        this.ReceiveInvitationPayload.out(0).to(this.NormalizeVisitPayload.in(0));
        this.NormalizeVisitPayload.out(0).to(this.GenerateVisitBriefing.in(0));
        this.GenerateVisitBriefing.out(0).to(this.ReturnBriefing.in(0));

        this.GenerateVisitBriefing.uses({
            ai_languageModel: this.GoogleGeminiChatModel.output,
        });
    }
}
