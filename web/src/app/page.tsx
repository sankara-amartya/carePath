"use client";

import React from "react";
import Link from 'next/link';
import { trpc } from "@/lib/trpc";
import { usePatient } from "@/context/PatientContext";
import { Loader2, Pill, Activity, FileText, AlertCircle, Heart, ArrowRight, Calendar, Phone } from "lucide-react";

function getAge(dob: Date | string) {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

export default function Home() {
  const { patientId } = usePatient();

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

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

  const totalMeds = medications?.length || 0;
  const takenMeds = todayLogs?.filter(l => l.status === 'taken').length || 0;
  const adherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0;

  if (!patientId) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="no-patient-banner" style={{ maxWidth: 400 }}>
          <p>Select a patient from the sidebar to get started.</p>
        </div>
      </div>
    );
  }

  if (medsLoading || checkinLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={32} color="var(--mint)" />
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: '24px' }}>
      {/* Patient Info Header */}
      {patient && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(93,202,165,0.06) 0%, rgba(29,106,69,0.04) 100%)',
          border: '0.5px solid rgba(93,202,165,0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #5DCAA5, #2A9060)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: 'var(--ink)', flexShrink: 0,
            }}>
              {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '28px', margin: '0 0 4px', lineHeight: 1.2 }}>
                {patient.name}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                  <Calendar size={14} /> {getAge(patient.dateOfBirth)} years old
                </span>
                {patient.emergencyContact && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted)' }}>
                    <Phone size={14} /> {patient.emergencyContact}
                  </span>
                )}
              </div>
              {patient.conditions && patient.conditions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {patient.conditions.map((c: string, i: number) => (
                    <span key={i} className="badge badge-gold">{c}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <Link href="/checkin" className="btn-primary" style={{ textDecoration: 'none' }}>
                <Heart size={15} /> Check-in
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card-stat">
          <div className="stat-val">{adherence}%</div>
          <div className="stat-lbl">Medication adherence</div>
        </div>
        <div className="card-stat" style={{ background: 'rgba(201,148,58,.05)', borderColor: 'rgba(201,148,58,.1)' }}>
          <div className="stat-val" style={{ color: 'var(--gold)' }}>{latestCheckin?.pain || '--'}<span style={{ fontSize: '16px', color: 'var(--muted)' }}>/5</span></div>
          <div className="stat-lbl">Pain score</div>
        </div>
        <div className="card-stat">
          <div className="stat-val">{latestCheckin?.mood || '--'}<span style={{ fontSize: '16px', color: 'var(--muted)' }}>/5</span></div>
          <div className="stat-lbl">Mood today</div>
        </div>
        <div className="card-stat">
          <div className="stat-val">{takenMeds}<span style={{ fontSize: '16px', color: 'var(--muted)' }}>/{totalMeds}</span></div>
          <div className="stat-lbl">Doses logged</div>
        </div>
      </div>

      {/* Status text */}
      {latestCheckin ? (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
          Last check-in at {new Date(latestCheckin.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —
          Energy {latestCheckin.energy}/5, Mobility {latestCheckin.mobility}/5
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
          No check-in recorded today. Complete one to track health trends.
        </p>
      )}

      {/* Feature Cards Grid */}
      <div className="comp-grid" style={{ marginBottom: '24px' }}>
        <Link href="/medications" style={{ textDecoration: 'none' }} className="card-feat">
          <div className="card-feat-icon" style={{ background: 'rgba(93,202,165,.1)' }}>
            <Pill size={18} color="var(--mint)" />
          </div>
          <div className="card-feat-title">Medications</div>
          <div className="card-feat-desc">
            {totalMeds === 0 ? "No medications added yet." : `${takenMeds} of ${totalMeds} doses recorded today.`}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--mint)', fontWeight: 500 }}>
            View all <ArrowRight size={12} />
          </div>
        </Link>

        <Link href="/checkin" style={{ textDecoration: 'none' }} className="card-feat">
          <div className="card-feat-icon" style={{ background: latestCheckin ? 'rgba(93,202,165,.1)' : 'rgba(201,148,58,.1)' }}>
            <Activity size={18} color={latestCheckin ? "var(--mint)" : "var(--gold)"} />
          </div>
          <div className="card-feat-title">Daily vitals</div>
          <div className="card-feat-desc">
            {latestCheckin ? "Check-in completed. Trends visible in journal." : "No check-in yet. Tap to start."}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--mint)', fontWeight: 500 }}>
            {latestCheckin ? 'Update' : 'Start check-in'} <ArrowRight size={12} />
          </div>
        </Link>

        <Link href="/summary" style={{ textDecoration: 'none' }} className="card-feat">
          <div className="card-feat-icon" style={{ background: 'rgba(255,255,255,.04)' }}>
            <FileText size={18} color="var(--muted)" />
          </div>
          <div className="card-feat-title">AI summary</div>
          <div className="card-feat-desc">Generate a weekly report for the physician with AI insights.</div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--mint)', fontWeight: 500 }}>
            Generate <ArrowRight size={12} />
          </div>
        </Link>

        <div className="card-feat">
          <div className="card-feat-icon" style={{ background: 'rgba(220,80,80,.08)' }}>
            <AlertCircle size={18} color="var(--alert)" />
          </div>
          <div className="card-feat-title">Safety alerts</div>
          <div className="card-feat-desc">No critical anomalies in the last 24 hours.</div>
          <div style={{ marginTop: '12px' }}>
            <span className="badge badge-mint">All clear</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-strip">
        <h3>Share with the doctor</h3>
        <p>Send an AI-generated summary directly to the care provider.</p>
        <div className="cta-btns">
          <Link href="/summary" className="btn-primary" style={{ textDecoration: 'none' }}>
            Generate report <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
