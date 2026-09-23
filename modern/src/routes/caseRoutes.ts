import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  CaseListQuerySchema,
  CreateCaseSchema,
  UpdateCaseSchema,
  StatusTransitionSchema,
  CreateCaseUpdateSchema,
} from '../contracts/caseSchemas.js';
import {
  getCases,
  getCaseDetail,
  createNewCase,
  editCase,
  transitionCaseStatus,
  addCaseUpdate,
} from '../services/caseService.js';
import { applyContactMasking, maskContactsForRole } from '../domain/privacy/privacyMapper.js';
import type { UserRole } from '../contracts/sessionSchemas.js';

const router = Router();

function getRole(req: Request): UserRole {
  const session = req.session as Record<string, unknown>;
  return (session['role'] as UserRole) ?? 'agent';
}

function getRequestUserId(req: Request): string {
  const session = req.session as Record<string, unknown>;
  return String(session['userId'] ?? 'system');
}

router.get('/cases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = CaseListQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: 'validation_error', details: query.error.errors });
    }
    const result = await getCases(query.data);
    const role = getRole(req);
    const maskedItems = maskContactsForRole(result.items as Array<{ customerEmail?: string | null; customerPhone?: string | null }>, role);
    return res.json({ ...result, items: maskedItems });
  } catch (err) {
    next(err);
  }
});

router.get('/cases/:caseNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const caseData = await getCaseDetail(req.params.caseNumber!);
    if (!caseData) {
      return res.status(404).json({ error: 'not_found', message: 'Case not found' });
    }
    const role = getRole(req);
    const masked = applyContactMasking(caseData as { customerEmail?: string | null; customerPhone?: string | null }, role);
    return res.json(masked);
  } catch (err) {
    next(err);
  }
});

router.post('/cases', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.errors });
    }
    // For demo: use a default agent. Production would use session agent or round-robin
    const session = req.session as Record<string, unknown>;
    const assignedUserId = String(session['userId'] ?? 'system');
    const userId = getRequestUserId(req);

    const newCase = await createNewCase(parsed.data, assignedUserId, userId);
    return res.status(201).json(newCase);
  } catch (err) {
    next(err);
  }
});

router.patch('/cases/:caseNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateCaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.errors });
    }
    const userId = getRequestUserId(req);
    const updated = await editCase(req.params.caseNumber!, parsed.data, userId);
    return res.json(updated);
  } catch (err) {
    if (err instanceof Error && err.message === 'Case not found') {
      return res.status(404).json({ error: 'not_found', message: 'Case not found' });
    }
    next(err);
  }
});

router.patch('/cases/:caseNumber/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = StatusTransitionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.errors });
    }
    const userId = getRequestUserId(req);
    const updated = await transitionCaseStatus(req.params.caseNumber!, parsed.data.status, userId);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/cases/:caseNumber/updates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateCaseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', details: parsed.error.errors });
    }
    const userId = getRequestUserId(req);
    const update = await addCaseUpdate(req.params.caseNumber!, parsed.data, userId);
    return res.status(201).json(update);
  } catch (err) {
    if (err instanceof Error && err.message === 'Case not found') {
      return res.status(404).json({ error: 'not_found', message: 'Case not found' });
    }
    next(err);
  }
});

export default router;
