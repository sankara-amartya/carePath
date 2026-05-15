"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

const ROLE_LABELS: Record<string, string> = {
  PRIMARY_CAREGIVER: "Primary Caregiver",
  SECONDARY_CAREGIVER: "Secondary Caregiver",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
  AGENCY_ADMIN: "Agency Admin",
  PLATFORM_ADMIN: "Platform Admin",
};

const AVATAR_COLORS = ["admin-avatar-mint", "admin-avatar-gold", "admin-avatar-blue", "admin-avatar-purple", "admin-avatar-sage"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Caregivers Directory</h1>
          <p>Manage platform caregivers, roles, and access controls.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="admin-btn admin-btn-ghost">
            <span>↓</span> Export CSV
          </button>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="admin-card">
        <div className="admin-search-bar">
          <input
            className="admin-input"
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 360 }}
          />
        </div>

        <div className="admin-filters">
          <select
            className="admin-input admin-select"
            style={{ width: 160 }}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px 0" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-shimmer" style={{ height: 56, borderRadius: 10 }} />
            ))}
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" style={{ accentColor: "#5DCAA5" }} />
                  </th>
                  <th>Caregiver Name</th>
                  <th>Role</th>
                  <th>Patients</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data?.users ?? []).map((user, i) => {
                  const primaryRole = user.roles[0]?.role ?? "—";
                  return (
                    <tr key={user.id}>
                      <td>
                        <input type="checkbox" style={{ accentColor: "#5DCAA5" }} />
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className={`admin-avatar ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{user.name}</div>
                            <div style={{ fontSize: 12, color: "#4A6A54" }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge role-${primaryRole}`}>
                          {ROLE_LABELS[primaryRole] ?? primaryRole}
                        </span>
                      </td>
                      <td>{user.roles.length}</td>
                      <td>
                        {user.isPending ? (
                          <span className="admin-badge admin-badge-gold">Pending</span>
                        ) : (
                          <span className="admin-badge admin-badge-mint">Active</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "#7A9480" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {(data?.users ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#4A6A54" }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* ── Pagination ── */}
            <div className="admin-pagination">
              <span>
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data?.total ?? 0)} of{" "}
                {data?.total?.toLocaleString() ?? 0} users
              </span>
              <div className="admin-pagination-pages">
                <button
                  className="admin-pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`admin-pagination-btn${p === page ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                {totalPages > 5 && (
                  <span style={{ padding: "0 4px", color: "#4A6A54" }}>…</span>
                )}
                <button
                  className="admin-pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
