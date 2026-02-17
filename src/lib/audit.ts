import { prisma } from "./prisma";

export async function logAudit({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
}: {
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: any;
    ipAddress?: string;
}) {
    try {
        await prisma.auditTrail.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details: details ?? undefined,
                ipAddress,
            },
        });
    } catch (error) {
        console.error("Failed to log audit trail:", error);
    }
}
