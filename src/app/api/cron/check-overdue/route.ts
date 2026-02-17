import { prisma } from "@/lib/prisma";
import { sendWA, buildLoanReminderMessage } from "@/lib/wa-utils";
import { NextRequest, NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET || "stockflow-cron-key";

export async function GET(request: NextRequest) {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
        // 1. Find active loans that are past due date → mark OVERDUE
        const overdueLoanIds = await prisma.loan.findMany({
            where: {
                status: "ACTIVE",
                dueDate: { lt: now },
            },
            select: { id: true },
        });

        if (overdueLoanIds.length > 0) {
            await prisma.loan.updateMany({
                where: {
                    id: { in: overdueLoanIds.map((l) => l.id) },
                },
                data: { status: "OVERDUE" },
            });
        }

        // 2. Find overdue loans that need notification
        const loansToNotify = await prisma.loan.findMany({
            where: {
                status: "OVERDUE",
                OR: [
                    { lastNotifiedAt: null },
                    { lastNotifiedAt: { lt: twentyFourHoursAgo } },
                ],
            },
            include: {
                product: { select: { name: true } },
            },
        });

        let notifiedCount = 0;

        for (const loan of loansToNotify) {
            const message = buildLoanReminderMessage(
                loan.borrowerName,
                loan.product.name,
                loan.qty,
                loan.dueDate,
                loan.transactionCode
            );

            const sent = await sendWA(loan.borrowerPhone, message);

            if (sent) {
                await prisma.loan.update({
                    where: { id: loan.id },
                    data: { lastNotifiedAt: now },
                });
                notifiedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            markedOverdue: overdueLoanIds.length,
            notified: notifiedCount,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("[CRON] check-overdue error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
