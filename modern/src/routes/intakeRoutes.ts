import { Router } from 'express';
import multer from 'multer';
import { EmailIntakeSchema, WhatsAppIntakeSchema } from '../contracts/intakeSchemas.js';
import * as intakeService from '../services/intakeService.js';

export const intakeRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

intakeRouter.post('/email', upload.single('file'), async (req, res, next) => {
  try {
    let text: string;
    if (req.file) {
      text = req.file.buffer.toString('utf-8');
    } else {
      const parsed = EmailIntakeSchema.parse(req.body);
      text = parsed.text;
    }
    const summary = await intakeService.processEmailIntake(text, 'system');
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

intakeRouter.post('/whatsapp', upload.single('file'), async (req, res, next) => {
  try {
    let text: string;
    if (req.file) {
      text = req.file.buffer.toString('utf-8');
    } else {
      const parsed = WhatsAppIntakeSchema.parse(req.body);
      text = parsed.text;
    }
    const summary = await intakeService.processWhatsAppIntake(text, 'system');
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
