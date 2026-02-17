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
    { href: "/dashboard/categories", label: "Categories", icon: Box },
    { href: "/dashboard/movements", label: "Movements", icon: ArrowRightLeft },
    { href: "/dashboard/loans", label: "Loans", icon: HandCoins },
    { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart },
    { href: "/dashboard/locations", label: "Locations", icon: MapPin },
    { href: "/dashboard/users", label: "Users & Audit", icon: Users },
];

export default function Sidebar({
    isOpen,
    onClose,
    isCollapsed,
    toggleCollapse,
}: {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed: boolean;
    toggleCollapse: () => void;
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
                    "sidebar h-screen flex flex-col border-r fixed top-0 left-0 transition-all duration-300",
                    "bg-[var(--bg-secondary)] border-[var(--border-color)]",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    isCollapsed ? "w-20" : "w-64"
                )}
                style={{ zIndex: 40 }}
            >
                {/* Logo */}
                <div className={clsx("flex items-center p-4 h-16 border-b border-[var(--border-color)]", isCollapsed ? "justify-center" : "justify-between")}>
                    <Link href="/dashboard" className="flex items-center gap-3 no-underline overflow-hidden">
                        <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center flex-shrink-0">
                            <Box size={20} className="text-white" />
                        </div>
                        <div className={clsx("transition-opacity duration-300", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                            <h1 className="text-base font-bold text-[var(--text-primary)] leading-tight whitespace-nowrap">
                                StockFlow
                            </h1>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap">
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
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                title={isCollapsed ? item.label : ""}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline",
                                    isActive
                                        ? "bg-[var(--accent)] text-white shadow-md shadow-indigo-500/20"
                                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <item.icon size={20} className="flex-shrink-0" />
                                <span className={clsx("transition-all duration-300 whitespace-nowrap", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Toggle */}
                <div className="p-3 border-t border-[var(--border-color)] flex flex-col gap-2">
                    <button
                        onClick={toggleCollapse}
                        className="hidden md:flex items-center justify-center p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ArrowRightLeft size={18} /> : <div className="flex items-center gap-2 w-full"><ArrowRightLeft size={18} /><span className="text-xs">Collapse Sidebar</span></div>}
                    </button>

                    <p className={clsx("text-[10px] text-[var(--text-muted)] text-center transition-opacity duration-300", isCollapsed ? "opacity-0 hidden" : "opacity-100")}>
                        © 2026 Aarasa
                    </p>
                </div>
            </aside>
        </>
    );
}
