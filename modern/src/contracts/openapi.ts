// Note: requires zod-to-json-schema in devDependencies
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CaseCreateSchema,
  CaseUpdateSchema,
  CaseStatusChangeSchema,
  CaseUpdateCreateSchema,
} from './caseSchemas.js';
import { EmailIntakeSchema, WhatsAppIntakeSchema, IntakeSummarySchema } from './intakeSchemas.js';
import { RoleSchema } from './sessionSchemas.js';
import { DashboardSummarySchema } from './dashboardSchemas.js';

export function generateOpenApiDocument(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'CaseFlow API',
      version: '1.0.0',
      description: 'Modern support desk API replacing SuiteCRM Cases',
    },
    paths: {
      '/healthz': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { status: { type: 'string', enum: ['ok'] } },
                  },
                },
              },
            },
            '503': {
              description: 'Degraded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { status: { type: 'string', enum: ['degraded'] } },
                  },
                },
              },
            },
          },
        },
      },
      '/api/caseflow/session/role': {
        post: {
          summary: 'Set session role',
          requestBody: {
            content: { 'application/json': { schema: zodToJsonSchema(RoleSchema) } },
          },
          responses: {
            '200': { description: 'Role set' },
            '400': { description: 'Invalid role' },
          },
        },
      },
      '/api/caseflow/cases': {
        get: {
          summary: 'List cases',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string', enum: ['P1', 'P2', 'P3'] } },
            {
              name: 'channel',
              in: 'query',
              schema: { type: 'string', enum: ['Email', 'WhatsApp', 'Phone', 'Web'] },
            },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            {
              name: 'pageSize',
              in: 'query',
              schema: { type: 'integer', default: 25, maximum: 100 },
            },
          ],
          responses: { '200': { description: 'Paginated case list' } },
        },
        post: {
          summary: 'Create case',
          requestBody: {
            content: { 'application/json': { schema: zodToJsonSchema(CaseCreateSchema) } },
          },
          responses: {
            '201': { description: 'Case created' },
            '400': { description: 'Validation error' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}': {
        get: {
          summary: 'Get case detail',
          parameters: [
            { name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Case detail with updates and audit' },
            '404': { description: 'Not found' },
          },
        },
        patch: {
          summary: 'Update case',
          parameters: [
            { name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: { 'application/json': { schema: zodToJsonSchema(CaseUpdateSchema) } },
          },
          responses: {
            '200': { description: 'Case updated' },
            '404': { description: 'Not found' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}/status': {
        patch: {
          summary: 'Change case status',
          parameters: [
            { name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': { schema: zodToJsonSchema(CaseStatusChangeSchema) },
            },
          },
          responses: {
            '200': { description: 'Status changed' },
            '409': { description: 'Transition conflict' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}/updates': {
        post: {
          summary: 'Add case update',
          parameters: [
            { name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': { schema: zodToJsonSchema(CaseUpdateCreateSchema) },
            },
          },
          responses: { '201': { description: 'Update added' } },
        },
      },
      '/api/caseflow/intake/email': {
        post: {
          summary: 'Email intake',
          requestBody: {
            content: {
              'application/json': { schema: zodToJsonSchema(EmailIntakeSchema) },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Import summary' } },
        },
      },
      '/api/caseflow/intake/whatsapp': {
        post: {
          summary: 'WhatsApp intake',
          requestBody: {
            content: {
              'application/json': { schema: zodToJsonSchema(WhatsAppIntakeSchema) },
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { '200': { description: 'Import summary' } },
        },
      },
      '/api/caseflow/dashboard/summary': {
        get: {
          summary: 'Dashboard summary metrics',
          responses: {
            '200': {
              description: 'Dashboard metrics',
              content: {
                'application/json': { schema: zodToJsonSchema(DashboardSummarySchema) },
              },
            },
          },
        },
      },
      '/api/caseflow/openapi.json': {
        get: {
          summary: 'OpenAPI document',
          responses: { '200': { description: 'OpenAPI JSON' } },
        },
      },
    },
    components: {
      schemas: {
        Case: zodToJsonSchema(CaseCreateSchema),
        CaseUpdate: zodToJsonSchema(CaseUpdateCreateSchema),
        IntakeSummary: zodToJsonSchema(IntakeSummarySchema),
        DashboardSummary: zodToJsonSchema(DashboardSummarySchema),
      },
    },
  };
}
