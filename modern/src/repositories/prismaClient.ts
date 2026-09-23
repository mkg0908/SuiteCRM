import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma client
let _prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient({
      datasources: { db: { url: process.env['DATABASE_URL'] } },
      log: process.env['LOG_LEVEL'] === 'debug' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return _prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

export { PrismaClient };
