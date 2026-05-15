"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { usePatient } from '@/context/PatientContext';
import { Heart, Shield, Users, Loader2, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { setPatientId } = usePatient();
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [conditions, setConditions] = useState('');
  const [contact, setContact] = useState('');

  // Check if user already has patients (handle stuck state)
  const { data: existingPatients, isLoading: checkingExisting } = trpc.patients.listForUser.useQuery(
    undefined,
    { enabled: isLoaded === true }
  );

  // If user already has patients, auto-redirect to dashboard
  useEffect(() => {
    if (existingPatients && existingPatients.length > 0) {
      setPatientId(existingPatients[0].id);
      router.replace('/');
    }
  }, [existingPatients, setPatientId, router]);

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: async (data) => {
      setPatientId(data.id);
      try {
        if (user) await user.reload();
      } catch {
        // Non-critical — PatientContext will handle patient selection
      }
      router.push('/');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dob) return;
    
    createPatient.mutate({
      name,
      dateOfBirth: new Date(dob).toISOString(),
      conditions: conditions.split(',').map(c => c.trim()).filter(Boolean),
      emergencyContact: contact || undefined,
    });
  };

  if (!isLoaded || checkingExisting) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ink)' }}>
        <Loader2 size={32} className="animate-spin" color="var(--mint)" />
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-glow" />

      <div className="onboarding-container">
        {/* Left: Branding */}
        <div className="onboarding-hero">
          <div className="onboarding-logo">
            <Heart size={28} color="var(--mint)" />
          </div>
          <h1 className="onboarding-title">
            Welcome to<br /><em>CarePath</em>
          </h1>
          <p className="onboarding-subtitle">
            Set up a care profile for the person you&apos;re looking after. You&apos;ll become their Primary Caregiver.
          </p>

          <div className="onboarding-features">
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon" style={{ background: 'rgba(93,202,165,0.12)' }}>
                <Heart size={16} color="var(--mint)" />
              </div>
              <div>
                <div className="onboarding-feature-title">Track health daily</div>
                <div className="onboarding-feature-desc">Log vitals, mood, and pain levels with simple check-ins</div>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon" style={{ background: 'rgba(201,148,58,0.12)' }}>
                <Shield size={16} color="var(--gold)" />
              </div>
              <div>
                <div className="onboarding-feature-title">Medication management</div>
                <div className="onboarding-feature-desc">Never miss a dose with scheduling and photo verification</div>
              </div>
            </div>
            <div className="onboarding-feature">
              <div className="onboarding-feature-icon" style={{ background: 'rgba(93,202,165,0.12)' }}>
                <Users size={16} color="var(--mint)" />
              </div>
              <div>
                <div className="onboarding-feature-title">Care team coordination</div>
                <div className="onboarding-feature-desc">Invite family, doctors, and caregivers to collaborate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="onboarding-form-wrap">
          <form onSubmit={handleSubmit} className="onboarding-form">
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '22px', marginBottom: '4px' }}>
              Patient details
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.5 }}>
              You can add more patients later from the sidebar.
            </p>

            <div className="form-group">
              <label className="form-label">Patient name *</label>
              <input required className="inp" placeholder="e.g. John Smith or 'Mom'" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date of birth *</label>
              <input required type="date" className="inp" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pre-existing conditions</label>
              <input className="inp" placeholder="e.g. Hypertension, Arthritis (comma separated)" value={conditions} onChange={e => setConditions(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency contact</label>
              <input className="inp" placeholder="Name — Phone number" value={contact} onChange={e => setContact(e.target.value)} />
            </div>

            {createPatient.isError && (
              <div className="form-error">{createPatient.error.message}</div>
            )}

            <button type="submit" className="btn-primary" disabled={createPatient.isPending}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px', fontSize: '14px' }}>
              {createPatient.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Creating profile…</>
              ) : (
                <>Get started <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
