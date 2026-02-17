import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// In MOCK_DATA mode, create a lazy proxy that only connects when actually used.
// This prevents PrismaClient from failing when there is no database.
const isMock = process.env.MOCK_DATA === "true";

function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma;
}

export const prisma: PrismaClient = isMock
    ? (new Proxy({} as PrismaClient, {
        get(_target, prop) {
            // Only create the real client if someone accesses a model or method
            return Reflect.get(getPrisma(), prop);
        },
    }) as PrismaClient)
    : (globalForPrisma.prisma ?? (() => {
        const client = new PrismaClient();
        if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
        return client;
    })());
