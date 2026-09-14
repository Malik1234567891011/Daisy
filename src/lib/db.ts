import { PrismaClient } from "@prisma/client";

// Reuse one PrismaClient across dev hot reloads to avoid exhausting connections.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
