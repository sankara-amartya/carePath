"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, Send, Sparkles } from 'lucide-react';
import { usePermissions, Action } from '@/hooks/usePermissions';
import { usePatient } from '@/context/PatientContext';
import { trpc } from '@/lib/trpc';

export default function SummaryScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const { patientId } = usePatient();

  const { data: patient } = trpc.patients.get.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: latestSummary, isLoading, refetch } = trpc.aiSummaries.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: medications } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs } = trpc.medicationLogs.today.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: recentCheckins } = trpc.healthChecks.list.useQuery(
    { patientId: patientId!, days: 7 },
    { enabled: !!patientId }
  );

  const generateMutation = trpc.aiSummaries.generate.useMutation({
    onSuccess: () => refetch(),
  });

  if (!patientId) {
    return (
      <div className="page-content"><div className="no-patient-banner"><p>No patient selected.</p></div></div>
    );
  }

  if (!can(Action.GENERATE_AI_SUMMARY)) {
    return (
      <div className="page-content" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => router.back()} className="btn-icon"><ArrowLeft size={18} /></button>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '24px', margin: 0 }}>AI Summary</h1>
        </div>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>You don&apos;t have permission to view summaries.</p>
      </div>
    );
  }

  const handleGenerate = () => {
    if (!patientId) return;
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    generateMutation.mutate({
      patientId,
      weekStart: lastWeek.toISOString(),
      weekEnd: now.toISOString(),
    });
  };

  const handleShare = () => {
    if (!latestSummary) return;
    window.location.href = 'mailto:?subject=Weekly Health Summary&body=' + encodeURIComponent(latestSummary.content);
  };

  const isGenerating = generateMutation.isPending;
  const totalMeds = medications?.length || 0;
  const takenMeds = todayLogs?.filter(l => l.status === 'taken').length || 0;
  const adherence = totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0;
  const avgPain = recentCheckins && recentCheckins.length > 0
    ? (recentCheckins.reduce((s, c) => s + c.pain, 0) / recentCheckins.length).toFixed(1)
    : '--';
  const checkinCount = recentCheckins?.length || 0;

  return (
    <div className="page-content" style={{ padding: '24px', paddingBottom: '6rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '24px', margin: '0 0 4px' }}>
            {patient?.name ? `${patient.name}'s summary` : 'AI Summary'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
            AI-generated weekly health report
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={isGenerating}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          {isGenerating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <><Sparkles size={15} /> Generate</>}
        </button>
      </div>

      {/* Date range pill */}
      {latestSummary && (
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>
            {new Date(latestSummary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(latestSummary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="card-stat">
          <div className="stat-val">{adherence}%</div>
          <div className="stat-lbl">Adherence</div>
        </div>
        <div className="card-stat" style={{ background: 'rgba(201,148,58,.05)', borderColor: 'rgba(201,148,58,.1)' }}>
          <div className="stat-val" style={{ color: 'var(--gold)' }}>{avgPain}</div>
          <div className="stat-lbl">Avg pain</div>
        </div>
        <div className="card-stat">
          <div className="stat-val">{checkinCount}<span style={{ fontSize: '16px', color: 'var(--muted)' }}>/7</span></div>
          <div className="stat-lbl">Check-ins</div>
        </div>
        <div className="card-stat">
          <div className="stat-val">{totalMeds}</div>
          <div className="stat-lbl">Medications</div>
        </div>
      </div>

      {/* AI Summary content */}
      <div style={{
        backgroundColor: 'var(--ink2)',
        borderLeft: '3px solid var(--mint)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--mint)', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} /> AI SUMMARY
        </div>
        {(isLoading || isGenerating) ? (
          <div>
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px', width: '100%', animation: 'shimmer 1.2s infinite ease-in-out' }} />
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px', width: '85%', animation: 'shimmer 1.2s infinite ease-in-out' }} />
            <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '60%', animation: 'shimmer 1.2s infinite ease-in-out' }} />
          </div>
        ) : latestSummary ? (
          <div style={{ fontSize: '14px', lineHeight: '24px', whiteSpace: 'pre-wrap' }}>
            {latestSummary.content}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <FileText size={32} color="var(--muted)" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No summary generated yet. Click Generate to create one.</p>
          </div>
        )}
      </div>

      {/* Medication breakdown (real data) */}
      {medications && medications.length > 0 && (
        <div className="card-feat" style={{ marginBottom: '16px', padding: '16px 20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Medications</h3>
          {medications.map((med) => {
            const taken = todayLogs?.find(l => l.medicationId === med.id && l.status === 'taken');
            return (
              <p key={med.id} style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: taken ? 'var(--mint)' : 'var(--gold)', flexShrink: 0 }} />
                {med.name} {med.dosage}: {taken ? '✓ Taken today' : 'Pending'}
              </p>
            );
          })}
        </div>
      )}

      {/* Health trends (real data) */}
      {recentCheckins && recentCheckins.length > 0 && (
        <div className="card-feat" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Health trends (7 days)</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 4px' }}>
            • Avg mood: {(recentCheckins.reduce((s, c) => s + c.mood, 0) / recentCheckins.length).toFixed(1)}/5
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 4px' }}>
            • Avg energy: {(recentCheckins.reduce((s, c) => s + c.energy, 0) / recentCheckins.length).toFixed(1)}/5
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            • Avg mobility: {(recentCheckins.reduce((s, c) => s + c.mobility, 0) / recentCheckins.length).toFixed(1)}/5
          </p>
        </div>
      )}

      {/* Share button */}
      <button
        onClick={handleShare}
        className="btn-primary"
        disabled={!latestSummary || isGenerating}
        style={{ width: '100%', justifyContent: 'center', padding: '14px', opacity: (!latestSummary || isGenerating) ? 0.5 : 1 }}
      >
        <Send size={15} /> Share with doctor
      </button>
    </div>
  );
}
