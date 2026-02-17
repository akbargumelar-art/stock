"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Box } from "lucide-react";
import {
    getCategoriesWithCount,
    createCategory,
    updateCategory,
    deleteCategory,
    CategoryWithCount
} from "@/actions/category-actions";
import toast from "react-hot-toast";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [formData, setFormData] = useState({ name: "", prefix: "", description: "" });
    const [saving, setSaving] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithCount | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchCategories = async () => {
        try {
            const data = await getCategoriesWithCount();
            setCategories(data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.prefix && c.prefix.toLowerCase().includes(search.toLowerCase()))
    );

    const handleOpenModal = (category?: CategoryWithCount) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                prefix: category.prefix || "",
                description: category.description || ""
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", prefix: "", description: "" });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, formData);
                toast.success("Category updated successfully");
            } else {
                await createCategory(formData);
                toast.success("Category created successfully");
            }
            setShowModal(false);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message || "Failed to save category");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        setDeleting(true);
        try {
            await deleteCategory(categoryToDelete.id);
            toast.success("Category deleted");
            setShowDeleteModal(false);
            setCategoryToDelete(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete category");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Categories</h1>
                    <p className="text-[var(--text-secondary)]">Manage product categories and prefixes</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Category
                </button>
            </div>

            {/* Search */}
            <div className="card-neu p-4">
                <div className="relative max-w-md">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search categories..."
                        className="input pl-9 w-full"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card-neu overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 text-xs uppercase text-[var(--text-secondary)]">
                                <th className="py-3 px-4 font-semibold">Name</th>
                                <th className="py-3 px-4 font-semibold">Prefix</th>
                                <th className="py-3 px-4 font-semibold">Description</th>
                                <th className="py-3 px-4 font-semibold text-center">Products</th>
                                <th className="py-3 px-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                                        No categories found.
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                                            {category.name}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-mono text-xs bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border-color)]">
                                                {category.prefix || "—"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)] max-w-xs truncate" title={category.description || ""}>
                                            {category.description || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                                {category._count.products}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(category)}
                                                    className="btn btn-ghost p-1.5 hover:text-blue-500"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCategoryToDelete(category);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="btn btn-ghost p-1.5 hover:text-red-500"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content animate-slide-up p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Box size={24} className="text-[var(--accent)]" />
                                {editingCategory ? "Edit Category" : "New Category"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost p-1 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Prefix <span className="text-red-500">*</span>
                                    <span className="text-xs text-[var(--text-muted)] ml-2">(Max 10 chars, used for SKU)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.prefix}
                                    onChange={e => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                                    className="input w-full uppercase font-mono"
                                    maxLength={10}
                                    required
                                    placeholder="e.g. ELK"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input w-full min-h-[80px]"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                                    {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content animate-slide-up p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Delete Category?</h3>
                        <p className="text-[var(--text-secondary)] mb-6 text-sm">
                            Are you sure you want to delete <strong>{categoryToDelete?.name}</strong>? This action cannot be undone.
                            {(categoryToDelete?._count?.products || 0) > 0 && (
                                <span className="block mt-2 text-red-500 font-medium">
                                    Warning: This category has {categoryToDelete?._count?.products} products and cannot be deleted until they are moved or removed.
                                </span>
                            )}
                        </p>

                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting || (categoryToDelete?._count.products || 0) > 0}
                                className="btn bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
