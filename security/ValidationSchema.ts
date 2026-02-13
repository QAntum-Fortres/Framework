
import { z } from 'zod';

/**
 * 🛡️ VORTEX SECURITY: VALIDATION SCHEMAS
 * Purpose: Guard the core against malformed inputs and data corruption.
 */

// 1. Webhook Payload Schema
export const WebhookPayloadSchema = z.object({
    ref: z.string(),
    before: z.string(),
    after: z.string(),
    repository: z.object({
        name: z.string(),
        full_name: z.string(),
        owner: z.object({
            name: z.string().optional(),
            login: z.string()
        }),
        url: z.string().url()
    }),
    pusher: z.object({
        name: z.string(),
        email: z.string().email().optional()
    }),
    commits: z.array(z.object({
        id: z.string(),
        message: z.string(),
        timestamp: z.string(),
        url: z.string().url(),
        author: z.object({
            name: z.string(),
            email: z.string().email().optional()
        }),
        added: z.array(z.string()),
        removed: z.array(z.string()),
        modified: z.array(z.string())
    }))
});

// 2. Module Manifest Schema
export const ModuleManifestSchema = z.object({
    id: z.string(),
    name: z.string(),
    version: z.string(),
    type: z.enum(['CORE', 'MODULE', 'ADAPTER', 'INTERFACE']),
    path: z.string(),
    exports: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
});

// 3. Vector Document Schema (for LanceDB/Pinecone)
export const VectorDocumentSchema = z.object({
    id: z.string(),
    content: z.string().min(1),
    metadata: z.record(z.any()).optional(),
    embedding: z.array(z.number()).optional()
});

// 4. CLI Argument Schema
export const CLIArgsSchema = z.object({
    command: z.string(),
    target: z.string().optional(),
    verbose: z.boolean().optional(),
    format: z.enum(['json', 'text', 'markdown']).default('text')
});

// Export Type Definitions derived from Schemas
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type ModuleManifest = z.infer<typeof ModuleManifestSchema>;
export type VectorDocument = z.infer<typeof VectorDocumentSchema>;
export type CLIArgs = z.infer<typeof CLIArgsSchema>;
