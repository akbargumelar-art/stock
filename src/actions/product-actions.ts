"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateQRCode } from "@/lib/qr-utils";
import { revalidatePath } from "next/cache";
import { MOCK_ENABLED, mockProducts, mockCategories } from "@/lib/mock-data";

export async function getProducts(filters?: {
    search?: string;
    categoryId?: number;
    status?: string;
}) {
    if (MOCK_ENABLED) {
        let results = [...mockProducts];
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            results = results.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
        }
        if (filters?.categoryId) results = results.filter(p => p.categoryId === filters.categoryId);
        if (filters?.status === "LOW") results = results.filter(p => p.currentStock < p.minStock);
        if (filters?.status === "OVER_STOCK") results = results.filter(p => p.currentStock > 2 * p.minStock);
        if (filters?.status === "IN_STOCK") results = results.filter(p => p.currentStock >= p.minStock && p.currentStock <= 2 * p.minStock);
        return results;
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search } },
            { sku: { contains: filters.search } },
        ];
    }

    if (filters?.categoryId) {
        where.categoryId = filters.categoryId;
    }

    // RBAC: Viewer can only see assigned categories
    if (session.user.role === "VIEWER") {
        const visibility = await prisma.categoryVisibility.findMany({
            where: { userId: session.user.id },
            select: { categoryId: true },
        });
        where.categoryId = { in: visibility.map((v) => v.categoryId) };
    }

    const products = await prisma.product.findMany({
        where,
        include: {
            category: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    // Apply status filter in JS (since it depends on computed fields)
    if (filters?.status) {
        return products.filter((p) => {
            if (filters.status === "LOW") return p.currentStock < p.minStock;
            if (filters.status === "OVER_STOCK") return p.currentStock > 2 * p.minStock;
            if (filters.status === "IN_STOCK")
                return p.currentStock >= p.minStock && p.currentStock <= 2 * p.minStock;
            return true;
        });
    }

    return products;
}

export async function getProduct(id: number) {
    if (MOCK_ENABLED) return mockProducts.find(p => p.id === id) || null;

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            productLocations: {
                include: { location: true },
            },
        },
    });
}

export async function createProduct(data: {
    sku: string;
    name: string;
    categoryId: number;
    description?: string;
    unit: string;
    price?: number;
    minStock: number;
    currentStock: number;
}) {
    if (MOCK_ENABLED) {
        return { id: mockProducts.length + 1, ...data, qrCode: null, createdAt: new Date(), updatedAt: new Date() };
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Generate QR Code
    const qrCode = await generateQRCode(data.sku);

    const product = await prisma.product.create({
        data: {
            ...data,
            qrCode,
            createdBy: session.user.id,
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "product",
        entityId: String(product.id),
        details: { sku: data.sku, name: data.name },
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return product;
}

export async function updateProduct(
    id: number,
    data: {
        sku?: string;
        name?: string;
        categoryId?: number;
        description?: string;
        unit?: string;
        price?: number;
        minStock?: number;
        currentStock?: number;
    }
) {
    if (MOCK_ENABLED) return { id, ...data };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Regenerate QR if SKU changes
    let qrCode: string | undefined;
    if (data.sku) {
        qrCode = await generateQRCode(data.sku);
    }

    const product = await prisma.product.update({
        where: { id },
        data: {
            ...data,
            ...(qrCode ? { qrCode } : {}),
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "product",
        entityId: String(product.id),
        details: data,
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return product;
}

export async function deleteProduct(id: number) {
    if (MOCK_ENABLED) return { id };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const product = await prisma.product.delete({ where: { id } });

    await logAudit({
        userId: session.user.id,
        action: "DELETE",
        entityType: "product",
        entityId: String(id),
        details: { sku: product.sku, name: product.name },
    });

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return product;
}

export async function getCategories() {
    if (MOCK_ENABLED) return mockCategories;

    return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createCategory(data: { name: string; description?: string }) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const category = await prisma.category.create({ data });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "category",
        entityId: String(category.id),
        details: { name: data.name },
    });

    revalidatePath("/dashboard/products");
    return category;
}
