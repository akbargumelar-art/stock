"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { MOCK_ENABLED, mockMovements } from "@/lib/mock-data";

export async function createMovement(data: {
    productId: number;
    fromLocationId?: number | null;
    toLocationId?: number | null;
    quantity: number;
    notes?: string;
}) {
    if (MOCK_ENABLED) return { id: 999, ...data, movedBy: "u1", createdAt: new Date() };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Create movement record
    const movement = await prisma.movement.create({
        data: {
            productId: data.productId,
            fromLocationId: data.fromLocationId || null,
            toLocationId: data.toLocationId || null,
            quantity: data.quantity,
            notes: data.notes,
            movedBy: session.user.id,
        },
    });

    // Update product locations
    if (data.fromLocationId) {
        await prisma.productLocation.upsert({
            where: {
                productId_locationId: {
                    productId: data.productId,
                    locationId: data.fromLocationId,
                },
            },
            update: { quantity: { decrement: data.quantity } },
            create: {
                productId: data.productId,
                locationId: data.fromLocationId,
                quantity: -data.quantity,
            },
        });
    }

    if (data.toLocationId) {
        await prisma.productLocation.upsert({
            where: {
                productId_locationId: {
                    productId: data.productId,
                    locationId: data.toLocationId,
                },
            },
            update: { quantity: { increment: data.quantity } },
            create: {
                productId: data.productId,
                locationId: data.toLocationId,
                quantity: data.quantity,
            },
        });
    }

    // If it's an incoming movement (no from, has to) → increment stock
    if (!data.fromLocationId && data.toLocationId) {
        await prisma.product.update({
            where: { id: data.productId },
            data: { currentStock: { increment: data.quantity } },
        });
    }
    // If it's an outgoing movement (has from, no to) → decrement stock
    else if (data.fromLocationId && !data.toLocationId) {
        await prisma.product.update({
            where: { id: data.productId },
            data: { currentStock: { decrement: data.quantity } },
        });
    }
    // Transfer between locations: no stock change needed

    await logAudit({
        userId: session.user.id,
        action: "MOVE",
        entityType: "movement",
        entityId: String(movement.id),
        details: {
            productId: data.productId,
            from: data.fromLocationId,
            to: data.toLocationId,
            quantity: data.quantity,
        },
    });

    revalidatePath("/dashboard/movements");
    revalidatePath("/dashboard");
    return movement;
}

export async function getMovements(filters?: {
    productId?: number;
    dateFrom?: string;
    dateTo?: string;
}) {
    if (MOCK_ENABLED) return mockMovements;

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters?.productId) {
        where.productId = filters.productId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo + "T23:59:59");
    }

    return prisma.movement.findMany({
        where,
        include: {
            product: { select: { sku: true, name: true } },
            fromLocation: { select: { name: true, type: true } },
            toLocation: { select: { name: true, type: true } },
            mover: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
}
