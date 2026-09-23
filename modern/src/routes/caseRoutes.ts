import { Router } from 'express';
import {
  CaseCreateSchema,
  CaseUpdateSchema,
  CaseStatusChangeSchema,
  CaseUpdateCreateSchema,
  CaseListQuerySchema,
} from '../contracts/caseSchemas.js';
import * as caseService from '../services/caseService.js';
import { getSessionRole } from '../services/sessionService.js';
import { validateBody, validateQuery } from '../middleware/validateRequest.js';

export const caseRouter = Router();

caseRouter.get('/', validateQuery(CaseListQuerySchema), async (req, res, next) => {
  try {
    const role = getSessionRole(req);
    const result = await caseService.listCases(req.query as any, role);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

caseRouter.get('/:caseNumber', async (req, res, next) => {
  try {
    const role = getSessionRole(req);
    const caseDetail = await caseService.getCaseDetail(req.params.caseNumber as string, role);
    res.json(caseDetail);
  } catch (err) {
    next(err);
  }
});

caseRouter.post('/', validateBody(CaseCreateSchema), async (req, res, next) => {
  try {
    const result = await caseService.createCase(req.body, 'system');
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

caseRouter.patch('/:caseNumber', validateBody(CaseUpdateSchema), async (req, res, next) => {
  try {
    const updated = await caseService.updateCase(req.params.caseNumber as string, req.body, 'system');
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

caseRouter.patch('/:caseNumber/status', validateBody(CaseStatusChangeSchema), async (req, res, next) => {
  try {
    const updated = await caseService.changeStatus(req.params.caseNumber as string, req.body.status, 'system');
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

caseRouter.post('/:caseNumber/updates', validateBody(CaseUpdateCreateSchema), async (req, res, next) => {
  try {
    const update = await caseService.addUpdate(req.params.caseNumber as string, req.body.text, req.body.internal, 'system');
    res.status(201).json(update);
  } catch (err) {
    next(err);
  }
});
