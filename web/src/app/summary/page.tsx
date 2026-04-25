"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { usePermissions, Action } from '@/hooks/usePermissions';
import { usePatient } from '@/context/PatientContext';
import { trpc } from '@/lib/trpc';

export default function SummaryScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const { patientId } = usePatient();
  
  // ── tRPC queries ──────────────────────────────────────────────────────────
  const {
    data: latestSummary,
    isLoading,
    refetch
  } = trpc.aiSummaries.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const generateMutation = trpc.aiSummaries.generate.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  if (!patientId) {
    return (
      <div style={{ padding: '1.5rem', minHeight: '100vh' }}>
        <div style={{ backgroundColor: 'rgba(201,148,58,0.1)', border: '1px solid rgba(201,148,58,0.3)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 500, margin: 0 }}>
            No patient selected. Please select a patient from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  if (!can(Action.GENERATE_AI_SUMMARY)) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginRight: '1rem' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="sec-title" style={{ margin: 0 }}>Weekly summary</h1>
        </div>
        <p style={{ color: 'var(--muted)', textAlign: 'center' }}>You don't have permission to view summaries.</p>
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
    window.location.href = 'mailto:doctor@hospital.com?subject=Weekly Summary&body=' + encodeURIComponent(latestSummary.content);
  };

  const isGenerating = generateMutation.isPending;

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginRight: '1rem' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="sec-title" style={{ margin: 0 }}>Weekly summary</h1>
        </div>
        <button 
          className="b3" 
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : "Generate"}
        </button>
      </div>

      <div style={{ padding: '0 1.5rem' }}>
        {latestSummary && (
          <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '16px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>
              {new Date(latestSummary.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(latestSummary.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '1.5rem', paddingBottom: '8px' }}>
          <div className="card-stat" style={{ flexShrink: 0, width: '100px' }}>
            <div className="stat-val">94%</div>
            <div className="stat-lbl">Adherence</div>
          </div>
          <div className="card-stat" style={{ flexShrink: 0, width: '100px' }}>
            <div className="stat-val" style={{ color: 'var(--gold)' }}>3.8</div>
            <div className="stat-lbl">Avg pain</div>
          </div>
          <div className="card-stat" style={{ flexShrink: 0, width: '100px' }}>
            <div className="stat-val">7 / 7</div>
            <div className="stat-lbl">Check-ins</div>
          </div>
          <div className="card-stat" style={{ flexShrink: 0, width: '100px' }}>
            <div className="stat-val" style={{ color: '#E07070' }}>1</div>
            <div className="stat-lbl">Alerts</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--ink2)', borderLeft: '2px solid var(--mint)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--mint)', letterSpacing: '1px', marginBottom: '8px' }}>AI SUMMARY</div>
          {(isLoading || isGenerating) ? (
            <div className="shimmer-wrapper">
              <div className="shimmer-line" style={{ width: '100%' }} />
              <div className="shimmer-line" style={{ width: '85%' }} />
              <div className="shimmer-line" style={{ width: '60%' }} />
            </div>
          ) : latestSummary ? (
            <div style={{ fontSize: '14px', lineHeight: '22px', margin: 0, whiteSpace: 'pre-wrap' }}>
              {latestSummary.content}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>No summary generated yet. Click Generate to create one.</p>
          )}
        </div>

        <button 
          onClick={handleShare} 
          className="b4" 
          disabled={!latestSummary || isGenerating}
          style={{ width: '100%', padding: '16px', marginBottom: '2rem', display: 'block', textAlign: 'center', opacity: (!latestSummary || isGenerating) ? 0.5 : 1 }}
        >
          Share with doctor
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Medications</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 4px 0' }}>• Metformin 500mg: Missed 1 dose (Tue)</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>• Lisinopril 10mg: 100% adherence</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Health trends</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 4px 0' }}>• Pain level increased from 2 to 4</p>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>• Mobility reported as consistently good</p>
        </div>
      </div>
      <style>{`
        .shimmer-line {
          height: 14px;
          background-color: rgba(255,255,255,0.8);
          border-radius: 4px;
          margin-bottom: 8px;
          animation: shimmer 1.2s infinite ease-in-out;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
