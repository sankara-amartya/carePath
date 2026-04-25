"use client";

/**
 * /journal — Voice Journal Page
 *
 * Replaces the old "Journal Placeholder" stub.
 *
 * Features:
 *  - Lists past health check-ins as journal entries (trpc.healthChecks.list)
 *  - Each entry shows the 5 vitals as emoji bars + notes
 *  - "New Entry" button links to /checkin
 *  - The journal acts as a historical timeline of check-ins
 */

import React from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";

const SCORE_EMOJI = ["", "😣", "😟", "😐", "🙂", "😊"];

function VitalBar({ label, value }: { label: string; value: number }) {
  const color = value < 3 ? "var(--gold)" : "var(--mint)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
      <span style={{ fontSize: "11px", color: "var(--muted)", width: "60px", flexShrink: 0 }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: "4px",
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${(value / 5) * 100}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: "9999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: "12px", width: "20px", textAlign: "center" }}>
        {SCORE_EMOJI[value]}
      </span>
    </div>
  );
}

export default function JournalPage() {
  const { patientId } = usePatient();

  const { data: entries, isLoading } = trpc.healthChecks.list.useQuery(
    { patientId: patientId!, days: 30 },
    { enabled: !!patientId }
  );

  const formatDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

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
          Health journal
        </h1>
        <Link
          href="/checkin"
          className="btn-primary"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} />
          New entry
        </Link>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && (!entries || entries.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1.5rem",
            color: "var(--muted)",
          }}
        >
          <p style={{ fontSize: "40px", marginBottom: "1rem" }}>📋</p>
          <p style={{ fontWeight: 500, marginBottom: "8px" }}>No journal entries yet</p>
          <p style={{ fontSize: "13px" }}>
            Start by logging today&apos;s check-in.
          </p>
        </div>
      )}

      {/* ── Timeline ── */}
      <div style={{ position: "relative" }}>
        {/* Vertical line */}
        {entries && entries.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: "8px",
              bottom: "8px",
              width: "1px",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          />
        )}

        {entries?.map((entry, idx) => (
          <div
            key={entry.id}
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "1.5rem",
              animation: `fadeIn 0.3s ease ${idx * 0.05}s both`,
            }}
          >
            {/* Timeline dot */}
            <div style={{ flexShrink: 0, paddingTop: "6px" }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  backgroundColor: "var(--ink2)",
                  border: "2px solid var(--mint)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--mint)",
                  }}
                />
              </div>
            </div>

            {/* Card */}
            <div
              className="card-feat"
              style={{ flex: 1, padding: "1rem 1.2rem" }}
            >
              {/* Date + time */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {formatDate(entry.checkedAt)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  {formatTime(entry.checkedAt)}
                </span>
              </div>

              {/* Vital bars */}
              <VitalBar label="Pain" value={entry.pain} />
              <VitalBar label="Mood" value={entry.mood} />
              <VitalBar label="Appetite" value={entry.appetite} />
              <VitalBar label="Mobility" value={entry.mobility} />
              <VitalBar label="Energy" value={entry.energy} />

              {/* Notes */}
              {entry.notes && (
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "13px",
                    color: "var(--muted)",
                    fontStyle: "italic",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: "10px",
                  }}
                >
                  &ldquo;{entry.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
