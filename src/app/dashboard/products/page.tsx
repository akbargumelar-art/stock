"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getCategories,
    generateNextSKU,
} from "@/actions/product-actions";
import { createCategory } from "@/actions/category-actions";
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
    Box,
    ImageIcon,
    Package
} from "lucide-react";

// Update interface to include image
interface ProductWithCategory {
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
    image: string | null; // Added
    category: {
        id: number;
        name: string;
    };
}

export default function ProductsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState<ProductWithCategory | null>(null);
    const [form, setForm] = useState({
        sku: "",
        name: "",
        categoryId: 0,
        description: "",
        unit: "",
        price: 0,
        minStock: 5,
        currentStock: 0,
        image: "",
    });

    // Auto-SKU state
    const [isAutoSKU, setIsAutoSKU] = useState(true);
    const [saving, setSaving] = useState(false);

    // Print state
    const [printProduct, setPrintProduct] = useState<ProductWithCategory | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fix: Cast the response to match ProductWithCategory if needed, or update the action return type
            const [fetchedProducts, fetchedCategories] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setProducts(fetchedProducts as any);
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editProduct) {
                await updateProduct(editProduct.id, form);
                toast.success("Product updated successfully");
            } else {
                await createProduct(form);
                toast.success("Product created successfully");
            }
            setShowModal(false);
            setEditProduct(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error("Failed to save product:", error);
            toast.error("Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            toast.success("Product deleted successfully");
            loadData();
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast.error("Failed to delete product");
        }
    };

    const openEdit = (product: ProductWithCategory) => {
        setEditProduct(product);
        setIsAutoSKU(false); // Disable auto-gen when editing
        setForm({
            sku: product.sku,
            name: product.name,
            categoryId: product.categoryId,
            description: product.description || "",
            unit: product.unit,
            price: product.price,
            minStock: product.minStock,
            currentStock: product.currentStock,
            image: product.image || "",
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({
            sku: "",
            name: "",
            categoryId: categories[0]?.id || 0,
            description: "",
            unit: "pcs",
            price: 0,
            minStock: 5,
            currentStock: 0,
            image: "",
        });
        setIsAutoSKU(true);
    };

    const handlePrint = (product: ProductWithCategory) => {
        setPrintProduct(product);
        // Wait for state update and render
        setTimeout(() => {
            window.print();
            // Clear print product after printing (optional, but good for cleanup)
            // setPrintProduct(null); 
        }, 100);
    };

    const toggleQRCode = (id: number) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    const handleCategoryChange = async (categoryId: number) => {
        setForm({ ...form, categoryId });
        // Only generate SKU if creating new product and auto-gen is enabled
        if (!editProduct && isAutoSKU) {
            try {
                const nextSKU = await generateNextSKU(categoryId);
                setForm(prev => ({ ...prev, sku: nextSKU, categoryId }));
            } catch (error) {
                console.error("Failed to generate SKU:", error);
            }
        }
    };

    const getStockStatus = (current: number, min: number) => {
        if (current < min) return "LOW";
        if (current > min * 2) return "OVER_STOCK";
        return "IN_STOCK";
    };

    const getStockStatusLabel = (status: string) => {
        switch (status) {
            case "LOW":
                return "Low Stock";
            case "OVER_STOCK":
                return "Over Stock";
            default:
                return "In Stock";
        }
    };

    const getStockStatusColor = (status: string) => {
        switch (status) {
            case "LOW":
                return "badge-error";
            case "OVER_STOCK":
                return "badge-warning";
            default:
                return "badge-success";
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = search
            ? product.sku.toLowerCase().includes(search.toLowerCase()) ||
            product.name.toLowerCase().includes(search.toLowerCase())
            : true;
        const matchesCategory = filterCategory !== "all"
            ? product.categoryId === Number(filterCategory)
            : true;

        let matchesStatus = true;
        if (filterStatus !== "all") {
            const status = getStockStatus(product.currentStock, product.minStock);
            matchesStatus = status === filterStatus;
        }

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                        Products
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Manage your product inventory
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setEditProduct(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="btn btn-primary flex-1 sm:flex-none justify-center shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        placeholder="Search by SKU or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10 w-full"
                    />
                </div>
                <div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="input w-full"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id.toString()}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input w-full"
                    >
                        <option value="ALL">All Status</option>
                        <option value="LOW">Low Stock</option>
                        <option value="OVER_STOCK">Over Stock</option>
                        <option value="IN_STOCK">In Stock</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card-neu overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 text-xs uppercase text-[var(--text-secondary)]">
                                <th className="py-3 px-4 font-semibold">SKU</th>
                                <th className="py-3 px-4 font-semibold">Name</th>
                                <th className="py-3 px-4 font-semibold">Category</th>
                                <th className="py-3 px-4 font-semibold">Unit</th>
                                <th className="py-3 px-4 font-semibold">Stock</th>
                                <th className="py-3 px-4 font-semibold">Status</th>
                                <th className="py-3 px-4 font-semibold hidden md:table-cell">QR</th>
                                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12">
                                        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                                        No products found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const status = getStockStatus(product.currentStock, product.minStock);
                                    return (
                                        <React.Fragment key={product.id}>
                                            <tr className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                                <td className="py-3 px-4 font-mono text-sm font-medium text-[var(--text-primary)]">
                                                    <Link href={`/dashboard/products/${product.id}`} className="hover:text-[var(--accent)] hover:underline">
                                                        {product.sku}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {product.image ? (
                                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-[var(--bg-tertiary)] flex-shrink-0 border border-[var(--border-color)]">
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-md bg-[var(--bg-tertiary)] flex-shrink-0 flex items-center justify-center text-[var(--text-muted)] border border-[var(--border-color)]">
                                                                <Package size={16} />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <Link href={`/dashboard/products/${product.id}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline block">
                                                                {product.name}
                                                            </Link>
                                                            {product.description && (
                                                                <p className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                                                    {product.category.name}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                                                    {product.unit}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold">{product.currentStock}</span>
                                                    <span className="text-[var(--text-muted)] text-xs ml-1">
                                                        / {product.minStock}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`badge ${getStockStatusColor(status)}`}>
                                                        {getStockStatusLabel(status)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 hidden md:table-cell">
                                                    {product.qrCode ? (
                                                        <button
                                                            onClick={() => toggleQRCode(product.id)}
                                                            className={`btn btn-ghost p-1 ${expandedRow === product.id ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                                                            title={expandedRow === product.id ? "Hide QR" : "Show QR"}
                                                        >
                                                            <QrCode size={18} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[var(--text-muted)]">—</span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handlePrint(product)}
                                                                className="btn btn-ghost p-1.5"
                                                                title="Print QR Label"
                                                            >
                                                                <Printer size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openEdit(product)}
                                                                className="btn btn-ghost p-1.5"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="btn btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>

                                            {/* Expanded Row for QR Code */}
                                            {expandedRow === product.id && product.qrCode && (
                                                <tr className="bg-[var(--bg-tertiary)]/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <td colSpan={8} className="p-4">
                                                        <div className="flex items-center gap-6 bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)] shadow-sm max-w-md">
                                                            <div className="bg-white p-2 rounded shadow-sm">
                                                                <img src={product.qrCode} alt={`QR: ${product.sku}`} className="w-32 h-32 object-contain" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">SKU</p>
                                                                    <p className="text-lg font-mono font-bold text-[var(--text-primary)]">{product.sku}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Product Name</p>
                                                                    <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                                                                </div>
                                                                <div className="pt-2">
                                                                    <button
                                                                        onClick={() => handlePrint(product)}
                                                                        className="btn btn-secondary text-xs flex items-center gap-2"
                                                                    >
                                                                        <Printer size={14} />
                                                                        Print Label
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
                        className="modal-content animate-slide-up p-6 max-h-[90vh] overflow-y-auto"
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
                            {/* Image Preview */}
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden relative group">
                                    {form.image ? (
                                        <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-2">
                                            <ImageIcon size={24} className="mx-auto text-[var(--text-muted)] mb-1" />
                                            <span className="text-[10px] text-[var(--text-muted)]">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        className="input font-mono w-full"
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
                                        className="input w-full"
                                        placeholder="pcs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Product Name *
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
