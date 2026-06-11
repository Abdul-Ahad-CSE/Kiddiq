"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
type Role = "SUPER_ADMIN" | "SUB_ADMIN" | "CUSTOMER";

import {
  createSubAdmin,
  updateSubAdminPermissions,
  toggleSubAdminSuspension,
  deleteSubAdmin,
} from "@/app/actions/admin-staff";
import {
  UserPlus,
  Shield,
  Trash2,
  Edit,
  Check,
  X,
  Lock,
  Unlock,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
  isActive: boolean;
}

interface StaffManagementClientProps {
  initialStaff: StaffMember[];
  currentAdminId: string;
}

const AVAILABLE_PERMISSIONS = [
  "VIEW_DASHBOARD",
  "MANAGE_ORDERS",
  "MANAGE_CATEGORIES",
  "MANAGE_PRODUCTS",
  "MANAGE_FINANCE",
];

const permissionLabels: Record<string, string> = {
  VIEW_DASHBOARD: "View Dashboard Metrics",
  MANAGE_ORDERS: "Manage Store Orders",
  MANAGE_CATEGORIES: "Manage Categories",
  MANAGE_PRODUCTS: "Manage Products Inventory",
  MANAGE_FINANCE: "Manage Financial Accounting",
};

const shortPermissionLabels: Record<string, string> = {
  VIEW_DASHBOARD: "Dashboard",
  MANAGE_ORDERS: "Orders",
  MANAGE_CATEGORIES: "Categories",
  MANAGE_PRODUCTS: "Products",
  MANAGE_FINANCE: "Finance",
};

