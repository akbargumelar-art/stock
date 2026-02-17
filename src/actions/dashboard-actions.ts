"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MOCK_ENABLED, getMockDashboardStats } from "@/lib/mock-data";

export async function getDashboardStats() {
    if (MOCK_ENABLED) return getMockDashboardStats();

    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
        totalProducts,
        lowStockProducts,
        overStockProducts,
        totalMovements,
        recentMovements,
        categories,
        // New: asset value, monthly sales, active loans
        assetValue,
        monthlySales,
        activeLoans,
        overdueLoans,
        salesChartRaw,
    ] = await Promise.all([
        prisma.product.count(),
        prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM products WHERE current_stock < min_stock
    `,
        prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM products WHERE current_stock > (2 * min_stock)
    `,
        prisma.movement.count(),
        prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM movements
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
        prisma.category.findMany({ select: { id: true, name: true } }),
        // Total asset value: SUM(current_stock * price)
        prisma.$queryRaw<[{ total: number | null }]>`
      SELECT SUM(current_stock * price) as total FROM products
    `,
        // Monthly sales revenue
        prisma.sale.aggregate({
            _sum: { totalAmount: true },
            _count: true,
            where: { saleDate: { gte: startOfMonth } },
        }),
        // Active loans count
        prisma.loan.count({ where: { status: "ACTIVE" } }),
        // Overdue loans count
        prisma.loan.count({ where: { status: "OVERDUE" } }),
        // Sales per day for last 7 days
        prisma.$queryRaw<{ date: string; revenue: number; count: bigint }[]>`
      SELECT DATE(sale_date) as date, SUM(total_amount) as revenue, COUNT(*) as count
      FROM sales
      WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(sale_date)
      ORDER BY date ASC
    `,
    ]);

    // Build chart data for 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const foundMovement = recentMovements.find(
            (m) => String(m.date).split("T")[0] === dateStr
        );
        const foundSale = salesChartRaw.find(
            (s) => String(s.date).split("T")[0] === dateStr
        );
        chartData.push({
            date: dateStr,
            movements: foundMovement ? Number(foundMovement.count) : 0,
            revenue: foundSale ? Number(foundSale.revenue) : 0,
            sales: foundSale ? Number(foundSale.count) : 0,
        });
    }

    // Low stock alerts
    const lowStockList = await prisma.$queryRaw<
        {
            id: number;
            sku: string;
            name: string;
            current_stock: number;
            min_stock: number;
            category_name: string;
        }[]
    >`
    SELECT p.id, p.sku, p.name, p.current_stock, p.min_stock, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.current_stock < p.min_stock
    LIMIT 10
  `;

    return {
        totalProducts,
        lowStockCount: Number(lowStockProducts[0].count),
        overStockCount: Number(overStockProducts[0].count),
        totalMovements,
        // New stats
        totalAssetValue: Number(assetValue[0]?.total ?? 0),
        monthlyRevenue: monthlySales._sum.totalAmount || 0,
        monthlySalesCount: monthlySales._count,
        activeLoans,
        overdueLoans,
        chartData,
        lowStockList: lowStockList.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            currentStock: p.current_stock,
            minStock: p.min_stock,
            categoryName: p.category_name,
        })),
        categories,
    };
}
