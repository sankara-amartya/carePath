"use client";

/**
 * /medications — Live Medications Page
 *
 * What changed from the static version:
 *  - Removed MOCK_MEDS array
 *  - Now calls trpc.medications.list.useQuery() to load from the DB
 *  - Also loads today's medication logs via trpc.medicationLogs.today.useQuery()
 *    so we can show the real status (taken / due / missed)
 *  - "Log dose" button calls trpc.medicationLogs.log.useMutation()
 *  - "+" FAB calls trpc.medications.create.useMutation() (opens an add form)
 *  - Falls back to a "No patient selected" banner if patientId is missing
 */

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X, Plus, Loader2 } from "lucide-react";
import { usePermissions, Action } from "@/hooks/usePermissions";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";

type LogStatus = "taken" | "skipped" | "missed";

export default function MedicationsPage() {
  const { can } = usePermissions();
  const { patientId } = usePatient();

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [selectedMedName, setSelectedMedName] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [logNotes, setLogNotes] = useState("");

  // ── Add medication form state ─────────────────────────────────────────────
  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newTime, setNewTime] = useState("08:00");

  // ── tRPC queries ──────────────────────────────────────────────────────────
  const {
    data: medications,
    isLoading: medsLoading,
    refetch: refetchMeds,
  } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs, refetch: refetchLogs } =
    trpc.medicationLogs.today.useQuery(
      { patientId: patientId! },
      { enabled: !!patientId }
    );

  // ── tRPC mutations ────────────────────────────────────────────────────────
  const logMutation = trpc.medicationLogs.log.useMutation({
    onSuccess: () => {
      refetchLogs();
      setLogOpen(false);
      setLogNotes("");
    },
  });

  const createMutation = trpc.medications.create.useMutation({
    onSuccess: () => {
      refetchMeds();
      setAddOpen(false);
      setNewName("");
      setNewDosage("");
      setNewFrequency("daily");
      setNewTime("08:00");
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatus = (medId: string): "Done" | "Due" | "Scheduled" => {
    const log = todayLogs?.find((l) => l.medicationId === medId);
    if (log?.status === "taken") return "Done";
    return "Due";
  };

  const badgeClass = (s: string) => {
    if (s === "Done") return "badge-mint";
    if (s === "Due") return "badge-gold";
    if (s === "Missed") return "badge-red";
    return "badge-gray";
  };

  const handleLogClick = (id: string, name: string, dosage: string) => {
    setSelectedMedId(id);
    setSelectedMedName(`${name} ${dosage}`);
    setLogOpen(true);
  };

  const submitLog = (status: LogStatus) => {
    if (!selectedMedId) return;
    logMutation.mutate({ medicationId: selectedMedId, status, notes: logNotes });
  };

  const handleAddMed = () => {
    if (!patientId || !newName || !newDosage) return;
    createMutation.mutate({
      patientId,
      name: newName,
      dosage: newDosage,
      frequency: newFrequency,
      scheduleTimes: [newTime],
    });
  };

  // ── No patient selected guard ─────────────────────────────────────────────
  if (!patientId) {
    return (
      <div style={{ padding: "1.5rem", minHeight: "100vh" }}>
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
      <h1 className="sec-title" style={{ marginBottom: "1.5rem" }}>
        Today&apos;s medications
      </h1>

      {/* ── Loading state ── */}
      {medsLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* ── Empty state ── */}
      {!medsLoading && (!medications || medications.length === 0) && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            color: "var(--muted)",
          }}
        >
          <p>No medications added yet.</p>
          {can(Action.EDIT_MEDICATIONS) && (
            <p style={{ fontSize: "13px" }}>
              Tap the + button to add the first medication.
            </p>
          )}
        </div>
      )}

      {/* ── Medications list ── */}
      {medications?.map((med) => {
        const status = getStatus(med.id);
        return (
          <div
            key={med.id}
            className="card-feat"
            style={{
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 600 }}>
                {med.name} {med.dosage}
              </h3>
              <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--muted)" }}>
                {med.scheduleTimes?.join(", ") || med.frequency}
              </p>
              <span className={`badge ${badgeClass(status)}`}>{status}</span>
            </div>

            {can(Action.LOG_MEDICATION) && status !== "Done" && (
              <button
                className="btn-ghost"
                onClick={() => handleLogClick(med.id, med.name, med.dosage)}
              >
                Log dose
              </button>
            )}
          </div>
        );
      })}

      {/* ── Add medication FAB ── */}
      {can(Action.EDIT_MEDICATIONS) && (
        <button
          onClick={() => setAddOpen(true)}
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "56px",
            height: "56px",
            borderRadius: "28px",
            backgroundColor: "var(--mint)",
            border: "none",
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            cursor: "pointer",
            zIndex: 40,
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* ── Log Dose bottom sheet ── */}
      <Dialog.Root open={logOpen} onOpenChange={setLogOpen}>
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
              borderTopLeftRadius: "var(--radius)",
              borderTopRightRadius: "var(--radius)",
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "1.5rem",
              paddingBottom: "3rem",
              zIndex: 101,
              outline: "none",
            }}
          >
            <Dialog.Title
              style={{
                margin: "0 0 1.5rem",
                fontSize: "24px",
                fontFamily: "var(--font-dm-serif)",
              }}
            >
              {selectedMedName}
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

            {can(Action.VERIFY_PILL_PHOTO) && (
              <div
                style={{
                  backgroundColor: "rgba(201,148,58,0.1)",
                  padding: "1.5rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid rgba(201,148,58,0.3)",
                  marginBottom: "1.5rem",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <button className="b4" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={16} />
                  Take photo to verify
                </button>
              </div>
            )}

            <input
              type="text"
              className="inp"
              placeholder="Add notes (optional)"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              style={{ marginBottom: "1rem" }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", padding: "14px" }}
                onClick={() => submitLog("taken")}
                disabled={logMutation.isPending}
              >
                {logMutation.isPending ? "Saving..." : "✓ Taken"}
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1, justifyContent: "center", padding: "14px" }}
                onClick={() => submitLog("skipped")}
                disabled={logMutation.isPending}
              >
                Skip
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Add Medication dialog ── */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
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
              width: "min(480px, 90vw)",
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
              Add medication
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
                placeholder="Medication name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="inp"
                placeholder="Dosage (e.g. 10mg) *"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
              />
              <select
                className="inp"
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                <option value="daily">Daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="weekly">Weekly</option>
                <option value="as needed">As needed</option>
              </select>
              <input
                className="inp"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "1.5rem" }}
              onClick={handleAddMed}
              disabled={createMutation.isPending || !newName || !newDosage}
            >
              {createMutation.isPending ? "Adding..." : "Add medication"}
            </button>

            {createMutation.isError && (
              <p style={{ color: "var(--alert)", fontSize: "13px", marginTop: "8px" }}>
                Error: {createMutation.error.message}
              </p>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes overlayShow { from { opacity: 0; } to { opacity: 1; } }
        @keyframes contentShow { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
