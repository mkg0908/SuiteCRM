import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { processEmailIntake, processWhatsAppIntake } from '../services/intakeService.js';
import type { UserRole } from '../contracts/sessionSchemas.js';

const router = Router();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 }, storage: multer.memoryStorage() });

function getRole(req: Request): UserRole {
  const session = req.session as Record<string, unknown>;
  return (session['role'] as UserRole) ?? 'agent';
}

function getRequestUserId(req: Request): string {
  const session = req.session as Record<string, unknown>;
  return String(session['userId'] ?? 'system');
}

router.post('/intake/email', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawContent = req.file
      ? req.file.buffer.toString('utf-8')
      : String(req.body?.content ?? req.body?.text ?? '');

    if (!rawContent.trim()) {
      return res.status(400).json({ error: 'validation_error', message: 'Email content is required' });
    }

    const role = getRole(req);
    const userId = getRequestUserId(req);

    const summary = await processEmailIntake({
      rawContent,
      requestUserId: userId,
      role,
    });

    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

router.post('/intake/whatsapp', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawContent = req.file
      ? req.file.buffer.toString('utf-8')
      : String(req.body?.content ?? req.body?.text ?? '');

    if (!rawContent.trim()) {
      return res.status(400).json({ error: 'validation_error', message: 'WhatsApp export content is required' });
    }

    const role = getRole(req);
    const userId = getRequestUserId(req);

    const summary = await processWhatsAppIntake({
      rawContent,
      requestUserId: userId,
      role,
    });

    return res.json(summary);
  } catch (err) {
    next(err);
  }
});

export default router;
