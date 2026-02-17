"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation,
} from "@/actions/location-actions";
import {
    MapPin,
    Plus,
    Edit2,
    Trash2,
    X,
    Warehouse,
    Cloud,
    ChevronRight,
} from "lucide-react";

interface LocationItem {
    id: number;
    name: string;
    type: "PHYSICAL" | "VIRTUAL";
    parentId: number | null;
    description: string | null;
    parent: { name: string } | null;
    children: { id: number; name: string }[];
    _count: { productLocations: number };
}

export default function LocationsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editLoc, setEditLoc] = useState<LocationItem | null>(null);
    const [activeTab, setActiveTab] = useState<"PHYSICAL" | "VIRTUAL">(
        "PHYSICAL"
    );
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: "",
        type: "PHYSICAL" as "PHYSICAL" | "VIRTUAL",
        parentId: null as number | null,
        description: "",
    });

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const data = await getLocations();
            setLocations(data as unknown as LocationItem[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const filtered = locations.filter((l) => l.type === activeTab);
    const parentOptions = locations.filter(
        (l) => l.type === form.type && !l.parentId
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editLoc) {
                await updateLocation(editLoc.id, form);
            } else {
                await createLocation(form);
            }
            setShowModal(false);
            setEditLoc(null);
            setForm({
                name: "",
                type: activeTab,
                parentId: null,
                description: "",
            });
            fetchLocations();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this location?")) return;
        try {
            await deleteLocation(id);
            fetchLocations();
        } catch (error) {
            console.error(error);
        }
    };

    const openEdit = (loc: LocationItem) => {
        setEditLoc(loc);
        setForm({
            name: loc.name,
            type: loc.type,
            parentId: loc.parentId,
            description: loc.description || "",
        });
        setShowModal(true);
    };

    // Build tree for display
    const rootLocations = filtered.filter((l) => !l.parentId);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Locations
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Manage physical and virtual storage locations
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setEditLoc(null);
                            setForm({
                                name: "",
                                type: activeTab,
                                parentId: null,
                                description: "",
                            });
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        <Plus size={16} />
                        Add Location
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)] w-fit">
                <button
                    onClick={() => setActiveTab("PHYSICAL")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "PHYSICAL"
                            ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                >
                    <Warehouse size={16} />
                    Physical
                </button>
                <button
                    onClick={() => setActiveTab("VIRTUAL")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "VIRTUAL"
                            ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                >
                    <Cloud size={16} />
                    Virtual
                </button>
            </div>

            {/* Locations Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : rootLocations.length === 0 ? (
                <div className="card-neu p-12 text-center">
                    <MapPin size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-[var(--text-muted)]">
                        No {activeTab.toLowerCase()} locations yet
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rootLocations.map((loc) => (
                        <div key={loc.id} className="card-neu p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${loc.type === "PHYSICAL"
                                                ? "bg-blue-500/10 text-blue-500"
                                                : "bg-purple-500/10 text-purple-500"
                                            }`}
                                    >
                                        {loc.type === "PHYSICAL" ? (
                                            <Warehouse size={20} />
                                        ) : (
                                            <Cloud size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)]">
                                            {loc.name}
                                        </h3>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {loc._count.productLocations} products
                                        </p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEdit(loc)}
                                            className="btn btn-ghost p-1.5"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(loc.id)}
                                            className="btn btn-ghost p-1.5 text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {loc.description && (
                                <p className="text-xs text-[var(--text-secondary)]">
                                    {loc.description}
                                </p>
                            )}

                            {/* Children */}
                            {loc.children.length > 0 && (
                                <div className="space-y-1 pt-2 border-t border-[var(--border-color)]">
                                    {filtered
                                        .filter((c) => c.parentId === loc.id)
                                        .map((child) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center justify-between pl-3 py-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRight
                                                        size={12}
                                                        className="text-[var(--text-muted)]"
                                                    />
                                                    <span className="text-sm text-[var(--text-secondary)]">
                                                        {child.name}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)]">
                                                        ({child._count.productLocations})
                                                    </span>
                                                </div>
                                                {isAdmin && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => openEdit(child)}
                                                            className="btn btn-ghost p-1"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(child.id)}
                                                            className="btn btn-ghost p-1 text-red-500"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content animate-slide-up p-6 max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                {editLoc ? "Edit Location" : "Add Location"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Type
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            type: e.target.value as "PHYSICAL" | "VIRTUAL",
                                            parentId: null,
                                        })
                                    }
                                    className="input"
                                >
                                    <option value="PHYSICAL">Physical</option>
                                    <option value="VIRTUAL">Virtual</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Parent Location
                                </label>
                                <select
                                    value={form.parentId || ""}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            parentId: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    className="input"
                                >
                                    <option value="">— None (Root) —</option>
                                    {parentOptions.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                    className="input"
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
                                    {saving
                                        ? "Saving..."
                                        : editLoc
                                            ? "Update"
                                            : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
