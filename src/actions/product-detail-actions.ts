"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MOCK_ENABLED, mockProducts, mockMovements } from "@/lib/mock-data";

export async function getProductDetails(id: number) {
    if (MOCK_ENABLED) {
        const product = mockProducts.find((p) => p.id === id);
        if (!product) return null;
        // Mock category manually since mockProducts might not have it populated fully in all contexts
        return {
            ...product,
            category: { id: product.categoryId, name: "Mock Category" },
            productLocations: [],
        };
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            productLocations: {
                include: {
                    location: true,
                },
            },
        },
    });

    return product;
}

export async function getProductHistory(productId: number) {
    if (MOCK_ENABLED) {
        return mockMovements
            .filter((m) => m.productId === productId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const movements = await prisma.movement.findMany({
        where: { productId },
        include: {
            mover: {
                select: { name: true, email: true },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit to last 50 movements
    });

    return movements;
}
