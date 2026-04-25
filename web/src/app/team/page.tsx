"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UserPlus, Trash2, X, Loader2, Users } from "lucide-react";
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

const ROLE_COLORS: Record<string, string> = {
  PRIMARY_CAREGIVER: "linear-gradient(135deg, #5DCAA5, #2A9060)",
  SECONDARY_CAREGIVER: "linear-gradient(135deg, #7A9480, #4A6A50)",
  DOCTOR: "linear-gradient(135deg, #C9943A, #9A6F2A)",
  PATIENT: "linear-gradient(135deg, #8B7EC8, #5C4FA0)",
  AGENCY_ADMIN: "linear-gradient(135deg, #E07070, #B04040)",
  PLATFORM_ADMIN: "linear-gradient(135deg, #E07070, #B04040)",
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

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: members, isLoading, refetch } = trpc.careTeam.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const inviteMutation = trpc.careTeam.invite.useMutation({
    onSuccess: () => { refetch(); setInviteOpen(false); setEmail(""); setRole("SECONDARY_CAREGIVER"); },
  });

  const removeMutation = trpc.careTeam.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const handleInvite = () => {
    if (!patientId || !email) return;
    inviteMutation.mutate({ patientId, email, role });
  };

  if (!patientId) {
    return (
      <div className="page-content"><div className="no-patient-banner"><p>No patient selected.</p></div></div>
    );
  }

  return (
    <div className="page-content" style={{ padding: "24px", paddingBottom: "6rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "24px", margin: "0 0 4px" }}>
            {patient?.name ? `${patient.name}'s care team` : "Care team"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>
            {members?.length || 0} member{(members?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        {can(Action.MANAGE_TEAM) && (
          <button onClick={() => setInviteOpen(true)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            <UserPlus size={15} /> Invite
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} color="var(--mint)" />
        </div>
      )}

      {!isLoading && (!members || members.length === 0) && (
        <div className="empty-state">
          <Users size={40} color="var(--muted)" style={{ marginBottom: "12px" }} />
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>No team members yet</p>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>Invite caregivers and doctors to collaborate.</p>
        </div>
      )}

      {/* Members */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {members?.map((member) => (
          <div key={member.id} className="card-feat" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: ROLE_COLORS[member.role] || "var(--sage-light)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {member.user.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "?"}
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "14px" }}>{member.user.name}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>{member.user.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={`badge ${ROLE_BADGE[member.role] || "badge-gray"}`}>
                {ROLE_LABELS[member.role] || member.role}
              </span>
              {can(Action.MANAGE_TEAM) && (
                <button
                  onClick={() => removeMutation.mutate({ memberId: member.id })}
                  disabled={removeMutation.isPending}
                  className="btn-icon"
                  style={{ width: "32px", height: "32px" }}
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite dialog */}
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">Invite team member</Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close"><X size={18} /></button>
            </Dialog.Close>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input className="inp" type="email" placeholder="Email address *" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="inp" value={role} onChange={(e) => setRole(e.target.value as RoleValue)} style={{ cursor: "pointer" }}>
                <option value="SECONDARY_CAREGIVER">Secondary Caregiver</option>
                <option value="DOCTOR">Doctor</option>
                <option value="PATIENT">Patient</option>
                <option value="AGENCY_ADMIN">Agency Admin</option>
              </select>
            </div>

            {inviteMutation.isError && (
              <div className="form-error" style={{ marginTop: "8px" }}>{inviteMutation.error.message}</div>
            )}

            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "20px" }} onClick={handleInvite} disabled={inviteMutation.isPending || !email}>
              {inviteMutation.isPending ? "Sending invite…" : "Send invite"}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
