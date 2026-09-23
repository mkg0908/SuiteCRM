import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateOpenApiDocument } from '../src/contracts/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, '..', 'openapi');
mkdirSync(outputDir, { recursive: true });

const doc = generateOpenApiDocument();
const outputPath = join(outputDir, 'caseflow.openapi.json');
writeFileSync(outputPath, JSON.stringify(doc, null, 2) + '\n');

console.log(`OpenAPI document generated at ${outputPath}`);
