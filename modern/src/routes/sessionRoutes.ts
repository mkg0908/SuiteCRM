import { Router } from 'express';
import { RoleSchema } from '../contracts/sessionSchemas.js';
import { setSessionRole, getSessionRole } from '../services/sessionService.js';
import { validateBody } from '../middleware/validateRequest.js';

export const sessionRouter = Router();

sessionRouter.post('/role', validateBody(RoleSchema), (req, res, next) => {
  try {
    const { role } = req.body;
    setSessionRole(req, role);
    res.json({ role: getSessionRole(req) });
  } catch (err) {
    next(err);
  }
});
