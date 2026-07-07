import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : xhs n8n tool - 'application_pdf_upload'
// Nodes   : 16  |  Connections: 17
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ReceiveApplicationUpload           webhook
// ValidateUpload                     code
// SearchApplicationFolder            googleDrive                [creds] [alwaysOutput]
// HasApplicationFolder               if
// UseExistingApplicationFolder       code
// CreateApplicationFolder            googleDrive                [creds]
// UseCreatedApplicationFolder        code
// SearchEmailFolder                  googleDrive                [creds] [alwaysOutput]
// HasEmailFolder                     if
// UseExistingEmailFolder             code
// PrepareEmailFolderCreation         code
// CreateEmailFolder                  googleDrive                [creds]
// UseCreatedEmailFolder              code
// UploadPdf                          googleDrive                [creds]
// BuildUploadResponse                code
// ReturnUploadResult                 respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ReceiveApplicationUpload
//    → ValidateUpload
//      → SearchApplicationFolder
//        → HasApplicationFolder
//          → UseExistingApplicationFolder
//            → SearchEmailFolder
//              → HasEmailFolder
//                → UseExistingEmailFolder
//                  → UploadPdf
//                    → BuildUploadResponse
//                      → ReturnUploadResult
//               .out(1) → PrepareEmailFolderCreation
//                  → CreateEmailFolder
//                    → UseCreatedEmailFolder
//                      → UploadPdf (↩ loop)
//         .out(1) → CreateApplicationFolder
//            → UseCreatedApplicationFolder
//              → SearchEmailFolder (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'QpBx3l45qldHzhbL',
    name: "xhs n8n tool - 'application_pdf_upload'",
    active: true,
    description:
        'Webhook workflow that accepts an email and uploaded PDF, ensures Google Drive application/email folders exist, then uploads the file.',
    isArchived: false,
    settings: { executionOrder: 'v1', availableInMCP: false, binaryMode: 'separate' },
})
export class XhsN8nToolApplicationPdfUploadWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '66fe19f3-0077-4268-8cfd-c6145328d262',
        webhookId: 'xhs-application-pdf-upload',
        name: 'Receive Application Upload',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [160, 368],
    })
    ReceiveApplicationUpload = {
        httpMethod: 'POST',
        path: 'xhs-application-pdf-upload',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: '77db93f5-8d7c-4b9f-83f3-4624a0d50ea4',
        name: 'Validate Upload',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, 368],
    })
    ValidateUpload = {
        jsCode: `const item = items[0] ?? {};
const body = item.json?.body ?? item.json ?? {};
const binary = item.binary ?? {};

const email = String(body.email ?? '').trim().toLowerCase();

if (!email) {
  throw new Error('Missing required multipart form-data field: email');
}

if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
  throw new Error('Invalid email format.');
}

const uploadedFileKey = binary.file ? 'file' : Object.keys(binary)[0];

if (!uploadedFileKey || !binary[uploadedFileKey]) {
  throw new Error('Missing required multipart form-data file field: file');
}

const uploadedFile = binary[uploadedFileKey];
const originalFileName = uploadedFile.fileName || 'application.pdf';
const mimeType = uploadedFile.mimeType || '';

if (!originalFileName.toLowerCase().endsWith('.pdf') && !mimeType.toLowerCase().includes('pdf')) {
  throw new Error('Only PDF uploads are accepted.');
}

const safeFileName = originalFileName
  .replace(/[\\\\/:*?"<>|]/g, '-')
  .replace(/\\s+/g, ' ')
  .trim() || 'application.pdf';

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const escapeDriveQueryValue = (value) => String(value).replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'");

return [
  {
    json: {
      email,
      emailFolderName: email,
      emailFolderNameForDriveQuery: escapeDriveQueryValue(email),
      originalFileName,
      uploadFileName: \`\${timestamp}_\${safeFileName}\`,
      applicationFolderName: 'application',
      applicationFolderQuery: "name = 'application' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      receivedAt: new Date().toISOString(),
    },
    binary: {
      file: uploadedFile,
    },
  },
];`,
    };

    @node({
        id: '81b9d468-4ccd-4272-a5ac-9ae9e8584b6b',
        name: 'Search Application Folder',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [720, 368],
        credentials: { googleDriveOAuth2Api: { id: 'NweFZnxuvRATyMEU', name: 'Google Drive account' } },
        alwaysOutputData: true,
    })
    SearchApplicationFolder = {
        resource: 'fileFolder',
        searchMethod: 'query',
        queryString: '={{ $json.applicationFolderQuery }}',
        limit: 1,
        filter: {},
        options: {
            fields: ['id', 'name', 'mimeType', 'webViewLink'],
        },
    };

    @node({
        id: '6f7e4bd2-031c-45d6-a190-8bb1d5a9a55e',
        name: 'Has Application Folder',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1008, 368],
    })
    HasApplicationFolder = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '893c5102-d272-41b7-bc33-4f3b0b301cb7',
                    leftValue: '={{ $json.id }}',
                    rightValue: '',
                    operator: {
                        type: 'string',
                        operation: 'exists',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'f7e1f27b-8224-4e88-86e2-e99b25bd5137',
        name: 'Use Existing Application Folder',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1280, 240],
    })
    UseExistingApplicationFolder = {
        jsCode: `function firstFromNode(name) {
  if (typeof $ === 'function') return $(name).first();
  return $items(name)[0];
}

const original = firstFromNode('Validate Upload');
const folder = $input.first().json;

return [
  {
    json: {
      ...original.json,
      applicationFolderId: folder.id,
      applicationFolderWebViewLink: folder.webViewLink ?? '',
      applicationFolderCreated: false,
      emailFolderQuery: \`name = '\${original.json.emailFolderNameForDriveQuery}' and mimeType = 'application/vnd.google-apps.folder' and '\${folder.id}' in parents and trashed = false\`,
    },
    binary: original.binary,
  },
];`,
    };

    @node({
        id: '253e83a1-d476-42a2-945e-b15ed2c6e6f1',
        name: 'Create Application Folder',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [1280, 480],
        credentials: { googleDriveOAuth2Api: { id: 'NweFZnxuvRATyMEU', name: 'Google Drive account' } },
    })
    CreateApplicationFolder = {
        resource: 'folder',
        name: 'application',
        driveId: {
            mode: 'list',
            value: 'My Drive',
            cachedResultName: 'My Drive',
        },
        options: {
            simplifyOutput: true,
        },
    };

    @node({
        id: '4871c918-a54f-4ca6-8cfc-e5e611778634',
        name: 'Use Created Application Folder',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1568, 480],
    })
    UseCreatedApplicationFolder = {
        jsCode: `function firstFromNode(name) {
  if (typeof $ === 'function') return $(name).first();
  return $items(name)[0];
}

const original = firstFromNode('Validate Upload');
const folder = $input.first().json;

return [
  {
    json: {
      ...original.json,
      applicationFolderId: folder.id,
      applicationFolderWebViewLink: folder.webViewLink ?? '',
      applicationFolderCreated: true,
      emailFolderQuery: \`name = '\${original.json.emailFolderNameForDriveQuery}' and mimeType = 'application/vnd.google-apps.folder' and '\${folder.id}' in parents and trashed = false\`,
    },
    binary: original.binary,
  },
];`,
    };

    @node({
        id: 'a79f33c1-a019-47f6-91ef-aa2d792b4791',
        name: 'Search Email Folder',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [1840, 368],
        credentials: { googleDriveOAuth2Api: { id: 'NweFZnxuvRATyMEU', name: 'Google Drive account' } },
        alwaysOutputData: true,
    })
    SearchEmailFolder = {
        resource: 'fileFolder',
        searchMethod: 'query',
        queryString: '={{ $json.emailFolderQuery }}',
        limit: 1,
        filter: {},
        options: {
            fields: ['id', 'name', 'mimeType', 'webViewLink'],
        },
    };

    @node({
        id: '4d1fbaf7-c559-4fbf-b281-73dc04a00574',
        name: 'Has Email Folder',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [2128, 368],
    })
    HasEmailFolder = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'e6fb7d05-43cf-43ce-936a-78283043d9f6',
                    leftValue: '={{ $json.id }}',
                    rightValue: '',
                    operator: {
                        type: 'string',
                        operation: 'exists',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: '4b206a7e-3ed1-4c50-9ecf-327b4b6475fd',
        name: 'Use Existing Email Folder',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2400, 240],
    })
    UseExistingEmailFolder = {
        jsCode: `function safeFirstFromNode(name) {
  try {
    if (typeof $ === 'function') return $(name).first();
    return $items(name)[0] ?? null;
  } catch {
    return null;
  }
}

const app = safeFirstFromNode('Use Existing Application Folder') ?? safeFirstFromNode('Use Created Application Folder');
const folder = $input.first().json;

if (!app) {
  throw new Error('Application folder context was not found.');
}

return [
  {
    json: {
      ...app.json,
      emailFolderId: folder.id,
      emailFolderWebViewLink: folder.webViewLink ?? '',
      emailFolderCreated: false,
    },
    binary: app.binary,
  },
];`,
    };

    @node({
        id: 'f4f70a25-efbf-4eb7-9fd2-f8a4c9ea64b4',
        name: 'Prepare Email Folder Creation',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2400, 480],
    })
    PrepareEmailFolderCreation = {
        jsCode: `function safeFirstFromNode(name) {
  try {
    if (typeof $ === 'function') return $(name).first();
    return $items(name)[0] ?? null;
  } catch {
    return null;
  }
}

const app = safeFirstFromNode('Use Existing Application Folder') ?? safeFirstFromNode('Use Created Application Folder');

if (!app?.json?.emailFolderName || !app?.json?.applicationFolderId) {
  throw new Error('Email folder creation context was not found.');
}

return [
  {
    json: app.json,
    binary: app.binary,
  },
];`,
    };

    @node({
        id: 'b1b26ea4-eddb-463a-9ce7-e7e7c59d3a31',
        name: 'Create Email Folder',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [2688, 480],
        credentials: { googleDriveOAuth2Api: { id: 'NweFZnxuvRATyMEU', name: 'Google Drive account' } },
    })
    CreateEmailFolder = {
        resource: 'folder',
        name: '={{ $json.emailFolderName }}',
        driveId: {
            mode: 'list',
            value: 'My Drive',
            cachedResultName: 'My Drive',
        },
        folderId: {
            mode: 'id',
            value: '={{ $json.applicationFolderId }}',
        },
        options: {
            simplifyOutput: true,
        },
    };

    @node({
        id: '28112725-8747-4966-8f67-ef2a9ab09b91',
        name: 'Use Created Email Folder',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2976, 480],
    })
    UseCreatedEmailFolder = {
        jsCode: `function safeFirstFromNode(name) {
  try {
    if (typeof $ === 'function') return $(name).first();
    return $items(name)[0] ?? null;
  } catch {
    return null;
  }
}

const app = safeFirstFromNode('Use Existing Application Folder') ?? safeFirstFromNode('Use Created Application Folder');
const folder = $input.first().json;

if (!app) {
  throw new Error('Application folder context was not found.');
}

return [
  {
    json: {
      ...app.json,
      emailFolderId: folder.id,
      emailFolderWebViewLink: folder.webViewLink ?? '',
      emailFolderCreated: true,
    },
    binary: app.binary,
  },
];`,
    };

    @node({
        id: '54ab5fb9-5b68-4145-8029-8d35be9b997c',
        name: 'Upload PDF',
        type: 'n8n-nodes-base.googleDrive',
        version: 3,
        position: [3264, 368],
        credentials: { googleDriveOAuth2Api: { id: 'NweFZnxuvRATyMEU', name: 'Google Drive account' } },
    })
    UploadPdf = {
        inputDataFieldName: 'file',
        name: '={{ $json.uploadFileName }}',
        driveId: {
            mode: 'list',
            value: 'My Drive',
            cachedResultName: 'My Drive',
        },
        folderId: {
            mode: 'id',
            value: '={{ $json.emailFolderId }}',
        },
        options: {
            simplifyOutput: true,
        },
    };

    @node({
        id: '81843e7a-0b42-4bce-a916-0c4baf19e20f',
        name: 'Build Upload Response',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3552, 368],
    })
    BuildUploadResponse = {
        jsCode: `function safeFirstFromNode(name) {
  try {
    if (typeof $ === 'function') return $(name).first();
    return $items(name)[0] ?? null;
  } catch {
    return null;
  }
}

const context = safeFirstFromNode('Use Existing Email Folder') ?? safeFirstFromNode('Use Created Email Folder');
const upload = $input.first().json;

if (!context) {
  throw new Error('Email folder context was not found.');
}

return [
  {
    json: {
      ok: true,
      email: context.json.email,
      applicationFolderId: context.json.applicationFolderId,
      applicationFolderCreated: context.json.applicationFolderCreated,
      emailFolderId: context.json.emailFolderId,
      emailFolderCreated: context.json.emailFolderCreated,
      fileId: upload.id,
      fileName: upload.name ?? context.json.uploadFileName,
      webViewLink: upload.webViewLink ?? '',
      uploadedAt: new Date().toISOString(),
    },
  },
];`,
    };

    @node({
        id: 'efca10df-17b2-4416-af6b-2ed9b90c5739',
        name: 'Return Upload Result',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [3840, 368],
    })
    ReturnUploadResult = {
        respondWith: 'json',
        responseBody: '={{ $json }}',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ReceiveApplicationUpload.out(0).to(this.ValidateUpload.in(0));
        this.ValidateUpload.out(0).to(this.SearchApplicationFolder.in(0));
        this.SearchApplicationFolder.out(0).to(this.HasApplicationFolder.in(0));
        this.HasApplicationFolder.out(0).to(this.UseExistingApplicationFolder.in(0));
        this.HasApplicationFolder.out(1).to(this.CreateApplicationFolder.in(0));
        this.CreateApplicationFolder.out(0).to(this.UseCreatedApplicationFolder.in(0));
        this.UseExistingApplicationFolder.out(0).to(this.SearchEmailFolder.in(0));
        this.UseCreatedApplicationFolder.out(0).to(this.SearchEmailFolder.in(0));
        this.SearchEmailFolder.out(0).to(this.HasEmailFolder.in(0));
        this.HasEmailFolder.out(0).to(this.UseExistingEmailFolder.in(0));
        this.HasEmailFolder.out(1).to(this.PrepareEmailFolderCreation.in(0));
        this.PrepareEmailFolderCreation.out(0).to(this.CreateEmailFolder.in(0));
        this.CreateEmailFolder.out(0).to(this.UseCreatedEmailFolder.in(0));
        this.UseExistingEmailFolder.out(0).to(this.UploadPdf.in(0));
        this.UseCreatedEmailFolder.out(0).to(this.UploadPdf.in(0));
        this.UploadPdf.out(0).to(this.BuildUploadResponse.in(0));
        this.BuildUploadResponse.out(0).to(this.ReturnUploadResult.in(0));
    }
}
