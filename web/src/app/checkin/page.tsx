"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Slider from "@radix-ui/react-slider";
import { Mic, X, CheckCircle, ArrowLeft } from "lucide-react";
import { usePatient } from "@/context/PatientContext";
import { trpc } from "@/lib/trpc";

const SCORE_EMOJI = ["", "😣", "😟", "😐", "🙂", "😊"];
const SCORE_LABELS = ["", "Very low", "Low", "Okay", "Good", "Great"];

export default function CheckInPage() {
  const router = useRouter();
  const { patientId } = usePatient();
  const [pain, setPain] = useState([3]);
  const [mood, setMood] = useState([3]);
  const [appetite, setAppetite] = useState([3]);
  const [mobility, setMobility] = useState([3]);
  const [energy, setEnergy] = useState([3]);
  const [notes, setNotes] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: latest } = trpc.healthChecks.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  useEffect(() => {
    if (latest) {
      setPain([latest.pain]);
      setMood([latest.mood]);
      setAppetite([latest.appetite]);
      setMobility([latest.mobility]);
      setEnergy([latest.energy]);
    }
  }, [latest]);

  const checkinMutation = trpc.healthChecks.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => router.push("/"), 2000);
    },
  });

  const handleSubmit = () => {
    if (!patientId) return;
    checkinMutation.mutate({
      patientId,
      pain: pain[0],
      mood: mood[0],
      appetite: appetite[0],
      mobility: mobility[0],
      energy: energy[0],
      notes: notes || undefined,
    });
  };

  const renderSlider = (
    label: string,
    value: number[],
    setValue: (val: number[]) => void
  ) => {
    const isLow = value[0] < 3;
    const accentColor = isLow ? "var(--gold)" : "var(--mint)";

    return (
      <div className="card-feat" style={{ marginBottom: "12px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "22px" }}>{SCORE_EMOJI[value[0]]}</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: accentColor }}>
              {value[0]}/5
            </span>
          </div>
        </div>
        <Slider.Root
          value={value}
          onValueChange={setValue}
          max={5}
          min={1}
          step={1}
          style={{ position: "relative", display: "flex", alignItems: "center", userSelect: "none", touchAction: "none", height: "24px" }}
        >
          <Slider.Track style={{ backgroundColor: "rgba(255,255,255,0.08)", position: "relative", flexGrow: 1, borderRadius: "9999px", height: "6px" }}>
            <Slider.Range style={{ position: "absolute", backgroundColor: accentColor, borderRadius: "9999px", height: "100%", transition: "background-color 0.3s" }} />
          </Slider.Track>
          <Slider.Thumb
            style={{ display: "block", width: "22px", height: "22px", backgroundColor: accentColor, boxShadow: `0 0 0 3px var(--ink), 0 0 12px ${isLow ? 'rgba(201,148,58,0.3)' : 'rgba(93,202,165,0.3)'}`, borderRadius: "50%", transition: "background-color 0.3s, box-shadow 0.3s" }}
            aria-label={label}
          />
        </Slider.Root>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "10px", color: "var(--muted)" }}>Low</span>
          <span style={{ fontSize: "10px", color: "var(--muted)" }}>{SCORE_LABELS[value[0]]}</span>
          <span style={{ fontSize: "10px", color: "var(--muted)" }}>High</span>
        </div>
      </div>
    );
  };

  if (!patientId) {
    return (
      <div className="page-content"><div className="no-patient-banner"><p>No patient selected.</p></div></div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(93,202,165,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle size={32} color="var(--mint)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "24px", margin: 0 }}>Check-in saved!</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>Returning to dashboard…</p>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: "24px", paddingBottom: "6rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => router.back()} className="btn-icon">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontFamily: "var(--font-dm-serif)", fontSize: "24px", margin: 0 }}>
            How is {patient?.name || 'the patient'} today?
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: "4px 0 0" }}>Rate each area from 1–5</p>
        </div>
      </div>

      {renderSlider("Pain", pain, setPain)}
      {renderSlider("Mood", mood, setMood)}
      {renderSlider("Appetite", appetite, setAppetite)}
      {renderSlider("Mobility", mobility, setMobility)}
      {renderSlider("Energy", energy, setEnergy)}

      {/* Notes */}
      <div className="form-group" style={{ marginTop: "8px" }}>
        <label className="form-label">Notes</label>
        <textarea
          className="inp"
          placeholder="Any observations? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ resize: "none" }}
        />
      </div>

      {/* Voice note */}
      <div className="card-feat" style={{ textAlign: "center", padding: "20px", marginBottom: "20px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 16px" }}>Voice note (optional)</p>
        <button
          onMouseDown={() => setIsRecording(true)}
          onMouseUp={() => setIsRecording(false)}
          onMouseLeave={() => setIsRecording(false)}
          onTouchStart={() => setIsRecording(true)}
          onTouchEnd={() => setIsRecording(false)}
          style={{
            width: "56px", height: "56px", borderRadius: "50%",
            backgroundColor: isRecording ? "rgba(220,80,80,0.15)" : "var(--sage-light)",
            border: "none", display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          {isRecording ? (
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--alert)", animation: "pulse 1.5s infinite" }} />
          ) : (
            <Mic color="var(--ink)" size={22} />
          )}
        </button>
        <p style={{ fontSize: "11px", color: "var(--muted)", margin: "8px 0 0" }}>
          {isRecording ? "Recording… release to stop" : "Hold to record"}
        </p>
      </div>

      {checkinMutation.isError && (
        <div className="form-error" style={{ marginBottom: "12px" }}>
          {checkinMutation.error.message}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="btn-primary"
        disabled={checkinMutation.isPending}
        style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: "14px" }}
      >
        {checkinMutation.isPending ? "Saving…" : "Submit check-in"}
      </button>
    </div>
  );
}
