"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function AdminMedicationsPage() {
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = trpc.admin.listMedications.useQuery({
    search: search || undefined,
    activeOnly,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Medications</h1>
          <p>Platform-wide medication tracking and adherence overview.</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-search-bar">
          <input
            className="admin-input"
            placeholder="Search medications..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 320 }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#7A9480", cursor: "pointer" }}>
            <label className="admin-toggle">
              <input type="checkbox" checked={activeOnly} onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }} />
              <span className="admin-toggle-slider" />
            </label>
            Active only
          </label>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-shimmer" style={{ height: 48, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Patient</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Schedule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.medications ?? []).map((med) => (
                  <tr key={med.id}>
                    <td style={{ fontWeight: 500 }}>{med.name}</td>
                    <td style={{ fontSize: 12 }}>{med.patientName}</td>
                    <td>
                      <span className="admin-badge admin-badge-mint">{med.dosage}</span>
                    </td>
                    <td style={{ fontSize: 12, color: "#7A9480" }}>{med.frequency}</td>
                    <td style={{ fontSize: 12, color: "#7A9480" }}>
                      {med.scheduleTimes.join(", ")}
                    </td>
                    <td>
                      {med.active ? (
                        <span className="admin-badge admin-badge-mint">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge-gray">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(data?.medications ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#4A6A54" }}>
                      No medications found
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