export default function StaffManagementClient({
  initialStaff,
  currentAdminId,
}: StaffManagementClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as string[],
  });
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!createForm.name || !createForm.email || !createForm.password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      const res = await createSubAdmin({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        permissions: createForm.permissions,
      });

      if (res.success) {
        setSuccessMsg(`Account for ${createForm.name} created successfully.`);
        setCreateForm({ name: "", email: "", password: "", permissions: [] });
        setIsCreateOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to create Sub Admin.");
      }
    });
  };

  const handleToggleStatus = (subAdminId: string, isActive: boolean) => {
    if (confirm(`Are you sure you want to ${isActive ? "activate" : "suspend"} this account?`)) {
      setErrorMsg("");
      startTransition(async () => {
        const res = await toggleSubAdminSuspension(subAdminId, isActive);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to update user status.");
        }
      });
    }
  };

  const handleDelete = (subAdminId: string) => {
    if (confirm("Are you sure you want to permanently delete this administrator account? This action cannot be undone.")) {
      setErrorMsg("");
      startTransition(async () => {
        const res = await deleteSubAdmin(subAdminId);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to delete user.");
        }
      });
    }
  };

  const handleUpdatePermissionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setErrorMsg("");
    startTransition(async () => {
      const res = await updateSubAdminPermissions(selectedMember.id, editPermissions);
      if (res.success) {
        setIsEditOpen(false);
        setSelectedMember(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to update permissions.");
      }
    });
  };

  const togglePermission = (perm: string, mode: "create" | "edit") => {
    if (mode === "create") {
      setCreateForm((prev) => {
        const permissions = prev.permissions.includes(perm)
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm];
        return { ...prev, permissions };
      });
    } else {
      setEditPermissions((prev) =>
        prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
      );
    }
  };

  return (
    <div className="relative">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800 font-sans">Administrators List</h2>
            <p className="text-xs text-slate-500">{initialStaff.length} active staff accounts</p>
          </div>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setIsCreateOpen(true);
          }}
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm shadow-blue-100 font-sans cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Sub Admin</span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-sm font-sans flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Access List Grid (Desktop Table) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wider font-sans">
              <th className="px-6 py-4">Name & Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Permissions</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right min-w-[220px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-sans">
            {initialStaff.map((member) => (
              <tr
                key={member.id}
                className={`hover:bg-slate-50/50 transition-colors ${
                  !member.isActive ? "bg-slate-50/25 opacity-75" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{member.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      member.role === "SUPER_ADMIN"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}
                  >
                    {member.role === "SUPER_ADMIN" ? "Super Admin" : "Sub Admin"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {member.role === "SUPER_ADMIN" ? (
                    <span className="text-xs text-slate-500 font-medium">All Permissions (Bypassed)</span>
                  ) : member.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {member.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium font-mono"
                        >
                          {shortPermissionLabels[perm] || perm}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No permissions assigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleStatus(member.id, !member.isActive)}
                    disabled={member.id === currentAdminId || isPending}
                    className={`h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 border cursor-pointer ${
                      member.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {member.isActive ? (
                      <>
                        <Unlock className="w-4 h-4 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-500" />
                        <span>Suspended</span>
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {member.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => {
                          setErrorMsg("");
                          setSelectedMember(member);
                          setEditPermissions(member.permissions);
                          setIsEditOpen(true);
                        }}
                        className="h-12 px-4 flex items-center justify-center text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors gap-2 font-semibold text-sm cursor-pointer"
                      >
                        <Edit className="w-5 h-5" />
                        <span>Permissions</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={member.id === currentAdminId || isPending}
                      className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden space-y-4">
        {initialStaff.map((member) => (
          <div
            key={member.id}
            className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 transition-all ${
              !member.isActive ? "opacity-75 bg-slate-50/20" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-sans">{member.name}</h3>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                  member.role === "SUPER_ADMIN"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "bg-amber-50 text-amber-700 border border-amber-100"
                }`}
              >
                {member.role === "SUPER_ADMIN" ? "Super Admin" : "Sub Admin"}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block font-sans">
                Permissions
              </span>
              {member.role === "SUPER_ADMIN" ? (
                <span className="text-xs text-slate-500 font-medium">All Permissions (Bypassed)</span>
              ) : member.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {member.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium font-mono"
                    >
                      {shortPermissionLabels[perm] || perm}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">No permissions assigned</span>
              )}
            </div>

            {/* Mobile Actions Grid */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleToggleStatus(member.id, !member.isActive)}
                disabled={member.id === currentAdminId || isPending}
                className={`h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 border cursor-pointer ${
                  member.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                } disabled:opacity-50`}
              >
                {member.isActive ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span>{member.isActive ? "Active" : "Suspended"}</span>
              </button>

              <div className="flex items-center gap-2">
                {member.role !== "SUPER_ADMIN" && (
                  <button
                    onClick={() => {
                      setErrorMsg("");
                      setSelectedMember(member);
                      setEditPermissions(member.permissions);
                      setIsEditOpen(true);
                    }}
                    className="h-12 w-12 flex items-center justify-center text-slate-600 hover:text-blue-600 bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    title="Edit Permissions"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(member.id)}
                  disabled={member.id === currentAdminId || isPending}
                  className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete Staff"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Sub Admin Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Add Sub Administrator
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-sans flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sayem Ahmed"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="sayem@kiddiq.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none text-slate-800 text-sm font-sans transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                  Permissions (Touch Select)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm, "create")}
                      className={`w-full flex items-center justify-between px-4 h-12 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        createForm.permissions.includes(perm)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{permissionLabels[perm] || perm}</span>
                      {createForm.permissions.includes(perm) && <Check className="w-5 h-5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors font-sans cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer shadow-sm shadow-blue-100"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {isEditOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 font-sans flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Configure Permissions
              </h3>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedMember(null);
                }}
                className="h-12 w-12 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePermissionsSubmit} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-sans mb-2">
                <span className="font-bold text-slate-800">{selectedMember.name}</span>
                <span className="text-slate-500 block text-xs mt-0.5">{selectedMember.email}</span>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl font-sans flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-sans">
                  Active Permissions (Touch Select)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <button
                      key={perm}
                      type="button"
                      onClick={() => togglePermission(perm, "edit")}
                      className={`w-full flex items-center justify-between px-4 h-12 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                        editPermissions.includes(perm)
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>{permissionLabels[perm] || perm}</span>
                      {editPermissions.includes(perm) && <Check className="w-5 h-5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedMember(null);
                  }}
                  className="w-1/2 h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors font-sans cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all font-sans cursor-pointer shadow-sm shadow-blue-100"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
