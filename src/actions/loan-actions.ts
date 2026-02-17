"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MOCK_ENABLED, mockLoans, mockProducts } from "@/lib/mock-data";
import { logAudit } from "@/lib/audit";
import { sendWA, buildLoanReminderMessage } from "@/lib/wa-utils";
import { revalidatePath } from "next/cache";

function generateLoanCode(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    return `LN-${date}-${rand}`;
}

export async function getLoans(filters?: {
    status?: string;
    search?: string;
}) {
    if (MOCK_ENABLED) {
        let results = [...mockLoans];
        if (filters?.status && filters.status !== "ALL") results = results.filter(l => l.status === filters.status);
        if (filters?.search) {
            const s = filters.search.toLowerCase();
            results = results.filter(l => l.borrowerName.toLowerCase().includes(s) || l.transactionCode.toLowerCase().includes(s));
        }
        return results;
    }

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters?.status && filters.status !== "ALL") {
        where.status = filters.status;
    }

    if (filters?.search) {
        where.OR = [
            { borrowerName: { contains: filters.search } },
            { transactionCode: { contains: filters.search } },
        ];
    }

    return prisma.loan.findMany({
        where,
        include: {
            product: { select: { id: true, sku: true, name: true, unit: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
    });
}

export async function createLoan(data: {
    borrowerName: string;
    borrowerPhone: string;
    productId: number;
    qty: number;
    dueDate: string;
    notes?: string;
}) {
    if (MOCK_ENABLED) {
        const p = mockProducts.find(p => p.id === data.productId);
        return { id: "mock-new", transactionCode: generateLoanCode(), ...data, product: p };
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    // Validate stock
    const product = await prisma.product.findUnique({
        where: { id: data.productId },
    });
    if (!product) throw new Error("Product not found");
    if (product.currentStock < data.qty) {
        throw new Error(
            `Insufficient stock. Available: ${product.currentStock}, Requested: ${data.qty}`
        );
    }

    const transactionCode = generateLoanCode();

    // Create loan + deduct stock + log movement in transaction
    const loan = await prisma.$transaction(async (tx) => {
        const newLoan = await tx.loan.create({
            data: {
                transactionCode,
                borrowerName: data.borrowerName,
                borrowerPhone: data.borrowerPhone,
                productId: data.productId,
                qty: data.qty,
                dueDate: new Date(data.dueDate),
                notes: data.notes,
            },
        });

        // Deduct stock
        await tx.product.update({
            where: { id: data.productId },
            data: { currentStock: { decrement: data.qty } },
        });

        // Log movement
        await tx.movement.create({
            data: {
                productId: data.productId,
                type: "LOAN_OUT",
                quantity: data.qty,
                notes: `Loan to ${data.borrowerName} (${transactionCode})`,
                movedBy: session.user!.id,
            },
        });

        return newLoan;
    });

    await logAudit({
        userId: session.user.id,
        action: "CREATE",
        entityType: "loan",
        entityId: loan.id,
        details: {
            transactionCode,
            borrower: data.borrowerName,
            productId: data.productId,
            qty: data.qty,
        },
    });

    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
    return loan;
}

export async function returnLoan(loanId: string) {
    if (MOCK_ENABLED) return;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { product: true },
    });
    if (!loan) throw new Error("Loan not found");
    if (loan.status === "RETURNED") throw new Error("Loan already returned");

    await prisma.$transaction(async (tx) => {
        // Mark as returned
        await tx.loan.update({
            where: { id: loanId },
            data: {
                status: "RETURNED",
                returnDate: new Date(),
            },
        });

        // Restore stock
        await tx.product.update({
            where: { id: loan.productId },
            data: { currentStock: { increment: loan.qty } },
        });

        // Log movement
        await tx.movement.create({
            data: {
                productId: loan.productId,
                type: "LOAN_RETURN",
                quantity: loan.qty,
                notes: `Return from ${loan.borrowerName} (${loan.transactionCode})`,
                movedBy: session.user!.id,
            },
        });
    });

    await logAudit({
        userId: session.user.id,
        action: "UPDATE",
        entityType: "loan",
        entityId: loanId,
        details: { action: "RETURNED", transactionCode: loan.transactionCode },
    });

    revalidatePath("/dashboard/loans");
    revalidatePath("/dashboard");
}

export async function sendLoanReminder(loanId: string) {
    if (MOCK_ENABLED) return true;

    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
        throw new Error("Unauthorized");

    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { product: true },
    });
    if (!loan) throw new Error("Loan not found");

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
            where: { id: loanId },
            data: { lastNotifiedAt: new Date() },
        });
    }

    await logAudit({
        userId: session.user.id,
        action: "NOTIFY",
        entityType: "loan",
        entityId: loanId,
        details: { phone: loan.borrowerPhone, sent },
    });

    revalidatePath("/dashboard/loans");
    return sent;
}

export async function getLoanStats() {
    if (MOCK_ENABLED) {
        const active = mockLoans.filter(l => l.status === "ACTIVE").length;
        const overdue = mockLoans.filter(l => l.status === "OVERDUE").length;
        const returned = mockLoans.filter(l => l.status === "RETURNED").length;
        return { active, overdue, returned, total: active + overdue + returned };
    }

    const [active, overdue, returned] = await Promise.all([
        prisma.loan.count({ where: { status: "ACTIVE" } }),
        prisma.loan.count({ where: { status: "OVERDUE" } }),
        prisma.loan.count({ where: { status: "RETURNED" } }),
    ]);
    return { active, overdue, returned, total: active + overdue + returned };
}
