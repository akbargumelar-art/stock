import { PrismaClient } from "@prisma/client";

// Global singleton to prevent multiple instances
let prismaInstance: PrismaClient | null = null;

// Function to get or create PrismaClient instance
function getPrismaClient(): PrismaClient {
    if (!prismaInstance) {
        prismaInstance = new PrismaClient();
    }
    return prismaInstance;
}

// Export the getter function as the default export
// This ensures lazy initialization only when actually used
export const prisma = getPrismaClient();
