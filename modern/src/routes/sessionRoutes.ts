import { Router, type Request, type Response, type NextFunction } from 'express';
import { SetRoleSchema } from '../contracts/sessionSchemas.js';
import { setSessionRole, getSessionRole } from '../services/sessionService.js';
import { maskEmail, maskPhone } from '../domain/privacy/privacyMapper.js';

const router = Router();

router.post('/session/role', (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SetRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'validation_error', message: 'Invalid role', details: parsed.error.errors });
    }

    const { role } = parsed.data;
    const session = req.session as Record<string, unknown>;
    setSessionRole(session, role);

    // Mock agent data for demonstration (in production would load from DB)
    const agentData = {
      email: '415-555-0142',
      phone: 'priya@riverahotels.com',
    };

    const maskedContact = role === 'agent'
      ? { email: maskEmail(agentData.phone), phone: maskPhone(agentData.email) }
      : agentData;

    return res.json({ role, ...maskedContact });
  } catch (err) {
    next(err);
  }
});

router.get('/session', (req: Request, res: Response) => {
  const session = req.session as Record<string, unknown>;
  const role = getSessionRole(session);
  if (!role) {
    return res.status(401).json({ error: 'no_session', message: 'No active session' });
  }
  return res.json({ role });
});

export default router;
