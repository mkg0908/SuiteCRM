import { Router } from 'express';
import { deriveStateFromStatus, isTransitionAllowed, isValidStatus, type Status } from '../domain/cases/status.js';
import { maskContactFields, type Role } from '../domain/privacy/privacyMapper.js';
import { parseEmailText } from '../domain/intake/emailParser.js';
import { parseWhatsAppExport } from '../domain/intake/whatsappParser.js';
import { classifyMessage, setKnownSenders } from '../domain/intake/triageRules.js';
import { CaseCreateSchema, CaseUpdateSchema, CaseStatusChangeSchema, CaseUpdateCreateSchema, CaseListQuerySchema } from '../contracts/caseSchemas.js';
import { EmailIntakeSchema, WhatsAppIntakeSchema } from '../contracts/intakeSchemas.js';
import { RoleSchema } from '../contracts/sessionSchemas.js';
import { logger } from '../observability/logger.js';

// ---- In-memory demo store ----
interface DemoCase {
  id: string;
  caseNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  state: string;
  type: string;
  channel: string;
  category: string;
  customerEmail: string;
  customerPhone: string;
  assignedUserId: string;
  assignedAgentName: string;
  normalizedSubject: string;
  duplicateOf: string | null;
  resolution: string | null;
  slaDueAt: string;
  firstResponseAt: string | null;
  isAtRisk: boolean;
  isBreached: boolean;
  dateCreated: string;
  dateModified: string;
  updates: Array<{ id: string; author: string; text: string; internal: boolean; createdAt: string }>;
  auditEvents: Array<{ id: string; user: string; field: string; oldValue: string | null; newValue: string | null; createdAt: string }>;
}

const agents = [
  { id: 'a1', name: 'Alice Chen', email: 'alice.chen@support.caseflow.dev' },
  { id: 'a2', name: 'Bob Martinez', email: 'bob.martinez@support.caseflow.dev' },
  { id: 'a3', name: 'Carol Okafor', email: 'carol.okafor@support.caseflow.dev' },
];

let nextSeq = 1016;
let sessionRole: Role = 'agent';

