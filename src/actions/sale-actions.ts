"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { MOCK_ENABLED, mockSales, mockSaleDetail, mockProducts } from "@/lib/mock-data";

function generateInvoiceCode(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `INV-${date}-${rand}`;
}

export async function getSales(filters?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
}) {
    if (MOCK_ENABLED) {
        let results = [...mockSales];
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            results = results.filter(r => r.invoiceCode.toLowerCase().includes(s) || (r.customerName || "").toLowerCase().includes(s));
        }
        return results;
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters?.search) {
        where.OR = [
            { invoiceCode: { contains: filters.search } },
            { customerName: { contains: filters.search } },
        ];
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.saleDate = {};
        if (filters?.dateFrom) where.saleDate.gte = new Date(filters.dateFrom);
        if (filters?.dateTo)
            where.saleDate.lte = new Date(filters.dateTo + "T23:59:59");
    }

    return prisma.sale.findMany({
        where,
        include: {
            items: {
                include: {
                    product: { select: { sku: true, name: true } },
                },
            },
            _count: { select: { items: true } },
        },
        orderBy: { saleDate: "desc" },
        take: 200,
    });
}

export async function getSaleDetail(id: string) {
    if (MOCK_ENABLED) return mockSaleDetail;

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.sale.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: { select: { sku: true, name: true, unit: true } },
                },
            },
        },
    });
}

export async function createSale(data: {
    customerName?: string;
    items: { productId: number; qty: number; sellingPrice: number }[];
}) {
    if (MOCK_ENABLED) {
        const total = data.items.reduce((s, i) => s + i.qty * i.sellingPrice, 0);
        return { id: "mock-sale", invoiceCode: generateInvoiceCode(), totalAmount: total };
    }
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    if (!data.items.length) throw new Error("No items in sale");

    // Validate all stock availability first
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Product #${item.productId} not found`);
        if (product.currentStock < item.qty) {
            throw new Error(
                `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${item.qty}`
            );
        }
    }

    const invoiceCode = generateInvoiceCode();
    const totalAmount = data.items.reduce(
        (sum, i) => sum + i.qty * i.sellingPrice,
        0
    );

    // ACID transaction: create sale + items + deduct stock + log movements
    const sale = await prisma.$transaction(async (tx) => {
        const newSale = await tx.sale.create({
            data: {
                invoiceCode,
                customerName: data.customerName || null,
                totalAmount,
            },
        });

        for (const item of data.items) {
            // Create sale item
            await tx.saleItem.create({
                data: {
                    saleId: newSale.id,
                    productId: item.productId,
                    qty: item.qty,
                    sellingPrice: item.sellingPrice,
                },
            });

            // Deduct stock permanently
            await tx.product.update({
                where: { id: item.productId },
                data: { currentStock: { decrement: item.qty } },
            });

            // Log movement
            await tx.movement.create({
                data: {
                    productId: item.productId,
                    type: "SALE",
                    quantity: item.qty,
                    notes: `Sale ${invoiceCode}`,
                    movedBy: session.user!.id,
                },
            });
        }

        return newSale;
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "sale",
        entityId: sale.id,
        details: {
            invoiceCode,
            itemCount: data.items.length,
            totalAmount,
        },
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard");
    return sale;
}

export async function getSalesStats() {
    if (MOCK_ENABLED) {
        return { monthlyRevenue: 19225000, monthlyTransactions: 3, totalTransactions: mockSales.length };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthSales, totalSalesCount] = await Promise.all([
        prisma.sale.aggregate({
            _sum: { totalAmount: true },
            _count: true,
            where: { saleDate: { gte: startOfMonth } },
        }),
        prisma.sale.count(),
    ]);

    return {
        monthlyRevenue: monthSales._sum.totalAmount || 0,
        monthlyTransactions: monthSales._count,
        totalTransactions: totalSalesCount,
    };
}

export async function getProductsForSale(search?: string) {
    if (MOCK_ENABLED) {
        let results = mockProducts.filter(p => p.currentStock > 0);
        if (search) {
            const s = search.toLowerCase();
            results = results.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
        }
        return results.map(p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price, currentStock: p.currentStock, unit: p.unit }));
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { currentStock: { gt: 0 } };

    if (search) {
        where.OR = [
            { name: { contains: search } },
            { sku: { contains: search } },
        ];
    }

    return prisma.product.findMany({
        where,
        select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            currentStock: true,
            unit: true,
        },
        orderBy: { name: "asc" },
        take: 20,
    });
}
