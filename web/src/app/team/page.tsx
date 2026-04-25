"use client";

/**
 * /team — Care Team Management Page
 *
 * Replaces the old "Team Placeholder" stub.
 *
 * Features:
 *  - Lists all care team members from the DB (trpc.careTeam.list)
 *  - Shows role badge per member (Primary Caregiver, Doctor, etc.)
 *  - Invite new member by email + role (trpc.careTeam.invite)
 *  - Remove member from team (trpc.careTeam.remove)
 *  - MANAGE_TEAM permission gate — only Primary Caregiver / Admin can invite
 */

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserPlus, Trash2, X, Loader2 } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";
import { usePermissions, Action, Role } from "@/hooks/usePermissions";

const ROLE_LABELS: Record<string, string> = {
  PRIMARY_CAREGIVER: "Primary Caregiver",
  SECONDARY_CAREGIVER: "Secondary Caregiver",
  DOCTOR: "Doctor",
  PATIENT: "Patient",
  AGENCY_ADMIN: "Agency Admin",
  PLATFORM_ADMIN: "Platform Admin",
};

const ROLE_BADGE: Record<string, string> = {
  PRIMARY_CAREGIVER: "badge-mint",
  SECONDARY_CAREGIVER: "badge-gray",
  DOCTOR: "badge-gold",
  PATIENT: "badge-gray",
  AGENCY_ADMIN: "badge-red",
  PLATFORM_ADMIN: "badge-red",
};

type RoleValue =
  | "PRIMARY_CAREGIVER"
  | "SECONDARY_CAREGIVER"
  | "DOCTOR"
  | "PATIENT"
  | "AGENCY_ADMIN"
  | "PLATFORM_ADMIN";

export default function TeamPage() {
  const { patientId } = usePatient();
  const { can } = usePermissions();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleValue>("SECONDARY_CAREGIVER");

  // ── tRPC queries ──────────────────────────────────────────────────────────
  const {
    data: members,
    isLoading,
    refetch,
  } = trpc.careTeam.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const inviteMutation = trpc.careTeam.invite.useMutation({
    onSuccess: () => {
      refetch();
      setInviteOpen(false);
      setEmail("");
      setRole("SECONDARY_CAREGIVER");
    },
  });

  const removeMutation = trpc.careTeam.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const handleInvite = () => {
    if (!patientId || !email) return;
    inviteMutation.mutate({ patientId, email, role });
  };

  // ── No patient guard ──────────────────────────────────────────────────────
  if (!patientId) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <div
          style={{
            backgroundColor: "rgba(201,148,58,0.1)",
            border: "1px solid rgba(201,148,58,0.3)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--gold)", fontWeight: 500, margin: 0 }}>
            No patient selected. Please select a patient from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", paddingBottom: "6rem", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 className="sec-title" style={{ margin: 0 }}>
          Care team
        </h1>
        {can(Action.MANAGE_TEAM) && (
          <button
            className="btn-primary"
            onClick={() => setInviteOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <UserPlus size={16} />
            Invite
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && (!members || members.length === 0) && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
          <p>No care team members yet.</p>
          {can(Action.MANAGE_TEAM) && (
            <p style={{ fontSize: "13px" }}>Invite the first member above.</p>
          )}
        </div>
      )}

      {/* ── Members list ── */}
      {members?.map((member) => (
        <div
          key={member.id}
          className="card-feat"
          style={{
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {/* Avatar circle with initials */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--sage-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  flexShrink: 0,
                }}
              >
                {member.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "?"}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>
                  {member.user.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  {member.user.email}
                </p>
              </div>
            </div>
            <span className={`badge ${ROLE_BADGE[member.role] || "badge-gray"}`}>
              {ROLE_LABELS[member.role] || member.role}
            </span>
          </div>

          {can(Action.MANAGE_TEAM) && (
            <button
              onClick={() => removeMutation.mutate({ memberId: member.id })}
              disabled={removeMutation.isPending}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "var(--radius-sm)",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--alert)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {/* ── Invite dialog ── */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              backgroundColor: "rgba(0,0,0,0.6)",
              position: "fixed",
              inset: 0,
              zIndex: 100,
            }}
          />
          <Dialog.Content
            style={{
              backgroundColor: "var(--ink2)",
              borderRadius: "var(--radius)",
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(440px, 90vw)",
              padding: "2rem",
              zIndex: 101,
              outline: "none",
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 1.5rem",
                fontSize: "22px",
                fontFamily: "var(--font-dm-serif)",
              }}
            >
              Invite team member
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </Dialog.Close>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                className="inp"
                type="email"
                placeholder="Email address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="inp"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleValue)}
                style={{ cursor: "pointer" }}
              >
                <option value="SECONDARY_CAREGIVER">Secondary Caregiver</option>
                <option value="DOCTOR">Doctor</option>
                <option value="PATIENT">Patient</option>
                <option value="AGENCY_ADMIN">Agency Admin</option>
              </select>
            </div>

            {inviteMutation.isError && (
              <p style={{ color: "var(--alert)", fontSize: "13px", marginTop: "8px" }}>
                {inviteMutation.error.message}
              </p>
            )}

            <button
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "14px",
                marginTop: "1.5rem",
              }}
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !email}
            >
              {inviteMutation.isPending ? "Sending invite…" : "Send invite"}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
