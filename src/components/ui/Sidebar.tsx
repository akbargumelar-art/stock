"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ArrowRightLeft,
    MapPin,
    Users,
    X,
    Box,
    HandCoins,
    ShoppingCart,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/movements", label: "Movements", icon: ArrowRightLeft },
    { href: "/dashboard/loans", label: "Loans", icon: HandCoins },
    { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/users", label: "Users & Audit", icon: Users },
];

export default function Sidebar({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="sidebar-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={clsx(
                    "sidebar w-64 h-screen flex flex-col border-r fixed top-0 left-0",
                    "bg-[var(--bg-secondary)] border-[var(--border-color)]",
                    isOpen && "open"
                )}
                style={{ zIndex: 40 }}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
                    <Link href="/dashboard" className="flex items-center gap-3 no-underline">
                        <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center">
                            <Box size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                                StockFlow
                            </h1>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                Inventory System
                            </p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="btn-ghost p-1 rounded md:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline",
                                    isActive
                                        ? "bg-[var(--accent)] text-white shadow-md shadow-indigo-500/20"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-color)]">
                    <p className="text-[11px] text-[var(--text-muted)] text-center">
                        © 2026 Aarasa
                    </p>
                </div>
            </aside>
        </>
    );
}
