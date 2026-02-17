"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";
import Sidebar from "@/components/ui/Sidebar";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SessionProvider } from "next-auth/react";

const isMock = process.env.NEXT_PUBLIC_MOCK_DATA === "true";

const mockSession = {
    data: {
        user: { id: "u1", name: "Admin Demo", email: "admin@stockflow.local", role: "ADMIN" },
        expires: new Date(Date.now() + 86400000).toISOString(),
    },
    status: "authenticated" as const,
    update: async () => null,
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const realSession = useSession();
    const session = isMock ? mockSession.data : realSession.data;

    return (
        <div className="min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="md:ml-64 min-h-screen flex flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-20 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-4 py-3 md:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="btn btn-ghost p-2 md:hidden"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="hidden md:block" />

                        <div className="flex items-center gap-2">
                            <ThemeToggle />

                            {session?.user && (
                                <div className="flex items-center gap-3 ml-2 pl-3 border-l border-[var(--border-color)]">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                                            {session.user.name}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-muted)]">
                                            {(session.user as { role?: string }).role || "ADMIN"}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center">
                                        <User size={14} className="text-white" />
                                    </div>
                                    {!isMock && (
                                        <button
                                            onClick={() => signOut({ callbackUrl: "/login" })}
                                            className="btn btn-ghost p-2 text-[var(--text-muted)] hover:text-red-500"
                                            title="Sign Out"
                                        >
                                            <LogOut size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider session={isMock ? mockSession.data : undefined}>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SessionProvider>
    );
}
