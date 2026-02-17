import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Create a singleton PrismaClient instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Store the instance globally in development to prevent multiple instances
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
