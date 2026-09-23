import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateOpenApiDocument } from '../src/contracts/openapi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../openapi/caseflow.openapi.json');

mkdirSync(dirname(outputPath), { recursive: true });
const doc = generateOpenApiDocument();
writeFileSync(outputPath, JSON.stringify(doc, null, 2) + '\n');
console.log(`OpenAPI document written to ${outputPath}`);
