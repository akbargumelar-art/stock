"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// Type definition for Category with product count
export interface CategoryWithCount {
    id: number;
    name: string;
    prefix: string | null;
    description: string | null;
    _count: {
        products: number;
    };
}

export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Check if we need RBAC for categories? 
    // Usually viewers can see categories, but let's just return all for now or filter if needed.
    // For management page, usually only Admins access it, but Viewers might see the list.

    return prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: { products: true },
            },
        },
    });
}

export async function createCategory(data: {
    name: string;
    prefix: string;
    description?: string;
}) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Validate prefix
    if (!data.prefix || data.prefix.length > 10) {
        throw new Error("Prefix is required and must be max 10 characters");
    }

    // Check for unique name or prefix
    const existing = await prisma.category.findFirst({
        where: {
            OR: [
                { name: data.name },
                { prefix: data.prefix }
            ]
        }
    });

    if (existing) {
        throw new Error("Category name or prefix already exists");
    }

    const category = await prisma.category.create({
        data: {
            name: data.name,
            prefix: data.prefix.toUpperCase(),
            description: data.description,
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "category",
        entityId: String(category.id),
        details: { name: data.name, prefix: data.prefix },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return category;
}

export async function updateCategory(
    id: number,
    data: {
        name: string;
        prefix: string;
        description?: string;
    }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const category = await prisma.category.update({
        where: { id },
        data: {
            name: data.name,
            prefix: data.prefix.toUpperCase(),
            description: data.description,
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "category",
        entityId: String(category.id),
        details: data,
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return category;
}

export async function deleteCategory(id: number) {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Check if products exist
    const productsCount = await prisma.product.count({
        where: { categoryId: id },
    });

    if (productsCount > 0) {
        throw new Error(`Cannot delete category. It has ${productsCount} products.`);
    }

    const category = await prisma.category.delete({
        where: { id },
    });

    await logAudit({
        userId: session.user.id,
        action: "DELETE",
        entityType: "category",
        entityId: String(id),
        details: { name: category.name },
    });

    revalidatePath("/dashboard/categories");
    revalidatePath("/dashboard/products");
    return category;
}
