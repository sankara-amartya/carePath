"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

const ACTION_STYLES: Record<string, { badge: string; icon: string }> = {
  ADMIN_SEEDED: { badge: "admin-badge-purple", icon: "🔧" },
  USER_LOGIN: { badge: "admin-badge-blue", icon: "🔑" },
  USER_CREATED: { badge: "admin-badge-blue", icon: "👤" },
  PATIENT_CREATED: { badge: "admin-badge-mint", icon: "🏥" },
  MED_LOGGED: { badge: "admin-badge-mint", icon: "💊" },
  MISSED_DOSE: { badge: "admin-badge-red", icon: "⚠" },
  CHECKIN: { badge: "admin-badge-gold", icon: "📋" },
  TEAM_INVITE: { badge: "admin-badge-blue", icon: "📨" },
  TEAM_REMOVE: { badge: "admin-badge-red", icon: "🚫" },
  ROLE_CHANGED: { badge: "admin-badge-gold", icon: "🔐" },
  ALERT_RESOLVED: { badge: "admin-badge-mint", icon: "✓" },
};

function getActionStyle(action: string) {
  return ACTION_STYLES[action] ?? { badge: "admin-badge-gray", icon: "📌" };
}

function formatTimestamp(d: Date | string): string {
  const date = new Date(d);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const { data, isLoading } = trpc.admin.listAuditLogs.useQuery({
    action: actionFilter || undefined,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  // Unique action types for filter
  const actionTypes = Object.keys(ACTION_STYLES);

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Full system event log with filtering and search.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-filters">
          <select
            className="admin-input admin-select"
            style={{ width: 180 }}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="admin-shimmer" style={{ height: 48, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {(data?.logs ?? []).map((log) => {
                  const style = getActionStyle(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: "#7A9480", whiteSpace: "nowrap" }}>
                        {formatTimestamp(log.createdAt)}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{log.userName}</div>
                          <div style={{ fontSize: 11, color: "#4A6A54" }}>{log.userEmail}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${style.badge}`}>
                          {style.icon} {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#7A9480" }}>
                        {log.entity}
                      </td>
                      <td style={{ fontSize: 12, color: "#4A6A54", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.detail ?? "—"}
                      </td>
                    </tr>
                  );
                })}
                {(data?.logs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "#4A6A54" }}>
                      No audit logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="admin-pagination">
              <span>
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data?.total ?? 0)} of {data?.total ?? 0}
              </span>
              <div className="admin-pagination-pages">
                <button className="admin-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`admin-pagination-btn${p === page ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="admin-pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
