import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const sqlPath = join(__dirname, '../supabase_schema.sql');
  const sql = await readFile(sqlPath, 'utf8');

  try {
    console.log(`Applying SQL file: ${sqlPath}`);

    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map((stmt) => stmt.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }

    console.log('Seed SQL successfully applied.');
  } catch (error) {
    console.error('Failed to run seed SQL:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();