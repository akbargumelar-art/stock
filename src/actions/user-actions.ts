"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { MOCK_ENABLED, mockUsers, mockAuditTrail } from "@/lib/mock-data";

export async function getUsers() {
    if (MOCK_ENABLED) return mockUsers;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            categoryVisibility: {
                include: { category: { select: { id: true, name: true } } },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function createUser(data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "VIEWER";
}) {
    if (MOCK_ENABLED) return { id: "mock-new", name: data.name, email: data.email, role: data.role };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "user",
        entityId: user.id,
        details: { name: data.name, email: data.email, role: data.role },
    });

    revalidatePath("/dashboard/users");
    return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function updateUser(
    id: string,
    data: {
        name?: string;
        email?: string;
        role?: "ADMIN" | "VIEWER";
        password?: string;
    }
) {
    if (MOCK_ENABLED) return { id, name: data.name, email: data.email, role: data.role };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...data };
    if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 12);
    } else {
        delete updateData.password;
    }

    const user = await prisma.user.update({
        where: { id },
        data: updateData,
    });

    await logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        details: { name: data.name, role: data.role },
    });

    revalidatePath("/dashboard/users");
    return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function assignCategoryVisibility(
    userId: string,
    categoryIds: number[]
) {
    if (MOCK_ENABLED) return;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Remove existing visibility
    await prisma.categoryVisibility.deleteMany({
        where: { userId },
    });

    // Create new visibility entries
    if (categoryIds.length > 0) {
        await prisma.categoryVisibility.createMany({
            data: categoryIds.map((categoryId) => ({
                userId,
                categoryId,
            })),
        });
    }

    await logAudit({
        userId: session.user.id,
        action: "ASSIGN_VISIBILITY",
        entityType: "user",
        entityId: userId,
        details: { categoryIds },
    });

    revalidatePath("/dashboard/users");
}

export async function getAuditTrail(filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
}) {
    if (MOCK_ENABLED) return mockAuditTrail;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;

    return prisma.auditTrail.findMany({
        where,
        include: {
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
}

export async function deleteUser(id: string) {
    if (MOCK_ENABLED) return;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Don't allow deleting yourself
    if (session.user.id === id) throw new Error("Cannot delete your own account");

    const user = await prisma.user.delete({ where: { id } });

    await logAudit({
        userId: session.user.id,
        action: "DELETE",
        entityType: "user",
        entityId: id,
        details: { name: user.name, email: user.email },
    });

    revalidatePath("/dashboard/users");
}