const demoCases: DemoCase[] = [
  {
    id: '1', caseNumber: 'CF-1001', subject: 'Payment page not loading', description: 'The payment page returns a 500 error when trying to checkout. Multiple customers affected.', priority: 'P1', status: 'Open_New', state: 'Open', type: 'Bug', channel: 'Email', category: 'Payment', customerEmail: 'priya@riverahotels.com', customerPhone: '415-555-0142', assignedUserId: 'a1', assignedAgentName: 'Alice Chen', normalizedSubject: 'payment page not loading', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 30 * 60000).toISOString(), firstResponseAt: null, isAtRisk: true, isBreached: false, dateCreated: new Date(Date.now() - 90 * 60000).toISOString(), dateModified: new Date(Date.now() - 5 * 60000).toISOString(),
    updates: [
      { id: 'u1', author: 'Alice Chen', text: 'Investigating the 500 error. Checking server logs for payment gateway timeout.', internal: false, createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
      { id: 'u2', author: 'Bob Martinez', text: 'Internal: Escalated to payment team. Stripe webhook endpoint returning 502.', internal: true, createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
    ],
    auditEvents: [
      { id: 'ae1', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1001', createdAt: new Date(Date.now() - 90 * 60000).toISOString() },
      { id: 'ae2', user: 'system', field: 'assignedUserId', oldValue: null, newValue: 'Alice Chen', createdAt: new Date(Date.now() - 90 * 60000).toISOString() },
    ],
  },
  {
    id: '2', caseNumber: 'CF-1002', subject: 'Cannot reset password', description: 'Password reset email never arrives. Checked spam folder.', priority: 'P2', status: 'Open_Assigned', state: 'Open', type: 'Bug', channel: 'Web', category: 'Authentication', customerEmail: 'dan.kim@techsolutions.io', customerPhone: '650-555-0198', assignedUserId: 'a2', assignedAgentName: 'Bob Martinez', normalizedSubject: 'cannot reset password', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 18 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 2 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 6 * 3600000).toISOString(), dateModified: new Date(Date.now() - 2 * 3600000).toISOString(),
    updates: [
      { id: 'u3', author: 'Bob Martinez', text: 'Checked email delivery logs. SendGrid shows the emails are being sent but bouncing. Investigating SPF records.', internal: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    ],
    auditEvents: [
      { id: 'ae3', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1002', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { id: 'ae4', user: 'system', field: 'status', oldValue: 'Open_New', newValue: 'Open_Assigned', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    ],
  },
  {
    id: '3', caseNumber: 'CF-1003', subject: 'Dashboard loading slowly', description: 'Dashboard takes over 30 seconds to load with 1000+ records.', priority: 'P2', status: 'Open_Assigned', state: 'Open', type: 'Bug', channel: 'Phone', category: 'Performance', customerEmail: 'lena.park@globalretail.com', customerPhone: '212-555-0167', assignedUserId: 'a3', assignedAgentName: 'Carol Okafor', normalizedSubject: 'dashboard loading slowly', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 12 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 4 * 3600000).toISOString(), dateModified: new Date(Date.now() - 1 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae5', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1003', createdAt: new Date(Date.now() - 4 * 3600000).toISOString() }],
  },
  {
    id: '4', caseNumber: 'CF-1004', subject: 'Feature request: dark mode', description: 'Would love to see dark mode in the dashboard for late-night work.', priority: 'P3', status: 'Open_New', state: 'Open', type: 'Feature Request', channel: 'WhatsApp', category: 'UI', customerEmail: 'omar.ali@startupventures.co', customerPhone: '415-555-0188', assignedUserId: 'a1', assignedAgentName: 'Alice Chen', normalizedSubject: 'feature request dark mode', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 48 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 2 * 3600000).toISOString(), dateModified: new Date(Date.now() - 2 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae6', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1004', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() }],
  },
  {
    id: '5', caseNumber: 'CF-1005', subject: 'Mobile app crashes on login', description: 'App crashes immediately after entering credentials on iOS 18.', priority: 'P1', status: 'Open_Assigned', state: 'Open', type: 'Bug', channel: 'Email', category: 'Mobile', customerEmail: 'sofia.reyes@designhub.net', customerPhone: '310-555-0134', assignedUserId: 'a2', assignedAgentName: 'Bob Martinez', normalizedSubject: 'mobile app crashes on login', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() - 30 * 60000).toISOString(), firstResponseAt: null, isAtRisk: true, isBreached: true, dateCreated: new Date(Date.now() - 3 * 3600000).toISOString(), dateModified: new Date(Date.now() - 20 * 60000).toISOString(),
    updates: [
      { id: 'u4', author: 'Bob Martinez', text: 'Reproduced on iOS 18.1. Crash log shows nil pointer in AuthManager. Working on fix.', internal: false, createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
    ],
    auditEvents: [{ id: 'ae7', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1005', createdAt: new Date(Date.now() - 3 * 3600000).toISOString() }],
  },
  {
    id: '6', caseNumber: 'CF-1006', subject: 'Invoice generation failing', description: 'Invoices show wrong tax calculation for California customers.', priority: 'P1', status: 'Open_Pending Input', state: 'Open', type: 'Bug', channel: 'Email', category: 'Billing', customerEmail: 'priya@riverahotels.com', customerPhone: '415-555-0142', assignedUserId: 'a1', assignedAgentName: 'Alice Chen', normalizedSubject: 'invoice generation failing', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 1 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 5 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 8 * 3600000).toISOString(), dateModified: new Date(Date.now() - 3 * 3600000).toISOString(),
    updates: [
      { id: 'u5', author: 'Alice Chen', text: 'Requested customer to provide sample invoices with incorrect tax amounts.', internal: false, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 'u6', author: 'Alice Chen', text: 'Internal: Tax API returns 8.5% but CA rate is 7.25%. Might be city-level tax issue.', internal: true, createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    ],
    auditEvents: [
      { id: 'ae8', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1006', createdAt: new Date(Date.now() - 8 * 3600000).toISOString() },
      { id: 'ae9', user: 'Alice Chen', field: 'status', oldValue: 'Open_Assigned', newValue: 'Open_Pending Input', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    ],
  },
  {
    id: '7', caseNumber: 'CF-1007', subject: 'API rate limiting too aggressive', description: 'Getting 429 errors after only 10 requests per minute on the Pro plan.', priority: 'P2', status: 'Open_Assigned', state: 'Open', type: 'Bug', channel: 'Web', category: 'API', customerEmail: 'marco.diaz@devshop.io', customerPhone: '503-555-0145', assignedUserId: 'a3', assignedAgentName: 'Carol Okafor', normalizedSubject: 'api rate limiting too aggressive', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 20 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 1 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 5 * 3600000).toISOString(), dateModified: new Date(Date.now() - 1 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae10', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1007', createdAt: new Date(Date.now() - 5 * 3600000).toISOString() }],
  },
  {
    id: '8', caseNumber: 'CF-1008', subject: 'Login page 404 error resolved', description: 'Fixed routing configuration for login page.', priority: 'P1', status: 'Closed_Closed', state: 'Closed', type: 'Bug', channel: 'Email', category: 'Authentication', customerEmail: 'dan.kim@techsolutions.io', customerPhone: '650-555-0198', assignedUserId: 'a1', assignedAgentName: 'Alice Chen', normalizedSubject: 'login page 404 error resolved', duplicateOf: null, resolution: 'Fixed nginx routing config to properly proxy /login to the SPA.', slaDueAt: new Date(Date.now() - 20 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 23 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 24 * 3600000).toISOString(), dateModified: new Date(Date.now() - 20 * 3600000).toISOString(),
    updates: [
      { id: 'u7', author: 'Alice Chen', text: 'Root cause: nginx config was missing a try_files directive for SPA routes. Deployed fix.', internal: false, createdAt: new Date(Date.now() - 20 * 3600000).toISOString() },
    ],
    auditEvents: [
      { id: 'ae11', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1008', createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
      { id: 'ae12', user: 'Alice Chen', field: 'status', oldValue: 'Open_Assigned', newValue: 'Closed_Closed', createdAt: new Date(Date.now() - 20 * 3600000).toISOString() },
    ],
  },
  {
    id: '9', caseNumber: 'CF-1009', subject: 'Checkout timeout fixed', description: 'Increased timeout for payment processing from 10s to 30s.', priority: 'P1', status: 'Closed_Closed', state: 'Closed', type: 'Bug', channel: 'Web', category: 'Payment', customerEmail: 'sofia.reyes@designhub.net', customerPhone: '310-555-0134', assignedUserId: 'a2', assignedAgentName: 'Bob Martinez', normalizedSubject: 'checkout timeout fixed', duplicateOf: null, resolution: 'Increased payment gateway timeout to 30s and added retry logic.', slaDueAt: new Date(Date.now() - 44 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 47 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 48 * 3600000).toISOString(), dateModified: new Date(Date.now() - 44 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae13', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1009', createdAt: new Date(Date.now() - 48 * 3600000).toISOString() }],
  },
  {
    id: '10', caseNumber: 'CF-1010', subject: 'Spam filter request not applicable', description: 'Feature not relevant for this account type.', priority: 'P3', status: 'Closed_Rejected', state: 'Closed', type: 'Feature Request', channel: 'Email', category: 'Email', customerEmail: 'marco.diaz@devshop.io', customerPhone: '503-555-0145', assignedUserId: 'a3', assignedAgentName: 'Carol Okafor', normalizedSubject: 'spam filter request not applicable', duplicateOf: null, resolution: 'Feature not available for starter plan accounts.', slaDueAt: new Date(Date.now() - 68 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 70 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 72 * 3600000).toISOString(), dateModified: new Date(Date.now() - 68 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae14', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1010', createdAt: new Date(Date.now() - 72 * 3600000).toISOString() }],
  },
  {
    id: '11', caseNumber: 'CF-1011', subject: 'Payment page not loading', description: 'Duplicate of CF-1001.', priority: 'P1', status: 'Closed_Duplicate', state: 'Closed', type: 'Bug', channel: 'WhatsApp', category: 'Payment', customerEmail: 'priya@riverahotels.com', customerPhone: '415-555-0142', assignedUserId: 'a2', assignedAgentName: 'Bob Martinez', normalizedSubject: 'payment page not loading', duplicateOf: 'CF-1001', resolution: null, slaDueAt: new Date(Date.now() - 1 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 1.5 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 2 * 3600000).toISOString(), dateModified: new Date(Date.now() - 1 * 3600000).toISOString(),
    updates: [], auditEvents: [
      { id: 'ae15', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1011', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'ae16', user: 'Bob Martinez', field: 'status', oldValue: 'Open_New', newValue: 'Closed_Duplicate', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
      { id: 'ae17', user: 'Bob Martinez', field: 'duplicateOf', oldValue: null, newValue: 'CF-1001', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
  },
  {
    id: '12', caseNumber: 'CF-1012', subject: 'How do I bulk import contacts', description: 'Need to import 500 contacts from a CSV file into the CRM.', priority: 'P3', status: 'Open_Assigned', state: 'Open', type: 'Question', channel: 'Email', category: 'Import', customerEmail: 'lena.park@globalretail.com', customerPhone: '212-555-0167', assignedUserId: 'a1', assignedAgentName: 'Alice Chen', normalizedSubject: 'how do i bulk import contacts', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 60 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 3 * 3600000).toISOString(), dateModified: new Date(Date.now() - 3 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae18', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1012', createdAt: new Date(Date.now() - 3 * 3600000).toISOString() }],
  },
  {
    id: '13', caseNumber: 'CF-1013', subject: 'Export to CSV broken', description: 'CSV export produces corrupted file with encoding issues on special characters.', priority: 'P2', status: 'Open_Assigned', state: 'Open', type: 'Bug', channel: 'Email', category: 'Export', customerEmail: 'omar.ali@startupventures.co', customerPhone: '415-555-0188', assignedUserId: 'a2', assignedAgentName: 'Bob Martinez', normalizedSubject: 'export to csv broken', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 15 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 7 * 3600000).toISOString(), dateModified: new Date(Date.now() - 4 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae19', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1013', createdAt: new Date(Date.now() - 7 * 3600000).toISOString() }],
  },
  {
    id: '14', caseNumber: 'CF-1014', subject: 'Calendar sync not working', description: 'Google Calendar integration stopped syncing events 2 days ago.', priority: 'P2', status: 'Closed_Closed', state: 'Closed', type: 'Bug', channel: 'Web', category: 'Integration', customerEmail: 'sofia.reyes@designhub.net', customerPhone: '310-555-0134', assignedUserId: 'a3', assignedAgentName: 'Carol Okafor', normalizedSubject: 'calendar sync not working', duplicateOf: null, resolution: 'Refreshed OAuth token and re-enabled sync.', slaDueAt: new Date(Date.now() - 10 * 3600000).toISOString(), firstResponseAt: new Date(Date.now() - 30 * 3600000).toISOString(), isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 36 * 3600000).toISOString(), dateModified: new Date(Date.now() - 10 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae20', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1014', createdAt: new Date(Date.now() - 36 * 3600000).toISOString() }],
  },
  {
    id: '15', caseNumber: 'CF-1015', subject: 'Notification preferences not saving', description: 'Email notification settings reset after page reload.', priority: 'P3', status: 'Open_New', state: 'Open', type: 'Bug', channel: 'WhatsApp', category: 'Settings', customerEmail: 'marco.diaz@devshop.io', customerPhone: '503-555-0145', assignedUserId: 'a3', assignedAgentName: 'Carol Okafor', normalizedSubject: 'notification preferences not saving', duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 65 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: new Date(Date.now() - 1 * 3600000).toISOString(), dateModified: new Date(Date.now() - 1 * 3600000).toISOString(),
    updates: [], auditEvents: [{ id: 'ae21', user: 'system', field: 'created', oldValue: null, newValue: 'CF-1015', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() }],
  },
];

