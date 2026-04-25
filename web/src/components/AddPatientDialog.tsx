"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X, Heart, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { usePatient } from "@/context/PatientContext";
import { useUser } from "@clerk/nextjs";

export function AddPatientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setPatientId } = usePatient();
  const { user } = useUser();

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [conditions, setConditions] = useState("");
  const [contact, setContact] = useState("");

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: async (data) => {
      setPatientId(data.id);
      try {
        await user?.reload();
      } catch {
        // Non-critical — role metadata may already be set
      }
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName("");
    setDob("");
    setConditions("");
    setContact("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) return;

    createPatient.mutate({
      name,
      dateOfBirth: new Date(dob).toISOString(),
      conditions: conditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      emergencyContact: contact || undefined,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" style={{ maxWidth: "460px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(93,202,165,0.2), rgba(93,202,165,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={18} color="var(--mint)" />
            </div>
            <div>
              <Dialog.Title className="dialog-title">Add a patient</Dialog.Title>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                Create a new care profile
              </p>
            </div>
          </div>

          <Dialog.Close asChild>
            <button className="dialog-close">
              <X size={18} />
            </button>
          </Dialog.Close>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Patient name *</label>
              <input
                required
                className="inp"
                placeholder="e.g. Mom, Dad, John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of birth *</label>
              <input
                required
                type="date"
                className="inp"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pre-existing conditions</label>
              <input
                className="inp"
                placeholder="e.g. Hypertension, Diabetes (comma separated)"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency contact</label>
              <input
                className="inp"
                placeholder="Name — Phone number"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            {createPatient.isError && (
              <p style={{ color: "var(--alert)", fontSize: "13px", marginBottom: "16px" }}>
                {createPatient.error.message}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={createPatient.isPending}
              style={{ width: "100%", justifyContent: "center", padding: "14px", marginTop: "8px" }}
            >
              {createPatient.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Plus size={16} /> Add patient
                </>
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
