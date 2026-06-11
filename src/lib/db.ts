// Force Turbopack rebuild to clear cached Prisma Client types
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.NODE_ENV === 'production' ? 10 : 2, // Limit connections in development to prevent Neon exhaustion
    connectionTimeoutMillis: 10000, // Wait up to 10s for database wakeup/connection
    idleTimeoutMillis: 30000, // Close idle clients after 30s
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Clear global cache if the newly added directSale model is not present in the cached instance
if (globalThis.prismaGlobal && !('directSale' in globalThis.prismaGlobal)) {
  globalThis.prismaGlobal = undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

