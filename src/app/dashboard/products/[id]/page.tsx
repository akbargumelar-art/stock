"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, User, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { getProductDetails, getProductHistory } from "@/actions/product-detail-actions";
import { getStockStatus, getStockStatusColor, getStockStatusLabel } from "@/lib/stock-status";
import toast from "react-hot-toast";

interface ProductDetail {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    unit: string;
    price: number;
    minStock: number;
    currentStock: number;
    qrCode: string | null;
    category: { name: string };
    productLocations: any[];
}

interface StockMovement {
    id: number;
    type: "IN" | "OUT";
    quantity: number;
    notes: string | null;
    createdAt: Date;
    mover?: { name: string | null; email: string | null };
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const id = Number(params.id);
                if (isNaN(id)) return;

                const [prodData, histData] = await Promise.all([
                    getProductDetails(id),
                    getProductHistory(id),
                ]);

                if (!prodData) {
                    toast.error("Product not found");
                    router.push("/dashboard/products");
                    return;
                }

                setProduct(prodData as ProductDetail);
                setHistory(histData as StockMovement[]);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) return null;

    const status = getStockStatus(product.currentStock, product.minStock);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="btn btn-ghost p-2 rounded-full hover:bg-gray-100"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        {product.name}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="font-mono">{product.sku}</span>
                        <span>•</span>
                        <span>{product.category.name}</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <span className={`badge ${getStockStatusColor(status)} text-sm px-3 py-1`}>
                        {getStockStatusLabel(status)}
                    </span>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="card-neu p-6 md:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Package size={20} className="text-[var(--accent)]" />
                        Product Information
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Current Stock</div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {product.currentStock} <span className="text-xs font-normal">{product.unit}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Min Stock</div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                {product.minStock} <span className="text-xs font-normal">{product.unit}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Price</div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                Rp {product.price.toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Category</div>
                            <div className="text-lg font-semibold text-[var(--text-primary)] truncate" title={product.category.name}>
                                {product.category.name}
                            </div>
                        </div>
                    </div>
                    {product.description && (
                        <div className="pt-2">
                            <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">Description</div>
                            <p className="text-sm text-[var(--text-muted)] bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                                {product.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* QR Code Card */}
                <div className="card-neu p-6 flex flex-col items-center justify-center text-center">
                    <h2 className="text-lg font-semibold mb-4 w-full text-left">QR Code</h2>
                    {product.qrCode ? (
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <img src={product.qrCode} alt="QR Code" className="w-40 h-40 object-contain" />
                            <div className="mt-2 text-xs font-mono text-gray-500">{product.sku}</div>
                        </div>
                    ) : (
                        <div className="text-[var(--text-muted)] text-sm py-10">
                            No QR Code generated
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div className="card-neu p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-[var(--accent)]" />
                    Movement History
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-xs uppercase text-[var(--text-secondary)]">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Quantity</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                                        No movement history found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((movement) => (
                                    <tr key={movement.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <td className="py-3 px-4">
                                            {new Date(movement.createdAt).toLocaleDateString()}
                                            <span className="text-xs text-[var(--text-muted)] block">
                                                {new Date(movement.createdAt).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${movement.type === "IN"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                }`}>
                                                {movement.type === "IN" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                                {movement.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-mono font-medium">
                                            {movement.type === "IN" ? "+" : "-"}{Math.abs(movement.quantity)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                                                    <User size={12} className="text-[var(--text-muted)]" />
                                                </div>
                                                <span className="truncate max-w-[120px]" title={movement.mover?.email || ""}>
                                                    {movement.mover?.name || "Unknown"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-[var(--text-secondary)] max-w-xs truncate" title={movement.notes || ""}>
                                            {movement.notes || "—"}
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
