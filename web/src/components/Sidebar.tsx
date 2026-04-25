"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Home, Pill, Book, Users, FileText, Activity, BookOpen, Menu, Plus, ChevronDown, LogOut } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { usePatient } from '@/context/PatientContext';
import { AddPatientDialog } from '@/components/AddPatientDialog';
import { useClerk } from '@clerk/nextjs';

const PATIENT_COLORS = [
  'linear-gradient(135deg, #5DCAA5, #2A9060)',
  'linear-gradient(135deg, #C9943A, #9A6F2A)',
  'linear-gradient(135deg, #7A9480, #4A6A50)',
  'linear-gradient(135deg, #E07070, #B04040)',
  'linear-gradient(135deg, #8B7EC8, #5C4FA0)',
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getAge(dob: Date | string) {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
  return age;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { patientId, setPatientId } = usePatient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);

  const { data: patientsData } = trpc.patients.listForUser.useQuery();
  const patients = Array.isArray(patientsData) ? patientsData : [];
  const currentPatient = patients.find(p => p.id === patientId);

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/medications', label: 'Medications', icon: Pill },
    { href: '/checkin', label: 'Health Check-in', icon: Activity },
    { href: '/summary', label: 'AI Summary', icon: FileText },
    { href: '/journal', label: 'Journal', icon: Book },
    { href: '/team', label: 'Care Team', icon: Users },
    { href: '/manual', label: 'User Manual', icon: BookOpen },
  ];

  return (
    <>
      <div className="desktop-sidebar" style={{
        width: isCollapsed ? '76px' : '260px',
        backgroundColor: 'var(--ink2)',
        borderRight: '0.5px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: isCollapsed ? '20px 10px' : '20px 14px',
        position: 'sticky',
        top: 0,
        transition: 'width 0.3s ease, padding 0.3s ease',
        zIndex: 30,
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          marginBottom: '20px',
          padding: '0 4px',
        }}>
          {!isCollapsed && (
            <h2 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '22px', color: 'var(--text-on-dark)', margin: 0, whiteSpace: 'nowrap' }}>
              Care<span style={{ color: 'var(--mint)' }}>Path</span>
            </h2>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn-icon">
            <Menu size={18} />
          </button>
        </div>

        {/* Patient Switcher */}
        {!isCollapsed && (
          <div className="patient-switcher">
            {patients.length > 0 ? (
              <>
                {/* Current Patient */}
                <button
                  onClick={() => setShowPatients(!showPatients)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 2px' }}>
                    <div
                      className="patient-avatar"
                      style={{ background: PATIENT_COLORS[0] }}
                    >
                      {currentPatient ? getInitials(currentPatient.name) : '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="patient-name">{currentPatient?.name || 'Select patient'}</div>
                      <div className="patient-meta">
                        {currentPatient ? `${getAge(currentPatient.dateOfBirth)} years old` : 'No patient selected'}
                      </div>
                    </div>
                    <ChevronDown
                      size={14}
                      color="var(--muted)"
                      style={{ transition: 'transform .2s', transform: showPatients ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>
                </button>

                {/* Dropdown */}
                {showPatients && (
                  <div style={{ marginTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    {patients.map((p, i) => (
                      <div
                        key={p.id}
                        className={`patient-item ${p.id === patientId ? 'active' : ''}`}
                        onClick={() => { setPatientId(p.id); setShowPatients(false); }}
                      >
                        <div className="patient-avatar" style={{ background: PATIENT_COLORS[i % PATIENT_COLORS.length], width: '28px', height: '28px', fontSize: '10px' }}>
                          {getInitials(p.name)}
                        </div>
                        <div>
                          <div className="patient-name" style={{ fontSize: '12px' }}>{p.name}</div>
                          <div className="patient-meta">{getAge(p.dateOfBirth)} yrs</div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => { setAddPatientOpen(true); setShowPatients(false); }}
                      className="patient-item"
                      style={{ width: '100%', background: 'none', border: 'none', color: 'var(--mint)', cursor: 'pointer', marginTop: '4px' }}
                    >
                      <div style={{ width: '28px', height: '28px', borderRadius: '10px', background: 'rgba(93,202,165,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} color="var(--mint)" />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Add patient</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* No patients yet — show prominent Add button */
              <button
                onClick={() => setAddPatientOpen(true)}
                style={{
                  width: '100%',
                  background: 'rgba(93,202,165,0.08)',
                  border: '1px dashed rgba(93,202,165,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px',
                  cursor: 'pointer',
                  color: 'var(--mint)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all .2s ease',
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(93,202,165,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={16} color="var(--mint)" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Add a patient</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Get started by adding someone</div>
                </div>
              </button>
            )}
          </div>
        )}

        {isCollapsed && currentPatient && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className="patient-avatar" style={{ background: PATIENT_COLORS[0], width: '38px', height: '38px', fontSize: '13px' }}>
              {getInitials(currentPatient.name)}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {links.map(l => {
            const Icon = l.icon;
            const isActive = pathname === l.href;

            return (
              <Link href={l.href} key={l.href} title={isCollapsed ? l.label : undefined} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'var(--muted)',
                backgroundColor: isActive ? 'rgba(93,202,165,0.12)' : 'transparent',
                padding: isCollapsed ? '11px' : '10px 14px',
                borderRadius: 'var(--radius-sm)',
                gap: isCollapsed ? '0' : '12px',
                transition: 'all .2s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '20px',
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--mint)',
                  }} />
                )}
                <Icon size={19} style={{ flexShrink: 0, color: isActive ? 'var(--mint)' : undefined }} />
                {!isCollapsed && (
                  <span style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-dm-sans), sans-serif',
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {l.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile at bottom */}
        <div style={{
          padding: '12px 4px',
          marginTop: 'auto',
          borderTop: '0.5px solid rgba(255,255,255,0.05)',
        }}>
          {!isCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--sage), var(--ink3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: 'var(--mint)', flexShrink: 0,
              }}>
                {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Caregiver</div>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-icon"
                title="Sign out"
                style={{ width: '28px', height: '28px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => signOut()} className="btn-icon" title="Sign out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <AddPatientDialog open={addPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
