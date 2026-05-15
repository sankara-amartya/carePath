"use client";

import React from "react";
import Link from "next/link";
import { Plus, Loader2, Book } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";

const SCORE_EMOJI = ["", "😣", "😟", "😐", "🙂", "😊"];

function VitalBar({ label, value }: { label: string; value: number }) {
  const color = value < 3 ? "var(--gold)" : "var(--mint)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
      <span style={{ fontSize: "11px", color: "var(--muted)", width: "56px", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: "5px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{ width: `${(value / 5) * 100}%`, height: "100%", backgroundColor: color, borderRadius: "9999px", transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: "13px", width: "22px", textAlign: "center" }}>
        {SCORE_EMOJI[value]}
      </span>
    </div>
  );
}

export default function JournalPage() {
  const { patientId } = usePatient();

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: entries, isLoading } = trpc.healthChecks.list.useQuery(
    { patientId: patientId!, days: 30 },
    { enabled: !!patientId }
  );

  const formatDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
            {patient?.name ? `${patient.name}'s journal` : "Health journal"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>
            {entries?.length || 0} entries in the last 30 days
          </p>
        </div>
        <Link href="/checkin" className="btn-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: "13px" }}>
          <Plus size={15} /> New entry
        </Link>
      </div>

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} color="var(--mint)" />
        </div>
      )}

      {!isLoading && (!entries || entries.length === 0) && (
        <div className="empty-state">
          <Book size={40} color="var(--muted)" style={{ marginBottom: "12px" }} />
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>No journal entries yet</p>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>Complete a daily check-in to start the journal.</p>
        </div>
      )}

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {entries && entries.length > 0 && (
          <div style={{ position: "absolute", left: "11px", top: "8px", bottom: "8px", width: "1px", backgroundColor: "rgba(255,255,255,0.05)" }} />
        )}

        {entries?.map((entry, idx) => (
          <div key={entry.id} style={{ display: "flex", gap: "16px", marginBottom: "14px", animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}>
            {/* Dot */}
            <div style={{ flexShrink: 0, paddingTop: "6px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "var(--ink2)", border: "2px solid var(--mint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--mint)" }} />
              </div>
            </div>

            {/* Card */}
            <div className="card-feat" style={{ flex: 1, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>{formatDate(entry.checkedAt)}</span>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{formatTime(entry.checkedAt)}</span>
              </div>

              <VitalBar label="Pain" value={entry.pain} />
              <VitalBar label="Mood" value={entry.mood} />
              <VitalBar label="Appetite" value={entry.appetite} />
              <VitalBar label="Mobility" value={entry.mobility} />
              <VitalBar label="Energy" value={entry.energy} />

              {entry.notes && (
                <p style={{ margin: "10px 0 0", fontSize: "13px", color: "var(--muted)", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "10px" }}>
                  &ldquo;{entry.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
