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
import { getLocations } from "@/actions/location-actions";
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
    Package,
    Camera,
    Droplets,
    ShoppingCart,
    Store,
    Globe,
    Link as LinkIcon,
    MapPin,
    Calendar,
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
    category: {
        id: number;
        name: string;
    };
}

export default function ProductsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [products, setProducts] = useState<ProductWithCategory[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string; parentId?: number | null; parent?: { id: number; name: string } | null }[]>([]);
    const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
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
        unit: "pcs",
        price: 0,
        costPrice: 0,
        minStock: 5,
        currentStock: 0,
        image: "",
        purchaseDate: "",
        purchaseSource: "" as "" | "ONLINE" | "OFFLINE",
        purchaseLink: "",
        storeName: "",
        storeLocation: "",
        isConsumable: false,
        condition: "" as string,
        locationId: 0,
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
        // Load categories independently so product errors don't block the dropdown
        try {
            const fetchedCategories = await getCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to load categories:", error);
        }

        // Load locations
        try {
            const fetchedLocations = await getLocations();
            setLocations(fetchedLocations);
        } catch (error) {
            console.error("Failed to load locations:", error);
        }

        // Load products separately
        try {
            const fetchedProducts = await getProducts();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setProducts(fetchedProducts as any);
        } catch (error) {
            console.error("Failed to load products:", error);
            toast.error("Gagal memuat data produk. Silakan refresh halaman.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Convert empty purchaseSource to undefined
            const submitData = {
                ...form,
                purchaseSource: form.purchaseSource || undefined,
                purchaseDate: form.purchaseDate || undefined,
                purchaseLink: form.purchaseLink || undefined,
                storeName: form.storeName || undefined,
                storeLocation: form.storeLocation || undefined,
                locationId: form.locationId || undefined,
            };
            if (editProduct) {
                await updateProduct(editProduct.id, submitData);
                toast.success("Product updated successfully");
            } else {
                await createProduct(submitData as Parameters<typeof createProduct>[0]);
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
            costPrice: product.costPrice,
            minStock: product.minStock,
            currentStock: product.currentStock,
            image: product.image || "",
            purchaseDate: product.purchaseDate ? new Date(product.purchaseDate).toISOString().split("T")[0] : "",
            purchaseSource: product.purchaseSource || "",
            purchaseLink: product.purchaseLink || "",
            storeName: product.storeName || "",
            storeLocation: product.storeLocation || "",
            isConsumable: product.isConsumable || false,
            condition: product.condition || "",
            locationId: 0,
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
            costPrice: 0,
            minStock: 5,
            currentStock: 0,
            image: "",
            purchaseDate: "",
            purchaseSource: "",
            purchaseLink: "",
            storeName: "",
            storeLocation: "",
            isConsumable: false,
            condition: "",
            locationId: 0,
        });
        setIsAutoSKU(true);
    };

    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                setForm(prev => ({ ...prev, image: data.url }));
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
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
                        {categories.filter(c => !c.parentId).map((parent) => {
                            const children = categories.filter(c => c.parentId === parent.id);
                            if (children.length > 0) {
                                return (
                                    <optgroup key={parent.id} label={parent.name}>
                                        <option value={parent.id.toString()}>{parent.name} (All)</option>
                                        {children.map(child => (
                                            <option key={child.id} value={child.id.toString()}>{child.name}</option>
                                        ))}
                                    </optgroup>
                                );
                            }
                            return <option key={parent.id} value={parent.id.toString()}>{parent.name}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="input w-full"
                    >
                        <option value="all">All Status</option>
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
                                <th className="py-3 px-4 font-semibold hidden md:table-cell">Kondisi</th>
                                <th className="py-3 px-4 font-semibold hidden md:table-cell">QR</th>
                                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12">
                                        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-[var(--text-muted)]">
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
                                                                {product.isConsumable && (
                                                                    <span title="Produk Konsumtif"><Droplets size={12} className="inline ml-1.5 text-purple-500" /></span>
                                                                )}
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
                                                    {product.condition ? (
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            {product.condition}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-muted)]">—</span>
                                                    )}
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
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden">
                                        {form.image ? (
                                            <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-2">
                                                <ImageIcon size={24} className="mx-auto text-[var(--text-muted)] mb-1" />
                                                <span className="text-[10px] text-[var(--text-muted)]">No Image</span>
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-1.5 bg-[var(--accent)] text-white rounded-full cursor-pointer shadow-lg hover:bg-[var(--accent)]/90 transition-colors transform translate-x-1/4 translate-y-1/4">
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
                                        <Camera size={14} />
                                    </label>
                                    <label className="absolute bottom-0 left-0 p-1.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full cursor-pointer shadow-lg hover:bg-[var(--border-color)] transition-colors transform -translate-x-1/4 translate-y-1/4 border border-[var(--border-color)]">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        <ImageIcon size={14} />
                                    </label>
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
                                    {categories.filter(c => !c.parentId).map((parent) => {
                                        const children = categories.filter(c => c.parentId === parent.id);
                                        if (children.length > 0) {
                                            return (
                                                <optgroup key={parent.id} label={parent.name}>
                                                    <option value={parent.id}>{parent.name}</option>
                                                    {children.map(child => (
                                                        <option key={child.id} value={child.id}>{child.name}</option>
                                                    ))}
                                                </optgroup>
                                            );
                                        }
                                        return <option key={parent.id} value={parent.id}>{parent.name}</option>;
                                    })}
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

                            {/* Kondisi Produk */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Kondisi Produk
                                </label>
                                <input
                                    type="text"
                                    value={form.condition}
                                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                                    className="input w-full"
                                    placeholder="Contoh: Baru, Bekas, Refurbished, dll"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Cost Price (Harga Beli)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">
                                            Rp
                                        </span>
                                        <input
                                            type="number"
                                            value={form.costPrice}
                                            onChange={(e) =>
                                                setForm({ ...form, costPrice: Number(e.target.value) })
                                            }
                                            className="input pl-9 w-full"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
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

                            {/* Location Selection (Only for new products) */}
                            {!editProduct && form.currentStock > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        Initial Storage Location
                                    </label>
                                    <select
                                        value={form.locationId}
                                        onChange={(e) => setForm({ ...form, locationId: Number(e.target.value) })}
                                        className="input"
                                        required={form.currentStock > 0}
                                    >
                                        <option value={0}>Select Location...</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        Select where this initial stock is stored.
                                    </p>
                                </div>
                            )}

                            {/* Separator */}
                            <div className="border-t border-[var(--border-color)] pt-4 mt-2">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                    <ShoppingCart size={16} className="text-[var(--accent)]" />
                                    Informasi Pembelian
                                </h3>

                                {/* Purchase Date */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        Tanggal Beli
                                    </label>
                                    <input
                                        type="date"
                                        value={form.purchaseDate}
                                        onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>

                                {/* Purchase Source */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        Tempat Beli
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, purchaseSource: "ONLINE", storeName: "", storeLocation: "" })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${form.purchaseSource === "ONLINE"
                                                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                                                }`}
                                        >
                                            <Globe size={16} />
                                            Online
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, purchaseSource: "OFFLINE", purchaseLink: "" })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all text-sm font-medium ${form.purchaseSource === "OFFLINE"
                                                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                                                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]"
                                                }`}
                                        >
                                            <Store size={16} />
                                            Offline
                                        </button>
                                    </div>
                                </div>

                                {/* Online Fields */}
                                {form.purchaseSource === "ONLINE" && (
                                    <div className="mb-4 animate-fade-in">
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                                            <LinkIcon size={14} />
                                            Link Pembelian (Marketplace)
                                        </label>
                                        <input
                                            type="url"
                                            value={form.purchaseLink}
                                            onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
                                            className="input w-full"
                                            placeholder="https://tokopedia.link/..."
                                        />
                                    </div>
                                )}

                                {/* Offline Fields */}
                                {form.purchaseSource === "OFFLINE" && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 animate-fade-in">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                                                <Store size={14} />
                                                Nama Toko
                                            </label>
                                            <input
                                                type="text"
                                                value={form.storeName}
                                                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                                                className="input w-full"
                                                placeholder="Nama toko"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                                                <MapPin size={14} />
                                                Lokasi Toko
                                            </label>
                                            <input
                                                type="text"
                                                value={form.storeLocation}
                                                onChange={(e) => setForm({ ...form, storeLocation: e.target.value })}
                                                className="input w-full"
                                                placeholder="Alamat/lokasi toko"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Consumable toggle */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, isConsumable: !form.isConsumable })}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.isConsumable ? "bg-[var(--accent)]" : "bg-gray-300 dark:bg-gray-600"
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isConsumable ? "translate-x-5" : ""
                                        }`} />
                                </button>
                                <div>
                                    <div className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                                        <Droplets size={14} className={form.isConsumable ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
                                        Produk Konsumtif (Habis Pakai)
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Aktifkan jika produk ini akan berkurang saat digunakan
                                    </p>
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
                </div >
            )
            }



            {/* Print Area (hidden, used for printing) */}
            {
                printProduct && (
                    <div ref={printRef} className="print-area">
                        <div className="qr-label">
                            {printProduct.qrCode && (
                                <img src={printProduct.qrCode} alt={`QR: ${printProduct.sku}`} />
                            )}
                            <div className="sku-text">{printProduct.sku}</div>
                            <div className="name-text">{printProduct.name}</div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
