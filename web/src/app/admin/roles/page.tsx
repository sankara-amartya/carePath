"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

const ALL_ROLES = [
  "PRIMARY_CAREGIVER",
  "SECONDARY_CAREGIVER",
  "DOCTOR",
  "PATIENT",
  "AGENCY_ADMIN",
  "PLATFORM_ADMIN",
] as const;

const ALL_ACTIONS = [
  "LOG_MEDICATION",
  "EDIT_MEDICATIONS",
  "MANAGE_TEAM",
  "GENERATE_AI_SUMMARY",
  "VIEW_HEALTH_TIMELINE",
  "VERIFY_PILL_PHOTO",
  "VOICE_JOURNAL",
  "RESOLVE_ALERTS",
  "DOWNLOAD_APPT_BRIEF",
];

const ROLE_DISPLAY: Record<string, { label: string; type: string; icon: string }> = {
  PLATFORM_ADMIN: { label: "SYSTEM ADMIN", type: "Core", icon: "🛡" },
  PRIMARY_CAREGIVER: { label: "PRIMARY CAREGIVER", type: "Core", icon: "👤" },
  DOCTOR: { label: "DOCTOR", type: "Standard", icon: "🩺" },
  PATIENT: { label: "PATIENT", type: "Standard", icon: "🧑" },
  SECONDARY_CAREGIVER: { label: "SECONDARY CAREGIVER", type: "Standard", icon: "👥" },
  AGENCY_ADMIN: { label: "AGENCY ADMIN", type: "Standard", icon: "🏢" },
};

const ACTION_SHORT: Record<string, string> = {
  LOG_MEDICATION: "Log Med",
  EDIT_MEDICATIONS: "Edit Med",
  MANAGE_TEAM: "Team",
  GENERATE_AI_SUMMARY: "AI Sum",
  VIEW_HEALTH_TIMELINE: "Timeline",
  VERIFY_PILL_PHOTO: "Photo",
  VOICE_JOURNAL: "Voice",
  RESOLVE_ALERTS: "Alerts",
  DOWNLOAD_APPT_BRIEF: "Brief",
};

// Default permissions (fallback before DB is seeded)
const DEFAULT_PERMS: Record<string, Set<string>> = {
  PRIMARY_CAREGIVER: new Set(ALL_ACTIONS),
  SECONDARY_CAREGIVER: new Set(["LOG_MEDICATION", "VERIFY_PILL_PHOTO", "VOICE_JOURNAL", "VIEW_HEALTH_TIMELINE", "RESOLVE_ALERTS"]),
  DOCTOR: new Set(["VIEW_HEALTH_TIMELINE", "DOWNLOAD_APPT_BRIEF"]),
  PATIENT: new Set(["VIEW_HEALTH_TIMELINE"]),
  AGENCY_ADMIN: new Set(["VIEW_HEALTH_TIMELINE", "MANAGE_TEAM"]),
  PLATFORM_ADMIN: new Set(ALL_ACTIONS),
};

type ViewMode = "cards" | "matrix";

export default function AdminRolesPage() {
  const [view, setView] = useState<ViewMode>("cards");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data: dbPerms, isLoading } = trpc.admin.getRolePermissions.useQuery();
  const utils = trpc.useUtils();
  const setPermMutation = trpc.admin.setRolePermission.useMutation({
    onSuccess: () => utils.admin.getRolePermissions.invalidate(),
  });

  // Build the permission map from DB data, falling back to defaults
  const permMap: Record<string, Set<string>> = {};
  for (const role of ALL_ROLES) {
    permMap[role] = new Set(DEFAULT_PERMS[role]);
  }
  if (dbPerms && dbPerms.length > 0) {
    // DB overrides defaults
    for (const role of ALL_ROLES) {
      permMap[role] = new Set();
    }
    for (const p of dbPerms) {
      if (!permMap[p.role]) permMap[p.role] = new Set();
      permMap[p.role].add(p.action);
    }
  }

  function togglePermission(role: string, action: string) {
    const enabled = !permMap[role]?.has(action);
    setPermMutation.mutate({
      role: role as (typeof ALL_ROLES)[number],
      action,
      enabled,
    });
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p>Configure granular platform access levels for internal and external entities.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="admin-btn admin-btn-ghost" onClick={() => setView("cards")}>
            Cards
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setView("matrix")}>
            Matrix View
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-shimmer" style={{ height: 100, borderRadius: 14 }} />
          ))}
        </div>
      ) : view === "cards" ? (
        /* ── Card View (matching screenshot 4) ── */
        <>
          {ALL_ROLES.map((role) => {
            const info = ROLE_DISPLAY[role] ?? { label: role, type: "Standard", icon: "👤" };
            const perms = permMap[role] ?? new Set();
            const isExpanded = selectedRole === role;

            return (
              <div key={role} className="admin-role-card" onClick={() => setSelectedRole(isExpanded ? null : role)}>
                <div className="admin-role-card-header">
                  <h4>
                    <span>{info.icon}</span>
                    {info.label}
                  </h4>
                  <span className={`admin-badge admin-badge-${info.type === "Core" ? "core" : "standard"}`}>
                    {info.type}
                  </span>
                </div>
                <div className="admin-role-card-meta">
                  {perms.size} of {ALL_ACTIONS.length} permissions enabled
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ALL_ACTIONS.map((action) => (
                        <label
                          key={action}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: 8,
                            background: perms.has(action) ? "rgba(93,202,165,0.06)" : "transparent",
                            cursor: "pointer",
                            fontSize: 12,
                            color: perms.has(action) ? "#5DCAA5" : "#4A6A54",
                            transition: "all 0.2s ease",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="admin-toggle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={perms.has(action)}
                              onChange={() => togglePermission(role, action)}
                            />
                            <span className="admin-toggle-slider" />
                          </label>
                          {ACTION_SHORT[action] ?? action}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        /* ── Matrix View ── */
        <div className="admin-card" style={{ overflowX: "auto" }}>
          <table className="admin-matrix">
            <thead>
              <tr>
                <th>Role</th>
                {ALL_ACTIONS.map((a) => (
                  <th key={a}>{ACTION_SHORT[a]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ROLES.map((role) => {
                const info = ROLE_DISPLAY[role] ?? { label: role, icon: "" };
                const perms = permMap[role] ?? new Set();
                return (
                  <tr key={role}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{info.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{info.label}</span>
                      </div>
                    </td>
                    {ALL_ACTIONS.map((action) => (
                      <td key={action}>
                        <label className="admin-toggle">
                          <input
                            type="checkbox"
                            checked={perms.has(action)}
                            onChange={() => togglePermission(role, action)}
                          />
                          <span className="admin-toggle-slider" />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
