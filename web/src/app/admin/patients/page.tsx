"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

const ROLE_LABELS: Record<string, string> = {
  PRIMARY_CAREGIVER: "Lead Caregiver",
  SECONDARY_CAREGIVER: "Secondary Caregiver",
  DOCTOR: "Primary Physician",
  PATIENT: "Patient",
  AGENCY_ADMIN: "Agency Admin",
  PLATFORM_ADMIN: "Platform Admin",
};

function getAge(dob: Date): number {
  const today = new Date();
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "—";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminPatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const pageSize = 20;

  const { data, isLoading } = trpc.admin.listPatients.useQuery({
    search: search || undefined,
    page,
    pageSize,
  });

  const { data: patientDetail } = trpc.admin.getPatient.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Patients</h1>
          <p>All patients across the platform with care team and health data.</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* ── Patient list ── */}
        <div style={{ flex: 1 }}>
          <div className="admin-card">
            <div className="admin-search-bar">
              <input
                className="admin-input"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ maxWidth: 320 }}
              />
            </div>

            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="admin-shimmer" style={{ height: 56, borderRadius: 10 }} />
                ))}
              </div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Primary Caregiver</th>
                      <th>Team</th>
                      <th>Meds</th>
                      <th>Alerts</th>
                      <th>Last Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.patients ?? []).map((patient) => (
                      <tr
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        style={{ cursor: "pointer", background: selectedPatientId === patient.id ? "rgba(93,202,165,0.04)" : undefined }}
                      >
                        <td>
                          <div>
                            <div style={{ fontWeight: 500 }}>{patient.name}</div>
                            <div style={{ fontSize: 12, color: "#4A6A54" }}>
                              Age {getAge(patient.dateOfBirth)}
                              {patient.conditions.length > 0 && ` · ${patient.conditions[0]}`}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {patient.primaryCaregiver?.name ?? <span style={{ color: "#4A6A54" }}>Unassigned</span>}
                        </td>
                        <td>{patient.teamSize}</td>
                        <td>{patient.activeMedications}</td>
                        <td>
                          {patient.unresolvedAlerts > 0 ? (
                            <span className="admin-badge admin-badge-red">{patient.unresolvedAlerts}</span>
                          ) : (
                            <span style={{ color: "#4A6A54" }}>0</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: "#7A9480" }}>
                          {formatTimeAgo(patient.lastCheckIn)}
                        </td>
                      </tr>
                    ))}
                    {(data?.patients ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#4A6A54" }}>
                          No patients found
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
        </div>

        {/* ── Patient Detail Panel ── */}
        {selectedPatientId && patientDetail && (
          <div style={{ width: 380, flexShrink: 0 }}>
            <div className="admin-card" style={{ position: "sticky", top: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: 20, margin: 0, color: "#E8F0E9" }}>
                  Patient Details
                </h3>
                <button
                  className="admin-btn admin-btn-ghost admin-btn-sm"
                  onClick={() => setSelectedPatientId(null)}
                >
                  ✕
                </button>
              </div>

              {/* Patient info */}
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
                <div className="admin-avatar admin-avatar-sage" style={{ width: 56, height: 56, fontSize: 18 }}>
                  {patientDetail.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#E8F0E9" }}>{patientDetail.name}</div>
                  <div style={{ fontSize: 12, color: "#7A9480" }}>
                    ID: {patientDetail.id.slice(0, 8)} | DOB: {formatDate(patientDetail.dateOfBirth)}
                  </div>
                </div>
              </div>

              {/* Conditions */}
              {patientDetail.conditions.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {patientDetail.conditions.map((c, i) => (
                    <span key={i} className="admin-badge admin-badge-gold">{c}</span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ flex: 1 }}>
                  ↔ Reassign
                </button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" style={{ flex: 1 }}>
                  📦 Archive
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(93,202,165,0.08)", margin: "0 0 20px" }} />

              {/* Vitals summary */}
              {patientDetail.healthChecks.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#E8F0E9" }}>Vitals Trend ({patientDetail.healthChecks.length} checks)</span>
                    <span className="admin-badge admin-badge-mint">Stable</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, height: 48, alignItems: "flex-end", background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "8px 6px" }}>
                    {patientDetail.healthChecks.map((hc, i) => {
                      const avg = ((hc.pain + hc.mood + hc.appetite + hc.mobility + hc.energy) / 5) / 5;
                      const isLow = avg < 0.5;
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: `${Math.max(20, avg * 100)}%`,
                            background: isLow ? "rgba(220,80,80,0.4)" : "rgba(91,155,213,0.5)",
                            borderRadius: 4,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Assigned Care Team */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#E8F0E9", marginBottom: 12 }}>Assigned Care Team</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "rgba(255,255,255,0.02)", borderRadius: 12, overflow: "hidden" }}>
                  {patientDetail.careTeam.map((member, i) => (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderBottom: i < patientDetail.careTeam.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <div className="admin-avatar admin-avatar-sage" style={{ width: 32, height: 32, fontSize: 11 }}>
                        {member.user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{member.user.name}</div>
                        <div style={{ fontSize: 11, color: "#4A6A54" }}>
                          {ROLE_LABELS[member.role] ?? member.role}
                        </div>
                      </div>
                    </div>
                  ))}
                  {patientDetail.careTeam.length === 0 && (
                    <div style={{ padding: 16, textAlign: "center", color: "#4A6A54", fontSize: 12 }}>
                      No team members assigned
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#E8F0E9", marginBottom: 12 }}>Recent Activity</div>
                {patientDetail.alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: alert.severity === "critical" || alert.severity === "high" ? "#E07070" : "#4A6A54" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#E8F0E9" }}>{alert.message}</div>
                      <div style={{ fontSize: 11, color: "#4A6A54" }}>
                        System · {formatDate(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                {patientDetail.alerts.length === 0 && (
                  <div style={{ color: "#4A6A54", fontSize: 12 }}>No recent alerts</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
