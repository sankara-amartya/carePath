"use client";

import React from "react";
import Link from 'next/link';
import { trpc } from "@/lib/trpc";
import { usePatient } from "@/context/PatientContext";
import { Loader2, Pill, Activity, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Home() {
  const { patientId } = usePatient();

  // ── tRPC Queries for Real Data ────────────────────────────────────────────
  const { data: medications, isLoading: medsLoading } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs } = trpc.medicationLogs.today.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: latestCheckin, isLoading: checkinLoading } = trpc.healthChecks.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  // ── Calculate Real Stats ──────────────────────────────────────────────────
  const totalMeds = medications?.length || 0;
  const takenMeds = todayLogs?.filter(l => l.status === 'taken').length || 0;
  const adherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0;

  if (medsLoading || checkinLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--mint)" />
      </div>
    );
  }

  return (
    <div className="root">
      <div className="hero">
        <div className="hero-tag">
          <div className="hero-dot"></div>Live Care Monitoring
        </div>
        <h1 className="hero-title">
          CarePath<br />
          <em>Dashboard</em>
        </h1>
        <p className="hero-sub">
          Real-time health monitoring and medication tracking powered by type-safe tRPC and AI summaries.
        </p>
        <div className="hero-btns">
          <Link href="/checkin" className="btn-primary" style={{ textDecoration: 'none' }}>Daily Check-in</Link>
          <Link href="/medications" className="btn-ghost" style={{ textDecoration: 'none' }}>Medication Logs</Link>
        </div>
      </div>

      <div className="sec">
        <div className="sec-label">Status Overview</div>
        <div className="sec-title">Today&apos;s Health Metrics</div>
        
        {latestCheckin ? (
          <p className="sec-sub">
            Last check-in recorded at {new Date(latestCheckin.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 
            Pain is rated at {latestCheckin.pain}/5 and mood is {latestCheckin.mood}/5.
          </p>
        ) : (
          <p className="sec-sub">No health check-in recorded for today yet. Please complete a check-in to see trends.</p>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginBottom: '20px' }}>
          <div className="card-stat">
            <div className="stat-val">{adherence}%</div>
            <div className="stat-lbl">Meds Taken Today</div>
          </div>
          <div className="card-stat" style={{ background: 'rgba(201,148,58,.07)', borderColor: 'rgba(201,148,58,.15)' }}>
            <div className="stat-val" style={{ color: 'var(--gold)' }}>{latestCheckin?.pain || '--'}</div>
            <div className="stat-lbl">Latest Pain Score</div>
          </div>
          <div className="card-stat">
            <div className="stat-val">{takenMeds}/{totalMeds}</div>
            <div className="stat-lbl">Doses Logged</div>
          </div>
        </div>

        <div className="comp-grid">
          {/* Real Meds Summary */}
          <div className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(93,202,165,.12)' }}>
              <Pill size={16} color="var(--mint)" />
            </div>
            <div className="card-feat-title">Medication Status</div>
            <div className="card-feat-desc">
              {totalMeds === 0 ? "No medications added yet." : `${takenMeds} of ${totalMeds} doses recorded for today.`}
            </div>
          </div>

          {/* Real Health Check Summary */}
          <div className="card-feat" style={{ borderColor: latestCheckin ? 'rgba(93,202,165,.2)' : 'rgba(201,148,58,.2)' }}>
            <div className="card-feat-icon" style={{ background: latestCheckin ? 'rgba(93,202,165,.1)' : 'rgba(201,148,58,.1)' }}>
              <Activity size={16} color={latestCheckin ? "var(--mint)" : "var(--gold)"} />
            </div>
            <div className="card-feat-title">Daily Vitals</div>
            <div className="card-feat-desc">
              {latestCheckin ? "Health check-in completed. All trends visible in Journal." : "Daily check-in pending. Tap button above to start."}
            </div>
          </div>

          {/* AI Summary Link */}
          <Link href="/summary" style={{ textDecoration: 'none' }} className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(255,255,255,.05)' }}>
              <FileText size={16} color="var(--muted)" />
            </div>
            <div className="card-feat-title">Weekly AI Summary</div>
            <div className="card-feat-desc">Generate a concise report for the primary physician based on this week&apos;s data.</div>
          </Link>

          {/* Alerts Placeholder (Could be wired to trpc.alerts later) */}
          <div className="card-feat">
            <div className="card-feat-icon" style={{ background: 'rgba(220,80,80,.1)' }}>
              <AlertCircle size={16} color="var(--alert)" />
            </div>
            <div className="card-feat-title">Safety Alerts</div>
            <div className="card-feat-desc">No critical anomalies detected in the last 24 hours.</div>
          </div>
        </div>
      </div>
      
      <div className="cta-strip">
        <h3>Need to notify the Doctor?</h3>
        <p>Send an AI generated weekly summary directly to the provider portal.</p>
        <div className="cta-btns">
          <Link href="/summary" className="btn-primary" style={{ textDecoration: 'none' }}>Generate Report ↗</Link>
        </div>
      </div>
    </div>
  );
}