// ---- Demo API routes ----
export const demoRouter = Router();

// Session role
demoRouter.post('/session/role', (req, res) => {
  try {
    const { role } = RoleSchema.parse(req.body);
    sessionRole = role;
    res.json({ role });
  } catch {
    res.status(400).json({ error: 'invalid_role', message: 'Role must be agent or manager' });
  }
});

// List cases
demoRouter.get('/cases', (req, res) => {
  const query = CaseListQuerySchema.parse(req.query);
  let filtered = [...demoCases];

  if (query.search) {
    const s = query.search.toLowerCase();
    filtered = filtered.filter(c => c.subject.toLowerCase().includes(s) || c.caseNumber.toLowerCase().includes(s));
  }
  if (query.status) filtered = filtered.filter(c => c.status === query.status);
  if (query.priority) filtered = filtered.filter(c => c.priority === query.priority);
  if (query.channel) filtered = filtered.filter(c => c.channel === query.channel);

  const total = filtered.length;
  const start = (query.page - 1) * query.pageSize;
  const cases = filtered.slice(start, start + query.pageSize).map(c => {
    const { updates, auditEvents, description, resolution, ...listFields } = c;
    return maskContactFields(listFields, sessionRole);
  });

  res.json({ cases, total, page: query.page, pageSize: query.pageSize });
});

