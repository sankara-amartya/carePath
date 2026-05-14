"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc';
import { usePatient } from '@/context/PatientContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { setPatientId } = usePatient();
  const router = useRouter();
  const pathname = usePathname();

  const role = user?.publicMetadata?.role as string | undefined;
  const isAdmin = role === 'PLATFORM_ADMIN';
  const isAdminPage = pathname.startsWith('/admin');

  // Check if user already has patients (recovery for stuck onboarding)
  const { data: existingPatientsData, isLoading: patientsLoading } = trpc.patients.listForUser.useQuery(
    undefined,
    { enabled: isLoaded === true && isSignedIn === true && !isAdmin }
  );
  const existingPatients = Array.isArray(existingPatientsData) ? existingPatientsData : [];

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // ── Platform Admin routing ───────────────────────────────────────────
    if (isAdmin) {
      // If admin is NOT on an admin page → redirect to /admin
      if (!isAdminPage && pathname !== '/sign-in' && pathname !== '/sign-up') {
        router.replace('/admin');
      }
      return;
    }

    // ── Non-admin on /admin → kick to dashboard ─────────────────────────
    if (isAdminPage) {
      router.replace('/');
      return;
    }

    if (patientsLoading) return;

    const hasRole = !!role;
    const isOnboardingPage = pathname === '/onboarding';
    const hasPatients = existingPatients.length > 0;

    if (!hasRole && hasPatients && isOnboardingPage) {
      setPatientId(existingPatients[0].id);
      router.replace('/');
    } else if (!hasRole && !hasPatients && !isOnboardingPage) {
      router.replace('/onboarding');
    } else if (hasRole && isOnboardingPage) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, user, pathname, router, patientsLoading, existingPatients, setPatientId, isAdmin, isAdminPage, role]);

  if (!isLoaded) return null;

  // Admin users skip patient loading
  if (isAdmin) {
    // Non-admin pages: redirect is in progress
    if (!isAdminPage && pathname !== '/sign-in' && pathname !== '/sign-up') return null;
    return <>{children}</>;
  }

  if (patientsLoading) return null;

  const hasRole = !!user?.publicMetadata?.role;
  const isOnboardingPage = pathname === '/onboarding';
  const hasPatients = existingPatients && existingPatients.length > 0;

  if (isSignedIn && !hasRole && !hasPatients && !isOnboardingPage) {
    return null;
  }

  return <>{children}</>;
}
