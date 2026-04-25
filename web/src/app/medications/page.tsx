"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X, Plus, Loader2, Pill, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { usePermissions, Action } from "@/hooks/usePermissions";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";

type LogStatus = "taken" | "skipped" | "missed";

export default function MedicationsPage() {
  const { can } = usePermissions();
  const { patientId } = usePatient();

  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [selectedMedName, setSelectedMedName] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [logNotes, setLogNotes] = useState("");

  const [newName, setNewName] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newTime, setNewTime] = useState("08:00");

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

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

  const getStatus = (medId: string): "Done" | "Due" | "Scheduled" => {
    const log = todayLogs?.find((l) => l.medicationId === medId);
    if (log?.status === "taken") return "Done";
    return "Due";
  };

  const statusIcon = (s: string) => {
    if (s === "Done") return <CheckCircle size={16} color="var(--mint)" />;
    if (s === "Due") return <Clock size={16} color="var(--gold)" />;
    return <AlertCircle size={16} color="var(--alert)" />;
  };

  const badgeClass = (s: string) => {
    if (s === "Done") return "badge-mint";
    if (s === "Due") return "badge-gold";
    return "badge-red";
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

  const totalMeds = medications?.length || 0;
  const takenCount = medications?.filter(m => getStatus(m.id) === "Done").length || 0;

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
            {patient?.name ? `${patient.name}'s medications` : "Medications"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>
            {totalMeds === 0 ? "No medications yet" : `${takenCount} of ${totalMeds} taken today`}
          </p>
        </div>
        {can(Action.EDIT_MEDICATIONS) && (
          <button onClick={() => setAddOpen(true)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
            <Plus size={15} /> Add
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalMeds > 0 && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "rgba(93,202,165,0.04)", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(93,202,165,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Today&apos;s progress</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--mint)" }}>{Math.round((takenCount / totalMeds) * 100)}%</span>
          </div>
          <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)" }}>
            <div style={{ height: "100%", borderRadius: "3px", background: "var(--mint)", width: `${(takenCount / totalMeds) * 100}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      )}

      {medsLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} color="var(--mint)" />
        </div>
      )}

      {!medsLoading && totalMeds === 0 && (
        <div className="empty-state">
          <Pill size={40} color="var(--muted)" style={{ marginBottom: "12px" }} />
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>No medications added</p>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: 0 }}>Add the first medication to start tracking.</p>
        </div>
      )}

      {/* Medications list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {medications?.map((med) => {
          const status = getStatus(med.id);
          return (
            <div
              key={med.id}
              className="card-feat"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                opacity: status === "Done" ? 0.7 : 1,
                transition: "opacity 0.3s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "12px",
                  background: status === "Done" ? "rgba(93,202,165,0.1)" : "rgba(201,148,58,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {statusIcon(status)}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 2px", fontSize: "15px", fontWeight: 600, textDecoration: status === "Done" ? "line-through" : "none" }}>
                    {med.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
                    {med.dosage} · {med.scheduleTimes?.join(", ") || med.frequency}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`badge ${badgeClass(status)}`}>{status}</span>
                {can(Action.LOG_MEDICATION) && status !== "Done" && (
                  <button
                    className="btn-ghost"
                    style={{ padding: "6px 14px", fontSize: "12px" }}
                    onClick={() => handleLogClick(med.id, med.name, med.dosage)}
                  >
                    Log dose
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Log Dose dialog ── */}
      <Dialog.Root open={logOpen} onOpenChange={setLogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-sheet">
            <Dialog.Title className="dialog-title">{selectedMedName}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close"><X size={18} /></button>
            </Dialog.Close>

            {can(Action.VERIFY_PILL_PHOTO) && (
              <div style={{ background: "rgba(201,148,58,0.06)", padding: "16px", borderRadius: "var(--radius-sm)", border: "0.5px solid rgba(201,148,58,0.15)", marginBottom: "16px", textAlign: "center" }}>
                <button className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Camera size={16} /> Take photo to verify
                </button>
              </div>
            )}

            <div className="form-group">
              <input className="inp" placeholder="Add notes (optional)" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "14px" }} onClick={() => submitLog("taken")} disabled={logMutation.isPending}>
                {logMutation.isPending ? "Saving..." : "✓ Taken"}
              </button>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", padding: "14px" }} onClick={() => submitLog("skipped")} disabled={logMutation.isPending}>
                Skip
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Add Medication dialog ── */}
      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content">
            <Dialog.Title className="dialog-title">Add medication</Dialog.Title>
            <Dialog.Close asChild>
              <button className="dialog-close"><X size={18} /></button>
            </Dialog.Close>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input className="inp" placeholder="Medication name *" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <input className="inp" placeholder="Dosage (e.g. 10mg) *" value={newDosage} onChange={(e) => setNewDosage(e.target.value)} />
              <select className="inp" value={newFrequency} onChange={(e) => setNewFrequency(e.target.value)} style={{ cursor: "pointer" }}>
                <option value="daily">Daily</option>
                <option value="twice daily">Twice daily</option>
                <option value="weekly">Weekly</option>
                <option value="as needed">As needed</option>
              </select>
              <input className="inp" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>

            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "20px" }} onClick={handleAddMed} disabled={createMutation.isPending || !newName || !newDosage}>
              {createMutation.isPending ? "Adding..." : "Add medication"}
            </button>

            {createMutation.isError && (
              <div className="form-error" style={{ marginTop: "8px" }}>{createMutation.error.message}</div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