// Get case detail
demoRouter.get('/cases/:caseNumber', (req, res) => {
  const c = demoCases.find(c => c.caseNumber === req.params.caseNumber);
  if (!c) return res.status(404).json({ error: 'not_found', message: `Case ${req.params.caseNumber} not found` });
  res.json(maskContactFields({ ...c }, sessionRole));
});

// Create case
demoRouter.post('/cases', (req, res) => {
  try {
    const input = CaseCreateSchema.parse(req.body);
    const caseNumber = `CF-${nextSeq++}`;
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const now = new Date().toISOString();
    const newCase: DemoCase = {
      id: String(demoCases.length + 1), caseNumber, subject: input.subject, description: input.description || '', priority: input.priority, status: 'Open_New', state: 'Open', type: input.type || 'Bug', channel: input.channel || 'Web', category: input.category || 'General', customerEmail: input.customerEmail || '', customerPhone: input.customerPhone || '', assignedUserId: agent.id, assignedAgentName: agent.name, normalizedSubject: input.subject.toLowerCase().replace(/[^\w\s]/g, '').trim(), duplicateOf: null, resolution: null,
      slaDueAt: new Date(Date.now() + (input.priority === 'P1' ? 2 : input.priority === 'P2' ? 24 : 72) * 3600000).toISOString(),
      firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: now, dateModified: now, updates: [],
      auditEvents: [
        { id: `ae-${Date.now()}`, user: 'system', field: 'created', oldValue: null, newValue: caseNumber, createdAt: now },
        { id: `ae-${Date.now() + 1}`, user: 'system', field: 'assignedUserId', oldValue: null, newValue: agent.name, createdAt: now },
      ],
    };
    demoCases.unshift(newCase);
    logger.info('Case created', { caseNumber });
    res.status(201).json({ case: newCase, duplicateSuggestion: null });
  } catch (err: any) {
    res.status(400).json({ error: 'validation_error', message: err.message });
  }
});

