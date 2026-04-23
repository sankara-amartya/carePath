"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { usePermissions, Action } from '@/hooks/usePermissions';

export default function SummaryScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summaryText, setSummaryText] = useState("");

  useEffect(() => {
    if (loading) {
      let text = "Dad has generally been adhering to his medication schedule, but we noticed a slight increase in reported pain levels on Thursday and Friday. His appetite remains stable, though his energy levels dropped slightly over the weekend. Overall, vitals are within normal range.";
      let idx = 0;
      
      const interval = setInterval(() => {
        if (idx < text.length) {
          setSummaryText(prev => prev + text[idx]);
          idx++;
        } else {
          setLoading(false);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  }, [loading]);

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

  const handleShare = () => {
    window.location.href = 'mailto:doctor@hospital.com?subject=Weekly Summary&body=' + encodeURIComponent(summaryText);
  };

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', marginRight: '1rem' }}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="sec-title" style={{ margin: 0 }}>Weekly summary</h1>
        </div>
        <button className="b3">Generate</button>
      </div>

      <div style={{ padding: '0 1.5rem' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '16px', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>Apr 14 – Apr 21</span>
        </div>

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
          {loading && summaryText.length === 0 ? (
            <div className="shimmer-wrapper">
              <div className="shimmer-line" style={{ width: '100%' }} />
              <div className="shimmer-line" style={{ width: '85%' }} />
              <div className="shimmer-line" style={{ width: '60%' }} />
            </div>
          ) : (
            <p style={{ fontSize: '14px', lineHeight: '22px', margin: 0 }}>
              {summaryText}
              {loading && <span style={{ color: 'var(--mint)' }}>|</span>}
            </p>
          )}
        </div>

        <button onClick={handleShare} className="b4" style={{ width: '100%', padding: '16px', marginBottom: '2rem', display: 'block', textAlign: 'center' }}>
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
      `}</style>
    </div>
  );
}
