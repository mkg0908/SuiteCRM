import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateOpenApiDocument } from '../src/contracts/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputPath = join(__dirname, '..', 'openapi', 'caseflow.openapi.json');

let existing: string;
try {
  existing = readFileSync(outputPath, 'utf-8');
} catch {
  console.error('OpenAPI file not found. Run npm run openapi:generate first.');
  process.exit(1);
}

const current = JSON.stringify(generateOpenApiDocument(), null, 2) + '\n';

if (existing !== current) {
  console.error('OpenAPI drift detected! Run npm run openapi:generate to update.');
  process.exit(1);
}

console.log('OpenAPI check passed: no drift detected.');