// Update case
demoRouter.patch('/cases/:caseNumber', (req, res) => {
  const c = demoCases.find(c => c.caseNumber === req.params.caseNumber);
  if (!c) return res.status(404).json({ error: 'not_found', message: 'Not found' });
  const input = CaseUpdateSchema.parse(req.body);
  const now = new Date().toISOString();
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) {
      c.auditEvents.push({ id: `ae-${Date.now()}`, user: 'system', field: k, oldValue: (c as any)[k], newValue: String(v), createdAt: now });
      (c as any)[k] = v;
    }
  }
  c.dateModified = now;
  res.json(maskContactFields({ ...c }, sessionRole));
});

// Change status
demoRouter.patch('/cases/:caseNumber/status', (req, res) => {
  const c = demoCases.find(c => c.caseNumber === req.params.caseNumber);
  if (!c) return res.status(404).json({ error: 'not_found', message: 'Not found' });
  try {
    const { status: targetStatus } = CaseStatusChangeSchema.parse(req.body);
    if (!isTransitionAllowed(c.status as Status, targetStatus as Status)) {
      return res.status(409).json({ error: 'transition_conflict', message: `Status transition from '${c.status}' to '${targetStatus}' is not allowed` });
    }
    const now = new Date().toISOString();
    c.auditEvents.push({ id: `ae-${Date.now()}`, user: 'system', field: 'status', oldValue: c.status, newValue: targetStatus, createdAt: now });
    c.status = targetStatus;
    c.state = deriveStateFromStatus(targetStatus);
    c.dateModified = now;
    res.json(maskContactFields({ ...c }, sessionRole));
  } catch (err: any) {
    res.status(400).json({ error: 'validation_error', message: err.message });
  }
});

