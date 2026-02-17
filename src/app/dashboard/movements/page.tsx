"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { createMovement, getMovements } from "@/actions/movement-actions";
import { getProducts } from "@/actions/product-actions";
import { getLocations } from "@/actions/location-actions";
import {
    ArrowRightLeft,
    Plus,
    ArrowRight,
    Calendar,
    Search,
    PackageOpen,
} from "lucide-react";

interface Movement {
    id: number;
    quantity: number;
    notes: string | null;
    createdAt: string;
    product: { sku: string; name: string };
    fromLocation: { name: string; type: string } | null;
    toLocation: { name: string; type: string } | null;
    mover: { name: string };
}

interface Product {
    id: number;
    sku: string;
    name: string;
}

interface Location {
    id: number;
    name: string;
    type: string;
}

export default function MovementsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [movements, setMovements] = useState<Movement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        productId: 0,
        fromLocationId: null as number | null,
        toLocationId: null as number | null,
        quantity: 1,
        notes: "",
    });

    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchMovements = async () => {
        setLoading(true);
        try {
            const data = await getMovements({
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
            });
            setMovements(data as unknown as Movement[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.all([fetchMovements(), getProducts(), getLocations()]).then(
            ([, prods, locs]) => {
                setProducts(prods as unknown as Product[]);
                setLocations(locs as unknown as Location[]);
            }
        );
    }, []);

    useEffect(() => {
        if (dateFrom || dateTo) fetchMovements();
    }, [dateFrom, dateTo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.productId || form.quantity < 1) return;
        setSaving(true);
        try {
            await createMovement({
                productId: form.productId,
                fromLocationId: form.fromLocationId,
                toLocationId: form.toLocationId,
                quantity: form.quantity,
                notes: form.notes || undefined,
            });
            setForm({
                productId: 0,
                fromLocationId: null,
                toLocationId: null,
                quantity: 1,
                notes: "",
            });
            setShowForm(false);
            fetchMovements();
        } catch (error) {
            console.error(error);
            alert("Failed to create movement");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Movements
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Track inventory movements between locations
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        <Plus size={16} />
                        New Movement
                    </button>
                )}
            </div>

            {/* Movement Form */}
            {showForm && isAdmin && (
                <div className="card-neu p-6 animate-slide-up">
                    <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <PackageOpen size={18} className="text-[var(--accent)]" />
                        Record Movement
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Product *
                                </label>
                                <select
                                    value={form.productId}
                                    onChange={(e) =>
                                        setForm({ ...form, productId: Number(e.target.value) })
                                    }
                                    className="input"
                                    required
                                >
                                    <option value={0} disabled>
                                        Select product
                                    </option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.sku} — {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    From Location
                                </label>
                                <select
                                    value={form.fromLocationId || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            fromLocationId: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="input"
                                >
                                    <option value="">— None (Incoming) —</option>
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            [{l.type}] {l.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    To Location
                                </label>
                                <select
                                    value={form.toLocationId || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            toLocationId: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="input"
                                >
                                    <option value="">— None (Outgoing) —</option>
                                    {locations.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            [{l.type}] {l.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={form.quantity}
                                    onChange={(e) =>
                                        setForm({ ...form, quantity: Number(e.target.value) })
                                    }
                                    className="input"
                                    min={1}
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
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="input"
                                placeholder="Optional notes..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn btn-primary"
                            >
                                {saving ? "Saving..." : "Record Movement"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Date Filters */}
            <div className="card-neu p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="w-full sm:flex-1">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div className="w-full sm:flex-1">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="input"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setDateFrom("");
                            setDateTo("");
                            fetchMovements();
                        }}
                        className="btn btn-secondary w-full sm:w-auto"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Movement History */}
            <div className="card-neu overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Product</th>
                                <th>From</th>
                                <th className="w-8"></th>
                                <th>To</th>
                                <th>Qty</th>
                                <th className="hidden md:table-cell">By</th>
                                <th className="hidden lg:table-cell">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="text-center py-12 text-[var(--text-muted)]"
                                    >
                                        No movements recorded
                                    </td>
                                </tr>
                            ) : (
                                movements.map((m) => (
                                    <tr key={m.id}>
                                        <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                            {formatDate(m.createdAt)}
                                        </td>
                                        <td>
                                            <div>
                                                <span className="font-mono text-xs font-semibold">
                                                    {m.product.sku}
                                                </span>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {m.product.name}
                                                </p>
                                            </div>
                                        </td>
                                        <td>
                                            {m.fromLocation ? (
                                                <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]">
                                                    {m.fromLocation.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-emerald-500">
                                                    ● Incoming
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <ArrowRight
                                                size={14}
                                                className="text-[var(--text-muted)]"
                                            />
                                        </td>
                                        <td>
                                            {m.toLocation ? (
                                                <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]">
                                                    {m.toLocation.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-red-500">
                                                    ● Outgoing
                                                </span>
                                            )}
                                        </td>
                                        <td className="font-semibold">{m.quantity}</td>
                                        <td className="hidden md:table-cell text-[var(--text-secondary)]">
                                            {m.mover.name}
                                        </td>
                                        <td className="hidden lg:table-cell text-[var(--text-muted)] text-xs max-w-32 truncate">
                                            {m.notes || "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
