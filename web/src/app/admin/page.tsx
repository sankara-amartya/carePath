"use client";

import React from "react";
import { trpc } from "@/lib/trpc";

function formatTimeAgo(date: Date): string {
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

function getFeedIcon(type: string) {
  if (type.includes("MISSED") || type.includes("ALERT")) return { cls: "alert", emoji: "⚠" };
  if (type.includes("MED") || type.includes("DOSE")) return { cls: "med", emoji: "💊" };
  if (type.includes("USER") || type.includes("LOGIN") || type.includes("SEEDED")) return { cls: "user", emoji: "👤" };
  if (type.includes("CHECKIN") || type.includes("CHECK")) return { cls: "check", emoji: "📋" };
  if (type.includes("ADMIN")) return { cls: "admin", emoji: "🔧" };
  return { cls: "med", emoji: "📌" };
}

export default function AdminOverviewPage() {
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: feed, isLoading: feedLoading } = trpc.admin.recentActivity.useQuery({ limit: 10 });

  return (
    <>
      {/* ── Header ── */}
      <div className="admin-page-header">
        <div>
          <h1>Overview</h1>
          <p>Platform-wide metrics and live activity</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Caregivers</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.totalCaregivers?.toLocaleString() ?? "0")}
          </div>
          <div className="admin-stat-icon">👥</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Patients</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.totalPatients?.toLocaleString() ?? "0")}
          </div>
          <div className="admin-stat-icon">🏥</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Doctors</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.totalDoctors?.toLocaleString() ?? "0")}
          </div>
          <div className="admin-stat-sub">Stable</div>
          <div className="admin-stat-icon">🩺</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Meds Logged (Today)</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.todayMedLogs?.toLocaleString() ?? "0")}
          </div>
          <div className="admin-stat-icon">💊</div>
          <div className="admin-progress">
            <div className="admin-progress-fill admin-progress-mint" style={{ width: "70%" }} />
          </div>
        </div>

        <div className={`admin-stat-card${(stats?.missedLast24h ?? 0) > 0 ? " warn" : ""}`}>
          <div className="admin-stat-label">Missed Doses (24h)</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.missedLast24h ?? 0)}
          </div>
          {(stats?.missedLast24h ?? 0) > 0 && <div className="admin-stat-sub" style={{ color: "#C9943A" }}>Requires Attention</div>}
          <div className="admin-stat-icon">⚠</div>
        </div>

        <div className={`admin-stat-card${(stats?.unresolvedAlerts ?? 0) > 0 ? " danger" : ""}`}>
          <div className="admin-stat-label">Open System Alerts</div>
          <div className="admin-stat-value">
            {statsLoading ? <span className="admin-shimmer" style={{ display: "inline-block", width: 60, height: 36 }} /> : (stats?.unresolvedAlerts ?? 0)}
          </div>
          <div className="admin-stat-icon">🔔</div>
        </div>
      </div>

      {/* ── Two-column: Roles + Activity ── */}
      <div className="admin-grid-2">
        {/* ── System Roles Donut ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>System Roles</h3>
          </div>
          <div className="admin-donut-container">
            {statsLoading ? (
              <span className="admin-shimmer" style={{ width: 140, height: 140, borderRadius: "50%", display: "block" }} />
            ) : (
              <>
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <RoleDonut distribution={stats?.roleDistribution ?? []} total={stats?.totalUsers ?? 0} />
                </svg>
                <div className="admin-donut-legend">
                  {(stats?.roleDistribution ?? []).map((r) => (
                    <div key={r.role} className="admin-donut-legend-item">
                      <span className="admin-donut-legend-dot" style={{ background: getRoleColor(r.role) }} />
                      {formatRoleLabel(r.role)} ({r.count})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Live System Log ── */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3><span className="admin-live-dot" />Live System Log</h3>
          </div>
          {feedLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="admin-shimmer" style={{ height: 48, borderRadius: 8 }} />
              ))}
            </div>
          ) : (
            <ul className="admin-feed">
              {(feed ?? []).map((item, i) => {
                const icon = getFeedIcon(item.type);
                return (
                  <li key={i} className="admin-feed-item">
                    <div className={`admin-feed-icon ${icon.cls}`}>{icon.emoji}</div>
                    <div className="admin-feed-content">
                      <div className="admin-feed-title">{item.message}</div>
                      <div className="admin-feed-detail">
                        {item.detail ? `${item.detail} · ` : ""}by {item.userName}
                      </div>
                    </div>
                    <span className="admin-feed-time">{formatTimeAgo(item.timestamp)}</span>
                  </li>
                );
              })}
              {(feed ?? []).length === 0 && (
                <li style={{ padding: "20px 0", textAlign: "center", color: "#4A6A54", fontSize: 13 }}>
                  No recent activity
                </li>
              )}
            </ul>
          )}
          <a href="/admin/audit" className="admin-feed-link">View Full Audit Log</a>
        </div>
      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    PRIMARY_CAREGIVER: "#5DCAA5",
    SECONDARY_CAREGIVER: "#A0B8A8",
    DOCTOR: "#C9943A",
    PATIENT: "#E8D5B0",
    AGENCY_ADMIN: "#5B9BD5",
    PLATFORM_ADMIN: "#9B7FD4",
  };
  return map[role] ?? "#7A9480";
}

function formatRoleLabel(role: string): string {
  const map: Record<string, string> = {
    PRIMARY_CAREGIVER: "Caregivers",
    SECONDARY_CAREGIVER: "Secondary",
    DOCTOR: "Doctors",
    PATIENT: "Patients",
    AGENCY_ADMIN: "Agencies",
    PLATFORM_ADMIN: "Admins",
  };
  return map[role] ?? role;
}

function RoleDonut({ distribution, total }: { distribution: { role: string; count: number }[]; total: number }) {
  if (distribution.length === 0 || total === 0) {
    return (
      <>
        <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <text x="70" y="66" textAnchor="middle" fill="#E8F0E9" fontSize="22" fontWeight="600" fontFamily="var(--font-dm-serif), serif">{total}</text>
        <text x="70" y="82" textAnchor="middle" fill="#4A6A54" fontSize="10" letterSpacing="0.06em">TOTAL</text>
      </>
    );
  }

  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <>
      {distribution.map((r) => {
        const pct = r.count / total;
        const dashLength = pct * circumference;
        const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
        const strokeDashoffset = -offset;
        offset += dashLength;

        return (
          <circle
            key={r.role}
            cx="70" cy="70" r={radius}
            fill="none"
            stroke={getRoleColor(r.role)}
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        );
      })}
      <text x="70" y="66" textAnchor="middle" fill="#E8F0E9" fontSize="22" fontWeight="600" fontFamily="var(--font-dm-serif), serif">
        {total.toLocaleString()}
      </text>
      <text x="70" y="82" textAnchor="middle" fill="#4A6A54" fontSize="10" letterSpacing="0.06em">TOTAL</text>
    </>
  );
}
