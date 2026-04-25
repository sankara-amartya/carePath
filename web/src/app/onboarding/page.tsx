"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { usePatient } from '@/context/PatientContext';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { setPatientId } = usePatient();
  
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [conditions, setConditions] = useState('');
  const [contact, setContact] = useState('');

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: async (data) => {
      // 1. Set the newly created patient as the active patient in localStorage/Context
      setPatientId(data.id);
      
      // 2. Reload the Clerk user session so the frontend gets the new publicMetadata.role
      if (user) {
        await user.reload();
      }
      
      // 3. Redirect to the dashboard home
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

  if (!isLoaded) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--ink)' }}>
      <div style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>
          Welcome to CarePath
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.5' }}>
          Let's set up a care profile for the person you are looking after. You will automatically become the Primary Caregiver.
        </p>

        <form onSubmit={handleSubmit} className="card-feat" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-on-dark)' }}>
              Patient Name *
            </label>
            <input 
              required
              className="inp" 
              placeholder="e.g. John Smith or 'Dad'" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-on-dark)' }}>
              Date of Birth *
            </label>
            <input 
              required
              type="date"
              className="inp" 
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-on-dark)' }}>
              Pre-existing Conditions (Optional)
            </label>
            <input 
              className="inp" 
              placeholder="e.g. Hypertension, Arthritis (comma separated)" 
              value={conditions}
              onChange={e => setConditions(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-on-dark)' }}>
              Emergency Contact (Optional)
            </label>
            <input 
              className="inp" 
              placeholder="Name and Phone Number" 
              value={contact}
              onChange={e => setContact(e.target.value)}
            />
          </div>

          {createPatient.isError && (
            <p style={{ color: 'var(--alert)', fontSize: '13px', marginBottom: '1rem' }}>
              {createPatient.error.message}
            </p>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={createPatient.isPending}
            style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
          >
            {createPatient.isPending ? 'Creating profile...' : 'Create Patient Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
