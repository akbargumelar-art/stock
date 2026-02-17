"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "@/actions/dashboard-actions";
import {
    Package,
    AlertTriangle,
    TrendingUp,
    DollarSign,
    HandCoins,
    ShoppingCart,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    getStockStatus,
    getStockStatusColor,
} from "@/lib/stock-status";

interface DashboardData {
    totalProducts: number;
    lowStockCount: number;
    overStockCount: number;
    totalMovements: number;
    totalAssetValue: number;
    monthlyRevenue: number;
    monthlySalesCount: number;
    activeLoans: number;
    overdueLoans: number;
    chartData: {
        date: string;
        movements: number;
        revenue: number;
        sales: number;
    }[];
    lowStockList: {
        id: number;
        sku: string;
        name: string;
        currentStock: number;
        minStock: number;
        categoryName: string;
    }[];
}

const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        notation: n >= 1_000_000 ? "compact" : "standard",
    }).format(n);

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardStats()
            .then((d) => setData(d as DashboardData))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Dashboard
                </h1>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    Inventory overview, sales & loan status
                </p>
            </div>

            {/* Row 1: Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Asset Value */}
                <div className="card-neu p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                Asset Value
                            </p>
                            <p className="text-xl font-bold font-mono text-emerald-500 mt-1">
                                {formatRp(data.totalAssetValue)}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign size={20} className="text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Sales This Month */}
                <div className="card-neu p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                Sales (Month)
                            </p>
                            <p className="text-xl font-bold font-mono text-indigo-500 mt-1">
                                {formatRp(data.monthlyRevenue)}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {data.monthlySalesCount} transactions
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <ShoppingCart size={20} className="text-indigo-500" />
                        </div>
                    </div>
                </div>

                {/* Items on Loan */}
                <div className="card-neu p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                On Loan
                            </p>
                            <p className="text-xl font-bold font-mono text-amber-500 mt-1">
                                {data.activeLoans}
                            </p>
                            {data.overdueLoans > 0 && (
                                <p className="text-[10px] text-red-500 font-medium mt-0.5">
                                    {data.overdueLoans} overdue!
                                </p>
                            )}
                        </div>
                        <div
                            className={`w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center ${data.overdueLoans > 0 ? "pulse-soft" : ""
                                }`}
                        >
                            <HandCoins size={20} className="text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Low Stock */}
                <div className="card-neu p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                                Low Stock
                            </p>
                            <p className="text-xl font-bold font-mono text-red-500 mt-1">
                                {data.lowStockCount}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                of {data.totalProducts} products
                            </p>
                        </div>
                        <div
                            className={`w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center ${data.lowStockCount > 0 ? "pulse-soft" : ""
                                }`}
                        >
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Activity & Sales Chart */}
                <div className="lg:col-span-2 card-neu p-5">
                    <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">
                        7-Day Activity
                    </h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.chartData}>
                                <defs>
                                    <linearGradient
                                        id="colorMovements"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#6366f1"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#6366f1"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorRevenue"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#10b981"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10b981"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--border-color)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return d.toLocaleDateString("id-ID", {
                                            weekday: "short",
                                        });
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) =>
                                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "8px",
                                        boxShadow: "var(--shadow-card)",
                                        fontSize: "12px",
                                    }}
                                    labelStyle={{ color: "var(--text-primary)" }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={((value: number, name: string) => {
                                        if (name === "revenue") return [formatRp(value), "Revenue"];
                                        return [value, name === "movements" ? "Movements" : name];
                                    }) as any}
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="movements"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorMovements)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-indigo-500 rounded" /> Movements
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-emerald-500 rounded" /> Revenue
                        </span>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="card-neu p-5">
                    <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        Low Stock Alerts
                    </h2>
                    <div className="space-y-3">
                        {data.lowStockList.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] text-center py-8">
                                All products are well-stocked ✓
                            </p>
                        ) : (
                            data.lowStockList.map((item) => {
                                const status = getStockStatus(
                                    item.currentStock,
                                    item.minStock
                                );
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {item.sku} • {item.categoryName}
                                            </p>
                                        </div>
                                        <div className="text-right ml-3">
                                            <span
                                                className={`badge ${getStockStatusColor(status)}`}
                                            >
                                                {item.currentStock}/{item.minStock}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Row 3: Secondary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Link href="/dashboard/products" className="card-neu p-4 text-center no-underline hover:border-[var(--accent)] transition-colors cursor-pointer">
                    <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                        {data.totalProducts}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        <Package size={12} className="inline mr-1" />
                        Products
                    </p>
                </Link>
                <Link href="/dashboard/movements" className="card-neu p-4 text-center no-underline hover:border-[var(--accent)] transition-colors cursor-pointer">
                    <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                        {data.totalMovements}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        <TrendingUp size={12} className="inline mr-1" />
                        Movements
                    </p>
                </Link>
                <Link href="/dashboard/products" className="card-neu p-4 text-center no-underline hover:border-[var(--accent)] transition-colors cursor-pointer">
                    <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                        {data.overStockCount}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Over Stock</p>
                </Link>
                <Link href="/dashboard/sales" className="card-neu p-4 text-center no-underline hover:border-[var(--accent)] transition-colors cursor-pointer">
                    <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                        {data.monthlySalesCount}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        <ShoppingCart size={12} className="inline mr-1" />
                        Sales (Month)
                    </p>
                </Link>
            </div>
        </div>
    );
}
