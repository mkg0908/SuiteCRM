/**
 * OpenAPI document generation from zod schemas
 */

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import {
  CaseSchema,
  CaseUpdateSchema,
  AccountRefSchema,
  AgentRefSchema,
  AuditEventSchema,
  CreateCaseSchema,
  UpdateCaseSchema,
  StatusTransitionSchema,
  CreateCaseUpdateSchema,
  CaseListQuerySchema,
} from './caseSchemas.js';
import { IntakeMessageSchema } from './intakeSchemas.js';
import { SetRoleSchema } from './sessionSchemas.js';
import { DashboardSummarySchema } from './dashboardSchemas.js';

function toJsonSchema(schema: z.ZodTypeAny, name: string): Record<string, unknown> {
  return zodToJsonSchema(schema, { name, $refStrategy: 'none' }) as Record<string, unknown>;
}

export function generateOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'CaseFlow API',
      version: '1.0.0',
      description: 'CaseFlow support desk REST API',
    },
    paths: {
      '/healthz': {
        get: {
          summary: 'Health check',
          responses: {
            '200': { description: 'Healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } } } } } },
            '503': { description: 'Degraded', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['degraded'] } } } } } },
          },
        },
      },
      '/api/caseflow/session/role': {
        post: {
          summary: 'Set session role',
          requestBody: { content: { 'application/json': { schema: toJsonSchema(SetRoleSchema, 'SetRole') } } },
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
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'channel', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 25, maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Case list' },
          },
        },
        post: {
          summary: 'Create case',
          requestBody: { content: { 'application/json': { schema: toJsonSchema(CreateCaseSchema, 'CreateCase') } } },
          responses: {
            '201': { description: 'Case created', content: { 'application/json': { schema: toJsonSchema(CaseSchema, 'Case') } } },
            '400': { description: 'Validation error' },
            '409': { description: 'No active agents' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}': {
        get: {
          summary: 'Get case detail',
          parameters: [{ name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Case detail with updates and audit events' },
            '404': { description: 'Case not found' },
          },
        },
        patch: {
          summary: 'Update case',
          parameters: [{ name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: toJsonSchema(UpdateCaseSchema, 'UpdateCase') } } },
          responses: {
            '200': { description: 'Case updated' },
            '404': { description: 'Case not found' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}/status': {
        patch: {
          summary: 'Transition case status',
          parameters: [{ name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: toJsonSchema(StatusTransitionSchema, 'StatusTransition') } } },
          responses: {
            '200': { description: 'Status updated' },
            '404': { description: 'Case not found' },
            '409': { description: 'Transition conflict' },
          },
        },
      },
      '/api/caseflow/cases/{caseNumber}/updates': {
        post: {
          summary: 'Add case update',
          parameters: [{ name: 'caseNumber', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: toJsonSchema(CreateCaseUpdateSchema, 'CreateCaseUpdate') } } },
          responses: {
            '201': { description: 'Update created' },
            '404': { description: 'Case not found' },
          },
        },
      },
      '/api/caseflow/intake/email': {
        post: {
          summary: 'Email intake',
          responses: {
            '200': { description: 'Intake summary' },
            '400': { description: 'Parse error' },
          },
        },
      },
      '/api/caseflow/intake/whatsapp': {
        post: {
          summary: 'WhatsApp intake',
          responses: {
            '200': { description: 'Intake summary' },
            '400': { description: 'Parse error' },
          },
        },
      },
      '/api/caseflow/dashboard/summary': {
        get: {
          summary: 'Dashboard summary',
          responses: {
            '200': { description: 'Dashboard metrics', content: { 'application/json': { schema: toJsonSchema(DashboardSummarySchema, 'DashboardSummary') } } },
          },
        },
      },
    },
    components: {
      schemas: {
        Case: toJsonSchema(CaseSchema, 'Case'),
        CaseUpdate: toJsonSchema(CaseUpdateSchema, 'CaseUpdate'),
        AccountRef: toJsonSchema(AccountRefSchema, 'AccountRef'),
        AgentRef: toJsonSchema(AgentRefSchema, 'AgentRef'),
        IntakeMessage: toJsonSchema(IntakeMessageSchema, 'IntakeMessage'),
        AuditEvent: toJsonSchema(AuditEventSchema, 'AuditEvent'),
      },
    },
  };
}