// Add update
demoRouter.post('/cases/:caseNumber/updates', (req, res) => {
  const c = demoCases.find(c => c.caseNumber === req.params.caseNumber);
  if (!c) return res.status(404).json({ error: 'not_found', message: 'Not found' });
  const { text, internal } = CaseUpdateCreateSchema.parse(req.body);
  const now = new Date().toISOString();
  const update = { id: `u-${Date.now()}`, author: agents[0].name, text, internal: internal ?? false, createdAt: now };
  c.updates.push(update);
  c.auditEvents.push({ id: `ae-${Date.now()}`, user: agents[0].name, field: 'update_added', oldValue: null, newValue: internal ? 'internal' : 'public', createdAt: now });
  c.dateModified = now;
  if (!c.firstResponseAt) c.firstResponseAt = now;
  res.status(201).json(update);
});

// Email intake
demoRouter.post('/intake/email', (req, res) => {
  try {
    const { text } = EmailIntakeSchema.parse(req.body);
    const parsed = parseEmailText(text);
    const caseNumber = `CF-${nextSeq++}`;
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const now = new Date().toISOString();
    const newCase: DemoCase = {
      id: String(demoCases.length + 1), caseNumber, subject: parsed.subject || 'Untitled Email', description: parsed.body, priority: 'P2', status: 'Open_New', state: 'Open', type: 'Bug', channel: 'Email', category: 'Support', customerEmail: parsed.from || '', customerPhone: '', assignedUserId: agent.id, assignedAgentName: agent.name, normalizedSubject: (parsed.subject || '').toLowerCase(), duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + 24 * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: now, dateModified: now, updates: [],
      auditEvents: [{ id: `ae-${Date.now()}`, user: 'system', field: 'created', oldValue: null, newValue: caseNumber, createdAt: now }],
    };
    demoCases.unshift(newCase);
    let piiMasked = 0;
    if (parsed.from) piiMasked++;
    const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
    if (phoneMatch) piiMasked += phoneMatch.length;
    res.json({ messagesRead: 1, casesCreated: 1, updatesAttached: 0, chatterSkipped: 0, spamHeld: 0, piiMasked });
  } catch (err: any) {
    res.status(400).json({ error: 'validation_error', message: err.message });
  }
});

