"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    getLoans,
    createLoan,
    returnLoan,
    sendLoanReminder,
} from "@/actions/loan-actions";
import { getProducts } from "@/actions/product-actions";
import {
    HandCoins,
    Plus,
    RotateCcw,
    Send,
    X,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
} from "lucide-react";

interface LoanItem {
    id: string;
    transactionCode: string;
    borrowerName: string;
    borrowerPhone: string;
    qty: number;
    loanDate: string;
    dueDate: string;
    returnDate: string | null;
    status: "ACTIVE" | "RETURNED" | "OVERDUE";
    lastNotifiedAt: string | null;
    notes: string | null;
    product: { id: number; sku: string; name: string; unit: string };
}

interface ProductOption {
    id: number;
    sku: string;
    name: string;
    currentStock: number;
    unit: string;
}

export default function LoansPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [loans, setLoans] = useState<LoanItem[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [form, setForm] = useState({
        borrowerName: "",
        borrowerPhone: "",
        productId: 0,
        qty: 1,
        dueDate: "",
        notes: "",
    });

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const data = await getLoans({ status: statusFilter, search });
            setLoans(data as unknown as LoanItem[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data as unknown as ProductOption[]);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [statusFilter, search]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createLoan(form);
            setShowModal(false);
            setForm({
                borrowerName: "",
                borrowerPhone: "",
                productId: 0,
                qty: 1,
                dueDate: "",
                notes: "",
            });
            fetchLoans();
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Failed to create loan";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleReturn = async (loanId: string) => {
        if (!confirm("Mark this loan as returned?")) return;
        setActionLoading(loanId);
        try {
            await returnLoan(loanId);
            fetchLoans();
        } catch (error) {
            console.error(error);
            alert("Failed to process return");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReminder = async (loanId: string) => {
        setActionLoading(loanId);
        try {
            const sent = await sendLoanReminder(loanId);
            alert(sent ? "Reminder sent via WhatsApp" : "Failed to send reminder");
            fetchLoans();
        } catch (error) {
            console.error(error);
            alert("Failed to send reminder");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "RETURNED":
                return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "OVERDUE":
                return "text-red-500 bg-red-500/10 border-red-500/20";
            default:
                return "";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Clock size={12} />;
            case "RETURNED":
                return <CheckCircle size={12} />;
            case "OVERDUE":
                return <AlertTriangle size={12} />;
            default:
                return null;
        }
    };

    const stats = {
        active: loans.filter((l) => l.status === "ACTIVE").length,
        overdue: loans.filter((l) => l.status === "OVERDUE").length,
        returned: loans.filter((l) => l.status === "RETURNED").length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Loan Management
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Track borrowed items and send reminders
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={16} />
                        New Loan
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card-neu p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Clock size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                {stats.active}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Active</p>
                        </div>
                    </div>
                </div>
                <div className="card-neu p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                {stats.overdue}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Overdue</p>
                        </div>
                    </div>
                </div>
                <div className="card-neu p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                {stats.returned}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">Returned</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search borrower or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-9"
                    />
                </div>
                <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)]">
                    {["ALL", "ACTIVE", "OVERDUE", "RETURNED"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === s
                                    ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : loans.length === 0 ? (
                <div className="card-neu p-12 text-center">
                    <HandCoins
                        size={40}
                        className="mx-auto text-[var(--text-muted)] mb-3"
                    />
                    <p className="text-[var(--text-muted)]">No loans found</p>
                </div>
            ) : (
                <div className="card-neu overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Borrower</th>
                                    <th>Product</th>
                                    <th className="text-right">Qty</th>
                                    <th className="hidden md:table-cell">Loan Date</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th className="w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((loan) => (
                                    <tr
                                        key={loan.id}
                                        className={
                                            loan.status === "OVERDUE"
                                                ? "!bg-red-500/5 border-l-2 border-l-red-500"
                                                : ""
                                        }
                                    >
                                        <td className="font-mono text-xs font-medium">
                                            {loan.transactionCode}
                                        </td>
                                        <td>
                                            <div>
                                                <span className="font-medium text-sm">
                                                    {loan.borrowerName}
                                                </span>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {loan.borrowerPhone}
                                                </p>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm">{loan.product.name}</span>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {loan.product.sku}
                                            </p>
                                        </td>
                                        <td className="text-right font-mono">
                                            {loan.qty} {loan.product.unit}
                                        </td>
                                        <td className="hidden md:table-cell text-xs text-[var(--text-secondary)]">
                                            {formatDate(loan.loanDate)}
                                        </td>
                                        <td className="text-xs text-[var(--text-secondary)]">
                                            {formatDate(loan.dueDate)}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge inline-flex items-center gap-1 ${getStatusStyle(
                                                    loan.status
                                                )}`}
                                            >
                                                {getStatusIcon(loan.status)}
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td>
                                            {loan.status !== "RETURNED" && isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleReturn(loan.id)}
                                                        disabled={actionLoading === loan.id}
                                                        className="btn btn-ghost p-1.5 text-emerald-500"
                                                        title="Mark as Returned"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleReminder(loan.id)}
                                                        disabled={actionLoading === loan.id}
                                                        className="btn btn-ghost p-1.5 text-amber-500"
                                                        title="Send WA Reminder"
                                                    >
                                                        <Send size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {loan.status === "RETURNED" && loan.returnDate && (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {formatDate(loan.returnDate)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Loan Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content animate-slide-up p-6 max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                New Loan
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Borrower Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.borrowerName}
                                        onChange={(e) =>
                                            setForm({ ...form, borrowerName: e.target.value })
                                        }
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Phone (628...)
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.borrowerPhone}
                                        onChange={(e) =>
                                            setForm({ ...form, borrowerPhone: e.target.value })
                                        }
                                        className="input"
                                        placeholder="628123456789"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Product
                                </label>
                                <select
                                    value={form.productId}
                                    onChange={(e) =>
                                        setForm({ ...form, productId: Number(e.target.value) })
                                    }
                                    className="input"
                                    required
                                >
                                    <option value={0}>— Select Product —</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.sku}) — Stock: {p.currentStock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={form.qty}
                                        onChange={(e) =>
                                            setForm({ ...form, qty: Number(e.target.value) })
                                        }
                                        className="input font-mono"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.dueDate}
                                        onChange={(e) =>
                                            setForm({ ...form, dueDate: e.target.value })
                                        }
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Notes
                                </label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm({ ...form, notes: e.target.value })
                                    }
                                    className="input"
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? "Creating..." : "Create Loan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
