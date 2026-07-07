import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Coffee Break Suggestion Example
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ManualTrigger                      manualTrigger
// BuildSuggestion                    set
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ManualTrigger
//    → BuildSuggestion
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'qJI12j8B0V1SqhxZ',
    name: 'Coffee Break Suggestion Example',
    active: false,
    description: 'A simple credential-free example workflow that returns a coffee break suggestion.',
    isArchived: false,
    projectId: 'o7lAaWMwDhQuWY6j',
    settings: { executionOrder: 'v1' },
})
export class CoffeeBreakSuggestionExampleWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '4c12a4d6-c2c1-47b6-86b5-c0605fbbaea2',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [240, 300],
    })
    ManualTrigger = {};

    @node({
        id: 'c926040b-d171-43c9-800e-e877df818a22',
        name: 'Build Suggestion',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [520, 300],
    })
    BuildSuggestion = {
        mode: 'manual',
        assignments: {
            assignments: [
                {
                    id: 'suggestion-title',
                    name: 'title',
                    type: 'string',
                    value: 'Coffee break suggestion',
                },
                {
                    id: 'drink',
                    name: 'drink',
                    type: 'string',
                    value: 'Iced latte',
                },
                {
                    id: 'snack',
                    name: 'snack',
                    type: 'string',
                    value: 'Butter croissant',
                },
                {
                    id: 'duration',
                    name: 'durationMinutes',
                    type: 'number',
                    value: 15,
                },
                {
                    id: 'message',
                    name: 'message',
                    type: 'string',
                    value: 'Step away from the screen, drink water first, then enjoy a short coffee break.',
                },
            ],
        },
        includeOtherFields: false,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ManualTrigger.out(0).to(this.BuildSuggestion.in(0));
    }
}