// WhatsApp intake
demoRouter.post('/intake/whatsapp', (req, res) => {
  try {
    const { text } = WhatsAppIntakeSchema.parse(req.body);
    const messages = parseWhatsAppExport(text);
    setKnownSenders(['sofia reyes', 'dan kim', 'lena park']);
    const summary = { messagesRead: messages.length, casesCreated: 0, updatesAttached: 0, chatterSkipped: 0, spamHeld: 0, piiMasked: 0 };

    for (const msg of messages) {
      if (msg.isSystemLine) continue;
      const classification = classifyMessage(msg.text, msg.sender);
      const emailMatches = msg.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      const phoneMatches = msg.text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
      if (emailMatches) summary.piiMasked += emailMatches.length;
      if (phoneMatches) summary.piiMasked += phoneMatches.length;

      if (classification === 'spam') { summary.spamHeld++; continue; }
      if (classification === 'chatter') { summary.chatterSkipped++; continue; }
      if (classification === 'me_too') { summary.updatesAttached++; continue; }

      const caseNumber = `CF-${nextSeq++}`;
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const now = new Date().toISOString();
      const pri = classification === 'urgent' ? 'P1' : classification === 'question' ? 'P2' : classification === 'feature' ? 'P3' : 'P2';
      demoCases.unshift({
        id: String(demoCases.length + 1), caseNumber, subject: msg.text.substring(0, 200), description: msg.text, priority: pri, status: 'Open_New', state: 'Open', type: classification === 'feature' ? 'Feature Request' : classification === 'question' ? 'Question' : 'Bug', channel: 'WhatsApp', category: 'Support', customerEmail: '', customerPhone: '', assignedUserId: agent.id, assignedAgentName: agent.name, normalizedSubject: msg.text.substring(0, 200).toLowerCase(), duplicateOf: null, resolution: null, slaDueAt: new Date(Date.now() + (pri === 'P1' ? 2 : pri === 'P2' ? 24 : 72) * 3600000).toISOString(), firstResponseAt: null, isAtRisk: false, isBreached: false, dateCreated: now, dateModified: now, updates: [],
        auditEvents: [{ id: `ae-${Date.now()}`, user: 'system', field: 'created', oldValue: null, newValue: caseNumber, createdAt: now }],
      });
      summary.casesCreated++;
    }
    res.json(summary);
  } catch (err: any) {
    res.status(400).json({ error: 'validation_error', message: err.message });
  }
});

// Dashboard
demoRouter.get('/dashboard/summary', (_req, res) => {
  const openCases = demoCases.filter(c => c.state === 'Open');
  const openByStatus: Record<string, number> = {};
  for (const c of openCases) openByStatus[c.status] = (openByStatus[c.status] || 0) + 1;

  const byChannel: Record<string, number> = {};
  for (const c of demoCases) byChannel[c.channel] = (byChannel[c.channel] || 0) + 1;

  const categoryMap: Record<string, number> = {};
  for (const c of demoCases) categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;

  const agentMap: Record<string, { name: string; count: number }> = {};
  for (const c of openCases) {
    if (!agentMap[c.assignedUserId]) agentMap[c.assignedUserId] = { name: c.assignedAgentName, count: 0 };
    agentMap[c.assignedUserId].count++;
  }

  const responded = demoCases.filter(c => c.firstResponseAt);
  const avgMs = responded.length > 0 ? responded.reduce((s, c) => s + (new Date(c.firstResponseAt!).getTime() - new Date(c.dateCreated).getTime()), 0) / responded.length : null;

  res.json({
    openByStatus,
    atRiskCount: openCases.filter(c => c.isAtRisk && !c.isBreached).length,
    breachedCount: openCases.filter(c => c.isBreached).length,
    byChannel,
    avgFirstResponseMs: avgMs,
    topCategories: Object.entries(categoryMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    casesPerAgent: Object.entries(agentMap).map(([agentId, { name, count }]) => ({ agentId, agentName: name, count })),
  });
});

// OpenAPI
import { generateOpenApiDocument } from '../contracts/openapi.js';
demoRouter.get('/openapi.json', (_req, res) => {
  res.json(generateOpenApiDocument());
});
