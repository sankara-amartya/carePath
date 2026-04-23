"use client";

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Camera, X } from 'lucide-react';
import { usePermissions, Action } from '@/hooks/usePermissions';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: 'Done' | 'Due' | 'Missed' | 'Scheduled';
};

const MOCK_MEDS: Medication[] = [
  { id: '1', name: 'Metformin', dosage: '500mg', time: '8:00 AM', status: 'Done' },
  { id: '2', name: 'Lisinopril', dosage: '10mg', time: '12:00 PM', status: 'Due' },
  { id: '3', name: 'Atorvastatin', dosage: '20mg', time: '8:00 PM', status: 'Scheduled' },
];

export default function MedicationsPage() {
  const { can } = usePermissions();
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  const [open, setOpen] = useState(false);

  const handleLogClick = (med: Medication) => {
    setSelectedMed(med);
    setOpen(true);
  };

  const closeBottomSheet = () => {
    setOpen(false);
    setTimeout(() => setSelectedMed(null), 300);
  };

  return (
    <div style={{ padding: '1.5rem', paddingBottom: '6rem', minHeight: '100vh' }}>
      <h1 className="sec-title" style={{ marginBottom: '1.5rem' }}>Today's medications</h1>

      {MOCK_MEDS.map((med) => {
        let badgeClass = 'badge-gray';
        if (med.status === 'Done') badgeClass = 'badge-mint';
        if (med.status === 'Due') badgeClass = 'badge-gold';
        if (med.status === 'Missed') badgeClass = 'badge-red';

        return (
          <div key={med.id} className="card-feat" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>{med.name} {med.dosage}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--muted)' }}>Scheduled: {med.time}</p>
              <span className={`badge ${badgeClass}`}>{med.status}</span>
            </div>

            {can(Action.LOG_MEDICATION) && med.status !== 'Done' && (
              <button className="btn-ghost" onClick={() => handleLogClick(med)}>
                Log dose
              </button>
            )}
          </div>
        );
      })}

      {can(Action.EDIT_MEDICATIONS) && (
        <button style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          backgroundColor: 'var(--mint)',
          border: 'none',
          color: 'var(--ink)',
          fontSize: '28px',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          zIndex: 40
        }}>
          +
        </button>
      )}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            animation: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)'
          }} />
          <Dialog.Content style={{
            backgroundColor: 'var(--ink2)',
            borderTopLeftRadius: 'var(--radius)',
            borderTopRightRadius: 'var(--radius)',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1.5rem',
            paddingBottom: '3rem',
            zIndex: 101,
            animation: 'contentShow 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            outline: 'none'
          }}>
            <Dialog.Title style={{ margin: '0 0 1.5rem', fontSize: '24px', fontFamily: 'var(--font-dm-serif)' }}>
              {selectedMed?.name} {selectedMed?.dosage}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </Dialog.Close>

            <div style={{ backgroundColor: 'rgba(201,148,58,0.1)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(201,148,58,0.3)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              {can(Action.VERIFY_PILL_PHOTO) ? (
                <button className="b4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={16} />
                  Take photo to verify
                </button>
              ) : (
                <span style={{ color: 'var(--gold)', fontSize: '13px' }}>AI verification disabled</span>
              )}
            </div>

            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '14px', width: '100%', padding: '12px 0', marginBottom: '1rem', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)' }}>
              Taken without photo
            </button>

            <input type="text" className="inp" placeholder="Add notes (optional)" style={{ marginBottom: '1.5rem' }} />

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }} onClick={closeBottomSheet}>
              Log dose taken
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <style>{`
        @keyframes overlayShow {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes contentShow {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
