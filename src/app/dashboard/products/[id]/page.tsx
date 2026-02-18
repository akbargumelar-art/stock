"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowLeft, Package, Clock, User, ArrowUpRight, ArrowDownLeft,
    Droplets, Globe, Store, MapPin, Link as LinkIcon, Calendar,
    ExternalLink, Minus, ArrowRightLeft, Warehouse,
} from "lucide-react";
import { getProductDetails, getProductHistory } from "@/actions/product-detail-actions";
import { consumeProduct, createMovement } from "@/actions/movement-actions";
import { getLocations } from "@/actions/location-actions";
import { getStockStatus, getStockStatusColor, getStockStatusLabel } from "@/lib/stock-status";
import toast, { Toaster } from "react-hot-toast";

interface ProductLocation {
    locationId: number;
    quantity: number;
    location: { id: number; name: string; type: string };
}

interface ProductDetail {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    unit: string;
    price: number;
    costPrice: number;
    minStock: number;
    currentStock: number;
    qrCode: string | null;
    image: string | null;
    purchaseDate: string | null;
    purchaseSource: "ONLINE" | "OFFLINE" | null;
    purchaseLink: string | null;
    storeName: string | null;
    storeLocation: string | null;
    isConsumable: boolean;
    condition: string | null;
    category: { name: string };
    productLocations: ProductLocation[];
}

interface StockMovement {
    id: number;
    type: "IN" | "OUT" | "LOAN_OUT" | "LOAN_RETURN" | "SALE" | "CONSUME";
    quantity: number;
    notes: string | null;
    createdAt: Date;
    mover?: { name: string | null; email: string | null };
}

