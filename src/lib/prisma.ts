import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Lazy initialization: only create PrismaClient when actually accessed
// This prevents build-time instantiation when database isn't available
function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma;
}

// Export a Proxy that creates the real client on first access
export const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        const client = getPrismaClient();
        const value = client[prop as keyof PrismaClient];
        return typeof value === "function" ? value.bind(client) : value;
    },
});
