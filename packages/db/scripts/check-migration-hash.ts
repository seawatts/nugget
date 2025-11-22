#!/usr/bin/env bun
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationFile = '0031_fix_activities_amount_ml_type.sql';
const content = readFileSync(
  join(process.cwd(), 'drizzle', migrationFile),
  'utf-8',
);

const hash = createHash('sha256').update(content).digest('hex');

console.log(`Migration file: ${migrationFile}`);
console.log(`Expected hash: ${hash}`);
console.log(`Content length: ${content.length} bytes`);