interface Location {
    id: number;
    name: string;
    type: string;
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);

    // Consume modal
    const [showConsumeModal, setShowConsumeModal] = useState(false);
    const [consumeQty, setConsumeQty] = useState(1);
    const [consumeNotes, setConsumeNotes] = useState("");
    const [consuming, setConsuming] = useState(false);

    // Transfer/Move modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferType, setTransferType] = useState<"IN" | "OUT" | "TRANSFER">("IN");
    const [transferQty, setTransferQty] = useState(1);
    const [fromLocId, setFromLocId] = useState<number | "">("");
    const [toLocId, setToLocId] = useState<number | "">("");
    const [transferNotes, setTransferNotes] = useState("");
    const [transferring, setTransferring] = useState(false);

    const fetchData = async () => {
        try {
            const id = Number(params.id);
            if (isNaN(id)) return;

            const [prodData, histData, locsData] = await Promise.all([
                getProductDetails(id),
                getProductHistory(id),
                getLocations(),
            ]);

            if (!prodData) {
                toast.error("Product not found");
                router.push("/dashboard/products");
                return;
            }

            setProduct(prodData as unknown as ProductDetail);
            setHistory(histData as unknown as StockMovement[]);
            setLocations(locsData as unknown as Location[]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load product details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.id, router]);

    const handleConsume = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setConsuming(true);
        try {
            await consumeProduct({
                productId: product.id,
                quantity: consumeQty,
                notes: consumeNotes || undefined,
            });
            toast.success(`Berhasil menggunakan ${consumeQty} ${product.unit}`);
            setShowConsumeModal(false);
            setConsumeQty(1);
            setConsumeNotes("");
            setLoading(true);
            await fetchData();
        } catch (error: any) {
            toast.error(error?.message || "Gagal menggunakan produk");
        } finally {
            setConsuming(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setTransferring(true);
        try {
            await createMovement({
                productId: product.id,
                fromLocationId: fromLocId ? Number(fromLocId) : null,
                toLocationId: toLocId ? Number(toLocId) : null,
                quantity: transferQty,
                notes: transferNotes || undefined,
            });
            toast.success("Stock movement recorded");
            setShowTransferModal(false);
            setTransferQty(1);
            setFromLocId("");
            setToLocId("");
            setTransferNotes("");
            setLoading(true);
            await fetchData();
        } catch (error: any) {
            toast.error(error?.message || "Failed to record movement");
        } finally {
            setTransferring(false);
        }
    };

    const getMovementIcon = (type: string) => {
        switch (type) {
            case "IN": return <ArrowDownLeft size={12} />;
            case "CONSUME": return <Droplets size={12} />;
            default: return <ArrowUpRight size={12} />;
        }
    };

    const getMovementColor = (type: string) => {
        switch (type) {
            case "IN":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "CONSUME":
                return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            default:
                return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
        }
    };

    const getMovementSign = (type: string) => {
        return type === "IN" ? "+" : "-";
    };

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
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                            {product.isConsumable && (
                                <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                        <Droplets size={12} />
                                        Konsumtif
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`badge ${getStockStatusColor(status)} text-sm px-3 py-1`}>
                        {getStockStatusLabel(status)}
                    </span>
                    {isAdmin && (
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="btn btn-secondary text-sm flex items-center gap-2"
                        >
                            <ArrowRightLeft size={16} />
                            Transfer Stock
                        </button>
                    )}
                    {product.isConsumable && isAdmin && (
                        <button
                            onClick={() => setShowConsumeModal(true)}
                            className="btn btn-primary text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <Droplets size={16} />
                            Gunakan
                        </button>
                    )}
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
                            <div className="text-xs text-[var(--text-muted)] uppercase">Harga Beli</div>
                            <div className="text-xl font-bold text-[var(--text-primary)]">
                                Rp {product.costPrice.toLocaleString()}
                            </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Category</div>
                            <div className="text-lg font-semibold text-[var(--text-primary)] truncate" title={product.category.name}>
                                {product.category.name}
                            </div>
                        </div>
                        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-xs text-[var(--text-muted)] uppercase">Kondisi Produk</div>
                            <div className="text-lg font-semibold text-[var(--text-primary)] mt-1">
                                {product.condition || "—"}
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

                    {/* Stock Breakdown */}
                    <div className="pt-2 border-t border-[var(--border-color)]">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <Warehouse size={16} className="text-[var(--accent)]" />
                            Stock Breakdown by Location
                        </h3>
                        {product.productLocations.length === 0 ? (
                            <div className="text-sm text-[var(--text-muted)] italic">
                                No stock assigned to specific locations (Global only).
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {product.productLocations.map((pl) => (
                                    <div key={pl.locationId} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                                        <div>
                                            <div className="text-sm font-semibold text-[var(--text-primary)]">
                                                {pl.location.name}
                                            </div>
                                            <div className="text-xs text-[var(--text-muted)] uppercase">
                                                {pl.location.type}
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold text-[var(--text-primary)]">
                                            {pl.quantity} <span className="text-xs font-normal text-[var(--text-muted)]">{product.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Purchase Info */}
                    {(product.purchaseDate || product.purchaseSource) && (
                        <div className="pt-2 border-t border-[var(--border-color)]">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <Calendar size={16} className="text-[var(--accent)]" />
                                Informasi Pembelian
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {product.purchaseDate && (
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-xs text-[var(--text-muted)] uppercase flex items-center gap-1">
                                            <Calendar size={12} /> Tanggal Beli
                                        </div>
                                        <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
                                            {new Date(product.purchaseDate).toLocaleDateString("id-ID", {
                                                day: "numeric", month: "long", year: "numeric"
                                            })}
                                        </div>
                                    </div>
                                )}
                                {product.purchaseSource && (
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                        <div className="text-xs text-[var(--text-muted)] uppercase flex items-center gap-1">
                                            {product.purchaseSource === "ONLINE" ? <Globe size={12} /> : <Store size={12} />}
                                            Tempat Beli
                                        </div>
                                        <div className="text-sm font-medium text-[var(--text-primary)] mt-1 flex items-center gap-1">
                                            {product.purchaseSource === "ONLINE" ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                                        <Globe size={10} /> Online
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                                                    <Store size={10} /> Offline
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {product.purchaseSource === "ONLINE" && product.purchaseLink && (
                                    <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg sm:col-span-2">
                                        <div className="text-xs text-[var(--text-muted)] uppercase flex items-center gap-1">
                                            <LinkIcon size={12} /> Link Pembelian
                                        </div>
                                        <a
                                            href={product.purchaseLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-[var(--accent)] hover:underline mt-1 flex items-center gap-1 break-all"
                                        >
                                            {product.purchaseLink}
                                            <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                                {product.purchaseSource === "OFFLINE" && (product.storeName || product.storeLocation) && (
                                    <>
                                        {product.storeName && (
                                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                                <div className="text-xs text-[var(--text-muted)] uppercase flex items-center gap-1">
                                                    <Store size={12} /> Nama Toko
                                                </div>
                                                <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
                                                    {product.storeName}
                                                </div>
                                            </div>
                                        )}
                                        {product.storeLocation && (
                                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                                                <div className="text-xs text-[var(--text-muted)] uppercase flex items-center gap-1">
                                                    <MapPin size={12} /> Lokasi Toko
                                                </div>
                                                <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
                                                    {product.storeLocation}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
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
                                <th className="py-3 px-4">From</th>
                                <th className="py-3 px-4">To</th>
                                <th className="py-3 px-4">Qty</th>
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                                        No movement history found.
                                    </td>
                                </tr>
                            ) : (
                                history.map((movement: any) => (
                                    <tr key={movement.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <td className="py-3 px-4 whitespace-nowrap">
                                            {new Date(movement.createdAt).toLocaleDateString()}
                                            <span className="text-xs text-[var(--text-muted)] block">
                                                {new Date(movement.createdAt).toLocaleTimeString()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getMovementColor(movement.type)}`}>
                                                {getMovementIcon(movement.type)}
                                                {movement.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                                            {movement.fromLocation ? movement.fromLocation.name : "—"}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-[var(--text-secondary)]">
                                            {movement.toLocation ? movement.toLocation.name : "—"}
                                        </td>
                                        <td className="py-3 px-4 font-mono font-medium">
                                            {getMovementSign(movement.type)}{Math.abs(movement.quantity)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                                                    <User size={12} className="text-[var(--text-muted)]" />
                                                </div>
                                                <span className="truncate max-w-[100px]" title={movement.mover?.email || ""}>
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

            {/* Consume Modal */}
            {showConsumeModal && product && (
                <div className="modal-overlay" onClick={() => setShowConsumeModal(false)}>
                    <div
                        className="modal-content animate-slide-up p-6 max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Droplets size={20} className="text-purple-500" />
                                Gunakan Produk
                            </h2>
                            <button onClick={() => setShowConsumeModal(false)} className="btn btn-ghost p-1">
                                <Minus size={18} />
                            </button>
                        </div>
                        <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                            <div className="text-sm font-medium text-[var(--text-primary)]">{product.name}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-1">
                                Stock saat ini: <span className="font-bold">{product.currentStock} {product.unit}</span>
                            </div>
                        </div>
                        <form onSubmit={handleConsume} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Jumlah yang digunakan *
                                </label>
                                <input
                                    type="number"
                                    value={consumeQty}
                                    onChange={(e) => setConsumeQty(Number(e.target.value))}
                                    className="input w-full"
                                    min={1}
                                    max={product.currentStock}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Catatan (opsional)
                                </label>
                                <textarea
                                    value={consumeNotes}
                                    onChange={(e) => setConsumeNotes(e.target.value)}
                                    className="input w-full"
                                    rows={2}
                                    placeholder="Contoh: Dipakai untuk event..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowConsumeModal(false)} className="btn btn-secondary flex-1">
                                    Batal
                                </button>
                                <button type="submit" disabled={consuming} className="btn btn-primary flex-1 bg-purple-600 hover:bg-purple-700">
                                    {consuming ? "Memproses..." : "Gunakan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && product && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal-content animate-slide-up p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <ArrowRightLeft size={20} className="text-[var(--accent)]" />
                                Transfer Stock
                            </h2>
                            <button onClick={() => setShowTransferModal(false)} className="btn btn-ghost p-1">
                                <Minus size={18} />
                            </button>
                        </div>

                        <div className="flex gap-2 mb-4 p-1 bg-[var(--bg-tertiary)] rounded-lg">
                            <button
                                type="button"
                                onClick={() => { setTransferType("IN"); setFromLocId(""); setToLocId(""); }}
                                className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${transferType === "IN" ? "bg-[var(--bg-secondary)] shadow-sm text-green-600" : "text-[var(--text-muted)]"}`}
                            >
                                Incoming (In)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTransferType("OUT"); setFromLocId(""); setToLocId(""); }}
                                className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${transferType === "OUT" ? "bg-[var(--bg-secondary)] shadow-sm text-red-600" : "text-[var(--text-muted)]"}`}
                            >
                                Outgoing (Out)
                            </button>
                            <button
                                type="button"
                                onClick={() => { setTransferType("TRANSFER"); setFromLocId(""); setToLocId(""); }}
                                className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${transferType === "TRANSFER" ? "bg-[var(--bg-secondary)] shadow-sm text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                            >
                                Transfer
                            </button>
                        </div>

                        <form onSubmit={handleTransfer} className="space-y-4">
                            {/* Source Location */}
                            {(transferType === "OUT" || transferType === "TRANSFER") && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        From Location
                                    </label>
                                    <select
                                        value={fromLocId}
                                        onChange={(e) => setFromLocId(Number(e.target.value))}
                                        className="input w-full"
                                        required={transferType === "TRANSFER"}
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} [{l.type}]</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Destination Location */}
                            {(transferType === "IN" || transferType === "TRANSFER") && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        To Location
                                    </label>
                                    <select
                                        value={toLocId}
                                        onChange={(e) => setToLocId(Number(e.target.value))}
                                        className="input w-full"
                                        required={transferType === "TRANSFER"}
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(l => (
                                            <option key={l.id} value={l.id}>{l.name} [{l.type}]</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={transferQty}
                                    onChange={(e) => setTransferQty(Number(e.target.value))}
                                    className="input w-full"
                                    min={1}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Notes
                                </label>
                                <input
                                    type="text"
                                    value={transferNotes}
                                    onChange={(e) => setTransferNotes(e.target.value)}
                                    className="input w-full"
                                    placeholder="Optional notes"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowTransferModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={transferring} className="btn btn-primary flex-1">
                                    {transferring ? "Saving..." : "Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
