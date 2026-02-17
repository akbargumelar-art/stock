"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    getUsers,
    createUser,
    deleteUser,
    assignCategoryVisibility,
    getAuditTrail,
} from "@/actions/user-actions";
import { getCategories } from "@/actions/product-actions";
import {
    Users,
    Shield,
    Eye,
    Plus,
    Trash2,
    X,
    ClipboardList,
    Check,
    Settings,
} from "lucide-react";

interface UserItem {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "VIEWER";
    createdAt: string;
    categoryVisibility: {
        category: { id: number; name: string };
    }[];
}

interface AuditItem {
    id: number;
    action: string;
    entityType: string;
    entityId: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: { name: string; email: string };
}

interface Category {
    id: number;
    name: string;
}

export default function UsersPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
    const [users, setUsers] = useState<UserItem[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "VIEWER" as "ADMIN" | "VIEWER",
    });

    useEffect(() => {
        if (!isAdmin) return;
        fetchData();
    }, [isAdmin]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, catsData, auditData] = await Promise.all([
                getUsers(),
                getCategories(),
                getAuditTrail(),
            ]);
            setUsers(usersData as unknown as UserItem[]);
            setCategories(catsData as unknown as Category[]);
            setAuditLogs(auditData as unknown as AuditItem[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createUser(userForm);
            setShowUserModal(false);
            setUserForm({ name: "", email: "", password: "", role: "VIEWER" });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to create user");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Delete this user?")) return;
        try {
            await deleteUser(id);
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Cannot delete this user");
        }
    };

    const openVisibility = (user: UserItem) => {
        setSelectedUser(user);
        setSelectedCategories(
            user.categoryVisibility.map((cv) => cv.category.id)
        );
        setShowVisibilityModal(true);
    };

    const handleSaveVisibility = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await assignCategoryVisibility(selectedUser.id, selectedCategories);
            setShowVisibilityModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const toggleCategory = (catId: number) => {
        setSelectedCategories((prev) =>
            prev.includes(catId)
                ? prev.filter((id) => id !== catId)
                : [...prev, catId]
        );
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

    const getActionColor = (action: string) => {
        switch (action) {
            case "CREATE":
                return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "UPDATE":
                return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            case "DELETE":
                return "text-red-500 bg-red-500/10 border-red-500/20";
            case "MOVE":
                return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            default:
                return "text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border-[var(--border-color)]";
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-64 animate-fade-in">
                <div className="text-center">
                    <Shield size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
                    <p className="text-lg font-medium text-[var(--text-primary)]">
                        Access Denied
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                        Admin privileges required
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Users & Audit
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Manage access control and view activity logs
                    </p>
                </div>
                {activeTab === "users" && (
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={16} />
                        Add User
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-tertiary)] w-fit">
                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "users"
                            ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                >
                    <Users size={16} />
                    Users
                </button>
                <button
                    onClick={() => setActiveTab("audit")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "audit"
                            ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                >
                    <ClipboardList size={16} />
                    Audit Trail
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === "users" ? (
                /* Users Table */
                <div className="card-neu overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th className="hidden md:table-cell">Category Access</th>
                                    <th className="hidden sm:table-cell">Created</th>
                                    <th className="w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="font-medium">{user.name}</td>
                                        <td className="text-[var(--text-secondary)]">
                                            {user.email}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${user.role === "ADMIN"
                                                        ? "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
                                                        : "text-cyan-500 bg-cyan-500/10 border-cyan-500/20"
                                                    }`}
                                            >
                                                {user.role === "ADMIN" ? (
                                                    <Shield size={12} className="mr-1" />
                                                ) : (
                                                    <Eye size={12} className="mr-1" />
                                                )}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            {user.role === "VIEWER" ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.categoryVisibility.length > 0 ? (
                                                        user.categoryVisibility.map((cv) => (
                                                            <span
                                                                key={cv.category.id}
                                                                className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] text-xs"
                                                            >
                                                                {cv.category.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-muted)]">
                                                            No access
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    Full access
                                                </span>
                                            )}
                                        </td>
                                        <td className="hidden sm:table-cell text-xs text-[var(--text-muted)]">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                {user.role === "VIEWER" && (
                                                    <button
                                                        onClick={() => openVisibility(user)}
                                                        className="btn btn-ghost p-1.5"
                                                        title="Manage Category Access"
                                                    >
                                                        <Settings size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="btn btn-ghost p-1.5 text-red-500"
                                                    title="Delete"
                                                    disabled={user.id === session?.user?.id}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Audit Trail */
                <div className="card-neu overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th className="hidden md:table-cell">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="text-center py-12 text-[var(--text-muted)]"
                                        >
                                            No audit logs found
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td>
                                                <div>
                                                    <span className="text-sm font-medium">
                                                        {log.user.name}
                                                    </span>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {log.user.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {log.entityType}
                                                </span>
                                                {log.entityId && (
                                                    <span className="text-xs text-[var(--text-muted)] ml-1">
                                                        #{log.entityId}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="hidden md:table-cell">
                                                {log.details ? (
                                                    <code className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-1 rounded">
                                                        {JSON.stringify(log.details).substring(0, 60)}
                                                        {JSON.stringify(log.details).length > 60
                                                            ? "..."
                                                            : ""}
                                                    </code>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div
                        className="modal-content animate-slide-up p-6 max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                Create User
                            </h2>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, name: e.target.value })
                                    }
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, email: e.target.value })
                                    }
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) =>
                                        setUserForm({ ...userForm, password: e.target.value })
                                    }
                                    className="input"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    Role
                                </label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) =>
                                        setUserForm({
                                            ...userForm,
                                            role: e.target.value as "ADMIN" | "VIEWER",
                                        })
                                    }
                                    className="input"
                                >
                                    <option value="VIEWER">Viewer</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? "Creating..." : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Visibility Modal */}
            {showVisibilityModal && selectedUser && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowVisibilityModal(false)}
                >
                    <div
                        className="modal-content animate-slide-up p-6 max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Category Access
                                </h2>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {selectedUser.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowVisibilityModal(false)}
                                className="btn btn-ghost p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {categories.map((cat) => (
                                <label
                                    key={cat.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition"
                                >
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedCategories.includes(cat.id)
                                                ? "bg-[var(--accent)] border-[var(--accent)]"
                                                : "border-[var(--border-color)]"
                                            }`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleCategory(cat.id);
                                        }}
                                    >
                                        {selectedCategories.includes(cat.id) && (
                                            <Check size={12} className="text-white" />
                                        )}
                                    </div>
                                    <span className="text-sm text-[var(--text-primary)]">
                                        {cat.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--border-color)]">
                            <button
                                onClick={() => setShowVisibilityModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveVisibility}
                                disabled={saving}
                                className="btn btn-primary flex-1"
                            >
                                {saving ? "Saving..." : "Save Access"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
