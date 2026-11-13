"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Loader2,
  Check,
  Search,
} from "lucide-react";
import type { EnrichedUser } from "@/lib/prisma";
import type { RoleType } from "../../prisma/seed-data";
import { formatIDR } from "@/lib/utils";

export function SuperadminUsersClient({
  initialUsers,
}: {
  initialUsers: EnrichedUser[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<EnrichedUser[]>(initialUsers);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<RoleType>("USER");
  const [creating, setCreating] = useState(false);

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleRoleChange = async (userId: string, newRoleValue: RoleType) => {
    setLoadingUserId(userId);
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRoleValue }),
      });
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        notify(`Role pengguna berhasil diperbarui menjadi ${newRoleValue}.`);
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to update user role", e);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
        setNewName("");
        setNewEmail("");
        setNewRole("USER");
        setShowAddModal(false);
        notify(
          `Akun "${data.user.name}" (${data.user.role}) berhasil ditambahkan.`
        );
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to create user", e);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchSearch =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="space-y-5" data-testid="superadmin-users-view">
      {toastMsg && (
        <div className="p-3.5 bg-[#0A0A0A] text-white border border-[#185B37] flex items-center gap-2.5 text-xs">
          <Check className="w-4 h-4 text-[#185B37] flex-shrink-0" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Header & Filter Bar */}
      <div className="bg-white border border-neutral-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 block">
            3-TIER RBAC IDENTITY DIRECTORY
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A] mt-0.5">
            Manajemen Pengguna &amp; Hak Akses
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / email..."
              className="pl-8 pr-3 py-1.5 border border-neutral-300 text-xs focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          {(["ALL", "SUPERADMIN", "STORE_ADMIN", "USER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              data-testid={`filter-role-${r}`}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors border ${
                roleFilter === r
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-[#0A0A0A]"
              }`}
            >
              {r === "ALL" ? `Semua (${users.length})` : r}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 bg-[#185B37] hover:bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah User
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddModal && (
        <div className="bg-[#FAFAFA] border border-[#0A0A0A] p-5">
          <form
            onSubmit={handleCreateUser}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Misal: Nadira Putri"
                className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nadira@fashionhub.id"
                className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Level RBAC Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 border border-neutral-300 bg-white text-xs font-mono font-bold"
              >
                <option value="USER">USER (Buyer)</option>
                <option value="STORE_ADMIN">STORE_ADMIN (Tenant)</option>
                <option value="SUPERADMIN">SUPERADMIN</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2 px-3 bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-wider"
              >
                {creating ? "Menyimpan..." : "Simpan Akun"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="py-2 px-3 bg-white border border-neutral-300 text-neutral-600 text-[10px] font-semibold uppercase tracking-wider"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-neutral-200 text-neutral-500 uppercase tracking-[0.16em] text-[10px]">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Role RBAC Aktif</th>
                <th className="py-3.5 px-4">Relasi Tenant / Aktivitas Buyer</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-right">Ubah Hak Akses (Role)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredUsers.map((user) => {
                const isBusy = loadingUserId === user.id;
                return (
                  <tr
                    key={user.id}
                    data-testid={`user-row-${user.id}`}
                    className="hover:bg-[#FAFAFA] transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 object-cover border border-neutral-300 grayscale"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[#0A0A0A]">
                            {user.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {user.email} • {user.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                          user.role === "SUPERADMIN"
                            ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                            : user.role === "STORE_ADMIN"
                            ? "bg-[#185B37]/10 text-[#185B37] border-[#185B37]/40"
                            : "bg-neutral-100 text-neutral-700 border-neutral-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {user.ownedStore ? (
                        <div>
                          <div className="font-semibold text-[#0A0A0A]">
                            Tenant: {user.ownedStore.name}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            storeId: {user.ownedStore.id} • {user.ownedStore.status}
                          </div>
                        </div>
                      ) : user.ordersCount > 0 ? (
                        <div>
                          <div className="font-semibold text-[#0A0A0A]">
                            {user.ordersCount} Transaksi Pembelian
                          </div>
                          <div className="text-[11px] text-[#185B37] font-mono font-bold">
                            Total Belanja: {formatIDR(user.totalSpent)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">
                          Otoritas Pengelola Platform Global
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-neutral-500 font-mono text-[11px]">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isBusy && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A0A0A]" />
                        )}
                        <select
                          aria-label={`Ubah role untuk ${user.name}`}
                          value={user.role}
                          disabled={isBusy}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value as RoleType
                            )
                          }
                          className="px-3 py-1.5 border border-neutral-300 bg-white text-xs font-mono font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                        >
                          <option value="SUPERADMIN">SUPERADMIN</option>
                          <option value="STORE_ADMIN">STORE_ADMIN</option>
                          <option value="USER">USER (Buyer)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
