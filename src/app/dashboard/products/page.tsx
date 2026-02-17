"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    createCategory,
    generateNextSKU,
} from "@/actions/product-actions";
import {
    getStockStatus,
    getStockStatusColor,
    getStockStatusLabel,
} from "@/lib/stock-status";
import {
    Plus,
    Search,
    Printer,
    Edit2,
    Trash2,
    X,
    QrCode,
    Filter,
    FolderPlus,
    Eye,
    EyeOff,
    Sparkles,
} from "lucide-react";

interface Product {
    id: number;
    sku: string;
    name: string;
    categoryId: number;
    description: string | null;
    unit: string;
    price: number;
    minStock: number;
    currentStock: number;
    qrCode: string | null;
    category: { id: number; name: string };
}

interface Category {
    id: number;
    name: string;
    description: string | null;
}

export default function ProductsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState<number | undefined>();
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [printProduct, setPrintProduct] = useState<Product | null>(null);
    const [showQRCode, setShowQRCode] = useState<number | null>(null);
    const [isAutoSKU, setIsAutoSKU] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const [form, setForm] = useState({
        sku: "",
        name: "",
        categoryId: 0,
        description: "",
        unit: "pcs",
        price: 0,
        minStock: 0,
        currentStock: 0,
    });

    const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prods, cats] = await Promise.all([
                getProducts({
                    search: search || undefined,
                    categoryId: filterCategory || undefined,
                    status: filterStatus || undefined,
                }),
                getCategories(),
            ]);
            setProducts(prods as Product[]);
            setCategories(cats as Category[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, filterCategory, filterStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editProduct) {
                await updateProduct(editProduct.id, form);
            } else {
                await createProduct(form);
            }
            setShowModal(false);
            setEditProduct(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCategory(categoryForm);
            setCategoryForm({ name: "", description: "" });
            setShowCategoryModal(false);
            const cats = await getCategories();
            setCategories(cats as Category[]);
        } catch (error) {
            console.error(error);
        }
    };

    const openEdit = (product: Product) => {
        setEditProduct(product);
        setIsAutoSKU(false);
        setForm({
            sku: product.sku,
            name: product.name,
            categoryId: product.categoryId,
            description: product.description || "",
            unit: product.unit,
            price: product.price,
            minStock: product.minStock,
            currentStock: product.currentStock,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setIsAutoSKU(true);
        setForm({
            sku: "",
            name: "",
            categoryId: categories[0]?.id || 0,
            description: "",
            unit: "pcs",
            price: 0,
            minStock: 0,
            currentStock: 0,
        });
    };

    const handlePrint = (product: Product) => {
        setPrintProduct(product);
        setTimeout(() => window.print(), 200);
    };

    const toggleQRCode = (productId: number) => {
        setShowQRCode(prev => prev === productId ? null : productId);
    };

    const handleCategoryChange = async (categoryId: number) => {
        setForm({ ...form, categoryId });

        // Auto-generate SKU only if user hasn't manually edited it
        if (isAutoSKU && !editProduct) {
            try {
                const sku = await generateNextSKU(categoryId);
                setForm(prev => ({ ...prev, sku, categoryId }));
            } catch (error) {
                console.error("Failed to generate SKU:", error);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Manage your SKU-based inventory
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowCategoryModal(true)}
                            className="btn btn-secondary"
                        >
                            <FolderPlus size={16} />
                            <span className="hidden sm:inline">Category</span>
                        </button>
                        <button
                            onClick={() => {
                                resetForm();
                                setEditProduct(null);
                                setShowModal(true);
                            }}
                            className="btn btn-primary"
                        >
                            <Plus size={16} />
                            Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="card-neu p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by SKU or name..."
                            className="input pl-9"
                        />
                    </div>
                    <select
                        value={filterCategory || ""}
                        onChange={(e) =>
                            setFilterCategory(e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="input w-full sm:w-44"
                    >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input w-full sm:w-40"
                    >
                        <option value="">All Status</option>
                        <option value="LOW">Low Stock</option>
                        <option value="IN_STOCK">In Stock</option>
                        <option value="OVER_STOCK">Over Stock</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card-neu overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th className="hidden md:table-cell">Category</th>
                                <th className="hidden sm:table-cell">Unit</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th className="hidden md:table-cell">QR</th>
                                {isAdmin && <th className="w-24">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-[var(--text-muted)]">
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const status = getStockStatus(
                                        product.currentStock,
                                        product.minStock
                                    );
                                    return (
                                        <tr key={product.id}>
                                            <td className="font-mono text-xs font-semibold">
                                                {product.sku}
                                            </td>
                                            <td className="font-medium">{product.name}</td>
                                            <td className="hidden md:table-cell text-[var(--text-secondary)]">
                                                {product.category.name}
                                            </td>
                                            <td className="hidden sm:table-cell text-[var(--text-secondary)]">
                                                {product.unit}
                                            </td>
                                            <td>
                                                <span className="font-semibold">{product.currentStock}</span>
                                                <span className="text-[var(--text-muted)]">
                                                    /{product.minStock}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStockStatusColor(status)}`}>
                                                    {getStockStatusLabel(status)}
                                                </span>
                                            </td>
                                            <td className="hidden md:table-cell">
                                                {product.qrCode ? (
                                                    <button
                                                        onClick={() => handlePrint(product)}
                                                        className="btn btn-ghost p-1"
                                                        title="Print QR"
                                                    >
                                                        <QrCode size={18} className="text-[var(--accent)]" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[var(--text-muted)]">—</span>
                                                )}
                                            </td>
                                            {isAdmin && (
                                                <td>
                                                    <div className="flex items-center gap-1">
                                                        {product.qrCode && (
                                                            <button
                                                                onClick={() => toggleQRCode(product.id)}
                                                                className="btn btn-ghost p-1.5"
                                                                title={showQRCode === product.id ? "Hide QR" : "Show QR"}
                                                            >
                                                                {showQRCode === product.id ? (
                                                                    <EyeOff size={14} className="text-[var(--accent)]" />
                                                                ) : (
                                                                    <Eye size={14} />
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handlePrint(product)}
                                                            className="btn btn-ghost p-1.5"
                                                            title="Print QR Label"
                                                        >
                                                            <Printer size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(product)}
                                                            className="btn btn-ghost p-1.5"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="btn btn-ghost p-1.5 text-red-500"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    {/* QR Code Display */}
                                                    {showQRCode === product.id && product.qrCode && (
                                                        <div className="qr-display mt-2">
                                                            <img src={product.qrCode} alt={`QR: ${product.sku}`} />
                                                            <div className="text-xs text-center mt-1 font-mono">
                                                                {product.sku}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content animate-slide-up p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {editProduct ? "Edit Product" : "Add Product"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        SKU * {isAutoSKU && !editProduct && (
                                            <span className="inline-flex items-center gap-1 text-[var(--accent)] text-xs">
                                                <Sparkles size={12} />
                                                Auto
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={form.sku}
                                        onChange={(e) => {
                                            setIsAutoSKU(false);
                                            setForm({ ...form, sku: e.target.value.toUpperCase() });
                                        }}
                                        className="input font-mono"
                                        placeholder="ELK-001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="input"
                                        placeholder="pcs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="input"
                                    placeholder="Product name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Category *
                                </label>
                                <select
                                    value={form.categoryId}
                                    onChange={(e) => handleCategoryChange(Number(e.target.value))}
                                    className="input"
                                    required
                                >
                                    <option value={0} disabled>
                                        Select category
                                    </option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                    className="input"
                                    rows={2}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Price (Rp)
                                </label>
                                <input
                                    type="number"
                                    value={form.price}
                                    onChange={(e) =>
                                        setForm({ ...form, price: Number(e.target.value) })
                                    }
                                    className="input font-mono"
                                    min={0}
                                    placeholder="0"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Min Stock
                                    </label>
                                    <input
                                        type="number"
                                        value={form.minStock}
                                        onChange={(e) =>
                                            setForm({ ...form, minStock: Number(e.target.value) })
                                        }
                                        className="input"
                                        min={0}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Current Stock
                                    </label>
                                    <input
                                        type="number"
                                        value={form.currentStock}
                                        onChange={(e) =>
                                            setForm({ ...form, currentStock: Number(e.target.value) })
                                        }
                                        className="input"
                                        min={0}
                                    />
                                </div>
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
                                    {saving ? "Saving..." : editProduct ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCategoryModal(false)}
                >
                    <div
                        className="modal-content animate-slide-up p-6 max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                New Category
                            </h2>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) =>
                                        setCategoryForm({ ...categoryForm, name: e.target.value })
                                    }
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={categoryForm.description}
                                    onChange={(e) =>
                                        setCategoryForm({
                                            ...categoryForm,
                                            description: e.target.value,
                                        })
                                    }
                                    className="input"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                Create Category
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Print Area (hidden, used for printing) */}
            {printProduct && (
                <div ref={printRef} className="print-area">
                    <div className="qr-label">
                        {printProduct.qrCode && (
                            <img src={printProduct.qrCode} alt={`QR: ${printProduct.sku}`} />
                        )}
                        <div className="sku-text">{printProduct.sku}</div>
                        <div className="name-text">{printProduct.name}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
