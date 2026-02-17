"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
    getSales,
    getSaleDetail,
    createSale,
    getProductsForSale,
} from "@/actions/sale-actions";
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    X,
    Receipt,
    Eye,
    CheckCircle,
} from "lucide-react";

interface ProductOption {
    id: number;
    sku: string;
    name: string;
    price: number;
    costPrice: number;
    currentStock: number;
    unit: string;
}

interface CartItem {
    productId: number;
    sku: string;
    name: string;
    unit: string;
    qty: number;
    sellingPrice: number;
    maxStock: number;
}

interface SaleRecord {
    id: string;
    invoiceCode: string;
    customerName: string | null;
    totalAmount: number;
    saleDate: string;
    _count: { items: number };
    items: {
        qty: number;
        sellingPrice: number;
        product: { sku: string; name: string };
    }[];
}

interface SaleDetailRecord {
    id: string;
    invoiceCode: string;
    customerName: string | null;
    totalAmount: number;
    saleDate: string;
    items: {
        id: number;
        qty: number;
        sellingPrice: number;
        costPrice: number;
        product: { sku: string; name: string; unit: string };
    }[];
}

export default function SalesPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [activeTab, setActiveTab] = useState<"pos" | "history">(
        isAdmin ? "pos" : "history"
    );

    // POS state
    const [productSearch, setProductSearch] = useState("");
    const [searchResults, setSearchResults] = useState<ProductOption[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const [saleSuccess, setSaleSuccess] = useState<string | null>(null);

    // History state
    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [historySearch, setHistorySearch] = useState("");
    const [historyLoading, setHistoryLoading] = useState(false);
    const [detailModal, setDetailModal] = useState<SaleDetailRecord | null>(
        null
    );

    // Search products for POS
    const searchProducts = useCallback(async (q: string) => {
        if (q.length < 1) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await getProductsForSale(q);
            setSearchResults(results as unknown as ProductOption[]);
            setShowResults(true);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => searchProducts(productSearch), 300);
        return () => clearTimeout(timer);
    }, [productSearch, searchProducts]);

    // Fetch sales history
    const fetchSales = async () => {
        setHistoryLoading(true);
        try {
            const data = await getSales({ search: historySearch });
            setSales(data as unknown as SaleRecord[]);
        } catch (error) {
            console.error(error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "history") fetchSales();
    }, [activeTab, historySearch]);

    // Cart management
    const addToCart = (product: ProductOption) => {
        const existing = cart.find((c) => c.productId === product.id);
        if (existing) {
            if (existing.qty < product.currentStock) {
                setCart(
                    cart.map((c) =>
                        c.productId === product.id ? { ...c, qty: c.qty + 1 } : c
                    )
                );
            }
        } else {
            setCart([
                ...cart,
                {
                    productId: product.id,
                    sku: product.sku,
                    name: product.name,
                    unit: product.unit,
                    qty: 1,
                    sellingPrice: product.price,
                    maxStock: product.currentStock,
                },
            ]);
        }
        setProductSearch("");
        setShowResults(false);
    };

    const updateQty = (productId: number, delta: number) => {
        setCart(
            cart
                .map((c) => {
                    if (c.productId !== productId) return c;
                    const newQty = c.qty + delta;
                    if (newQty < 1) return c;
                    if (newQty > c.maxStock) return c;
                    return { ...c, qty: newQty };
                })
        );
    };

    const updatePrice = (productId: number, price: number) => {
        setCart(
            cart.map((c) =>
                c.productId === productId ? { ...c, sellingPrice: price } : c
            )
        );
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter((c) => c.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, i) => sum + i.qty * i.sellingPrice, 0);

    const handleFinalize = async () => {
        if (cart.length === 0) return;
        setFinalizing(true);
        try {
            const result = await createSale({
                customerName: customerName || undefined,
                items: cart.map((c) => ({
                    productId: c.productId,
                    qty: c.qty,
                    sellingPrice: c.sellingPrice,
                })),
            });
            setSaleSuccess(
                (result as unknown as { invoiceCode: string }).invoiceCode
            );
            setCart([]);
            setCustomerName("");
        } catch (error: unknown) {
            const msg =
                error instanceof Error ? error.message : "Failed to create sale";
            alert(msg);
        } finally {
            setFinalizing(false);
        }
    };

    const viewDetail = async (id: string) => {
        try {
            const detail = await getSaleDetail(id);
            setDetailModal(detail as unknown as SaleDetailRecord);
        } catch (error) {
            console.error(error);
        }
    };

    const formatRp = (amount: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Sales
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Point of sale & transaction history
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)] w-fit">
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab("pos")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "pos"
                            ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                    >
                        <ShoppingCart size={16} />
                        New Sale
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("history")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "history"
                        ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                >
                    <Receipt size={16} />
                    History
                </button>
            </div>

            {/* POS Tab */}
            {activeTab === "pos" && isAdmin && (
                <>
                    {saleSuccess && (
                        <div className="card-neu p-6 text-center border-2 border-emerald-500/30">
                            <CheckCircle
                                size={48}
                                className="mx-auto text-emerald-500 mb-3"
                            />
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                Sale Completed!
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)] mt-1">
                                Invoice: <span className="font-mono">{saleSuccess}</span>
                            </p>
                            <button
                                onClick={() => setSaleSuccess(null)}
                                className="btn btn-primary mt-4"
                            >
                                New Sale
                            </button>
                        </div>
                    )}

                    {!saleSuccess && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            {/* Product Search */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="card-neu p-4 space-y-4">
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                        Add Products
                                    </h3>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Search by name or SKU..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            onFocus={() =>
                                                searchResults.length > 0 && setShowResults(true)
                                            }
                                            onBlur={() =>
                                                setTimeout(() => setShowResults(false), 200)
                                            }
                                            className="input pl-9"
                                        />

                                        {/* Dropdown Results */}
                                        {showResults && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 card-neu rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
                                                {searchResults.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => addToCart(p)}
                                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition text-left border-b border-[var(--border-color)] last:border-0"
                                                    >
                                                        <div>
                                                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                                                {p.name}
                                                            </span>
                                                            <p className="text-xs text-[var(--text-muted)]">
                                                                {p.sku} · Stock: {p.currentStock} {p.unit}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-mono text-[var(--text-secondary)] block text-right">
                                                            Sell: {formatRp(p.price)}
                                                        </span>
                                                        <span className="text-xs font-mono text-[var(--text-muted)] block text-right">
                                                            Buy: {formatRp(p.costPrice)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Cart Table */}
                                    {cart.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <ShoppingCart
                                                size={32}
                                                className="mx-auto text-[var(--text-muted)] mb-2"
                                            />
                                            <p className="text-sm text-[var(--text-muted)]">
                                                Cart is empty. Search for products above.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Product</th>
                                                        <th className="text-center w-36">Qty</th>
                                                        <th className="text-right w-36">Price</th>
                                                        <th className="text-right w-32">Subtotal</th>
                                                        <th className="w-12"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cart.map((item) => (
                                                        <tr key={item.productId}>
                                                            <td>
                                                                <span className="text-sm font-medium">
                                                                    {item.name}
                                                                </span>
                                                                <p className="text-xs text-[var(--text-muted)]">
                                                                    {item.sku} · Max: {item.maxStock}
                                                                </p>
                                                            </td>
                                                            <td>
                                                                <div className="flex items-center justify-center gap-1">
                                                                    <button
                                                                        onClick={() =>
                                                                            updateQty(item.productId, -1)
                                                                        }
                                                                        className="btn btn-ghost p-1 rounded"
                                                                        disabled={item.qty <= 1}
                                                                    >
                                                                        <Minus size={14} />
                                                                    </button>
                                                                    <span className="w-10 text-center font-mono text-sm font-medium">
                                                                        {item.qty}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            updateQty(item.productId, 1)
                                                                        }
                                                                        className="btn btn-ghost p-1 rounded"
                                                                        disabled={item.qty >= item.maxStock}
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="text-right">
                                                                <input
                                                                    type="number"
                                                                    value={item.sellingPrice}
                                                                    onChange={(e) =>
                                                                        updatePrice(
                                                                            item.productId,
                                                                            Number(e.target.value)
                                                                        )
                                                                    }
                                                                    className="input w-28 text-right font-mono text-sm"
                                                                    min={0}
                                                                />
                                                            </td>
                                                            <td className="text-right font-mono text-sm font-medium">
                                                                {formatRp(item.qty * item.sellingPrice)}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    onClick={() =>
                                                                        removeFromCart(item.productId)
                                                                    }
                                                                    className="btn btn-ghost p-1 text-red-500"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Summary Sidebar */}
                            <div className="lg:col-span-2">
                                <div className="card-neu p-5 space-y-4 sticky top-4">
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                        Sale Summary
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                            Customer Name (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="input"
                                            placeholder="Walk-in customer"
                                        />
                                    </div>

                                    <div className="space-y-2 py-3 border-t border-b border-[var(--border-color)]">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-secondary)]">
                                                Items
                                            </span>
                                            <span className="font-mono">{cart.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--text-secondary)]">
                                                Total Qty
                                            </span>
                                            <span className="font-mono">
                                                {cart.reduce((s, i) => s + i.qty, 0)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                                            Total
                                        </span>
                                        <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                                            {formatRp(cartTotal)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleFinalize}
                                        disabled={cart.length === 0 || finalizing}
                                        className="btn btn-primary w-full py-3 text-base"
                                    >
                                        {finalizing ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <CheckCircle size={18} />
                                                Finalize Sale
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="input pl-9"
                        />
                    </div>

                    {historyLoading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="card-neu p-12 text-center">
                            <Receipt
                                size={40}
                                className="mx-auto text-[var(--text-muted)] mb-3"
                            />
                            <p className="text-[var(--text-muted)]">No sales found</p>
                        </div>
                    ) : (
                        <div className="card-neu overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Invoice</th>
                                            <th>Customer</th>
                                            <th className="text-center">Items</th>
                                            <th className="text-right">Total</th>
                                            <th className="hidden sm:table-cell">Date</th>
                                            <th className="w-16">View</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td className="font-mono text-xs font-medium">
                                                    {sale.invoiceCode}
                                                </td>
                                                <td className="text-sm">
                                                    {sale.customerName || (
                                                        <span className="text-[var(--text-muted)] italic">
                                                            Walk-in
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center font-mono">
                                                    {sale._count.items}
                                                </td>
                                                <td className="text-right font-mono text-sm font-medium">
                                                    {formatRp(sale.totalAmount)}
                                                </td>
                                                <td className="hidden sm:table-cell text-xs text-[var(--text-muted)]">
                                                    {formatDate(sale.saleDate)}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => viewDetail(sale.id)}
                                                        className="btn btn-ghost p-1.5"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sale Detail Modal */}
            {detailModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setDetailModal(null)}
                >
                    <div
                        className="modal-content animate-slide-up p-6 max-w-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Invoice Detail
                                </h2>
                                <p className="text-sm font-mono text-[var(--text-muted)]">
                                    {detailModal.invoiceCode}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailModal(null)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-secondary)]">Customer</span>
                                <span>{detailModal.customerName || "Walk-in"}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--text-secondary)]">Date</span>
                                <span>{formatDate(detailModal.saleDate)}</span>
                            </div>
                        </div>

                        <div className="border-t border-[var(--border-color)] pt-3">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Price (Buy/Sell)</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailModal.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="text-sm">{item.product.name}</span>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {item.product.sku}
                                                </p>
                                            </td>
                                            <td className="text-center font-mono text-sm">
                                                {item.qty} {item.product.unit}
                                            </td>
                                            <td className="text-right font-mono text-sm">
                                                <div className="flex flex-col">
                                                    <span>{formatRp(item.sellingPrice)}</span>
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        ({formatRp(item.costPrice)})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-right font-mono text-sm font-medium">
                                                {formatRp(item.qty * item.sellingPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-end mt-4 pt-3 border-t border-[var(--border-color)]">
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                                Grand Total
                            </span>
                            <span className="text-xl font-bold font-mono text-[var(--text-primary)]">
                                {formatRp(detailModal.totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
