import { Router } from 'express';
import { generateOpenApiDocument } from '../contracts/openapi.js';

export const openapiRouter = Router();

openapiRouter.get('/openapi.json', (_req, res) => {
  res.json(generateOpenApiDocument());
});
