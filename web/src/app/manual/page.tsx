"use client";
import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';

export default function ManualPage() {
  return (
    <div style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '8px', 
          backgroundColor: 'rgba(93,202,165,0.1)', color: 'var(--mint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BookOpen size={24} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '32px', margin: 0 }}>User Manual</h1>
      </div>

      <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2.5rem' }}>
        Welcome to your CarePath Dashboard! Here, you can manage daily care tasks, view medication adherence, and review AI-generated weekly health summaries for your loved ones. This manual helps you navigate the features available to your role.
      </p>

      <div style={{ display: 'grid', gap: '16px' }}>
        <ManualSection 
          title="Logging Medications" 
          desc="Navigate to the Medications tab to view scheduled doses. When logging a dose, you may be prompted to use the AI Pill Verification camera to ensure safety." 
        />
        <ManualSection 
          title="Health Check-ins" 
          desc="Use the Daily Check-in to track Pain, Mood, Appetite, Mobility, and Energy. You can adjust the 5-point sliders and even attach a voice note journal." 
        />
        <ManualSection 
          title="AI Weekly Summaries" 
          desc="Available to Primary Caregivers, use this feature to compile 7 days of logs into a detailed summary note ready to share directly with a doctor's portal." 
        />
        <ManualSection 
          title="Managing the Care Team" 
          desc="Invite doctors, secondary caregivers, and family members. As an admin, you can assign unique roles which restrict or grant access to sensitive logs." 
        />
      </div>

    </div>
  );
}

function ManualSection({ title, desc }: { title: string, desc: string }) {
  return (
    <div style={{ 
      backgroundColor: 'var(--ink2)', 
      border: '0.5px solid rgba(255,255,255,0.08)', 
      borderRadius: 'var(--radius)', 
      padding: '24px',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start'
    }}>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-on-dark)', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
      <button style={{ 
        background: 'none', border: 'none', color: 'var(--mint)', 
        cursor: 'pointer', padding: '8px',
        display: 'flex', alignItems: 'center'
      }}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
