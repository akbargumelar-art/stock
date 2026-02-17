"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { MOCK_ENABLED, mockLocations } from "@/lib/mock-data";

export async function getLocations() {
    if (MOCK_ENABLED) return mockLocations;

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    return prisma.location.findMany({
        include: {
            parent: { select: { name: true } },
            children: { select: { id: true, name: true } },
            _count: { select: { productLocations: true } },
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
    });
}

export async function createLocation(data: {
    name: string;
    type: "PHYSICAL" | "VIRTUAL";
    parentId?: number | null;
    description?: string;
}) {
    if (MOCK_ENABLED) return { id: 99, ...data, createdAt: new Date() };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const location = await prisma.location.create({
        data: {
            name: data.name,
            type: data.type,
            parentId: data.parentId || null,
            description: data.description,
        },
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "location",
        entityId: String(location.id),
        details: { name: data.name, type: data.type },
    });

    revalidatePath("/dashboard/locations");
    return location;
}

export async function updateLocation(
    id: number,
    data: {
        name?: string;
        type?: "PHYSICAL" | "VIRTUAL";
        parentId?: number | null;
        description?: string;
    }
) {
    if (MOCK_ENABLED) return { id, ...data };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const location = await prisma.location.update({
        where: { id },
        data,
    });

    await logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "location",
        entityId: String(id),
        details: data,
    });

    revalidatePath("/dashboard/locations");
    return location;
}

export async function deleteLocation(id: number) {
    if (MOCK_ENABLED) return { id };

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const location = await prisma.location.delete({ where: { id } });

    await logAudit({
        userId: session.user.id,
        action: "DELETE",
        entityType: "location",
        entityId: String(id),
        details: { name: location.name },
    });

    revalidatePath("/dashboard/locations");
    return location;
}
