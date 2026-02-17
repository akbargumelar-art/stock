import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Lazy initialization for Prisma 7 compatibility
const globalForPrisma = globalThis as { prisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = new PrismaClient();
    }
    return globalForPrisma.prisma;
}

const prisma = new Proxy({} as PrismaClient, {
    get(target, prop) {
        const client = getPrismaClient();
        const value = client[prop as keyof PrismaClient];
        return typeof value === "function" ? value.bind(client) : value;
    },
});

async function createAdminUser() {
    console.log("🔐 Creating admin user...");

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash("Qwerty345#", 12);

        // Create or update the admin user
        const admin = await prisma.user.upsert({
            where: { email: "akbargumelar@gmail.com" },
            update: {
                password: hashedPassword,
                role: "ADMIN",
            },
            create: {
                name: "Akbar Gumelar",
                email: "akbargumelar@gmail.com",
                password: hashedPassword,
                role: "ADMIN",
            },
        });

        console.log("✅ Admin user created successfully!");
        console.log("📧 Email:", admin.email);
        console.log("🔑 Password: Qwerty345#");
        console.log("\nYou can now log in at: https://stock.aarasa.click/login");
    } catch (error) {
        console.error("❌ Error creating admin user:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
