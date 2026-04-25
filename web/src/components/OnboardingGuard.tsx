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

  // Check if user already has patients (recovery for stuck onboarding)
  const { data: existingPatientsData, isLoading: patientsLoading } = trpc.patients.listForUser.useQuery(
    undefined,
    { enabled: isLoaded === true && isSignedIn === true }
  );
  const existingPatients = Array.isArray(existingPatientsData) ? existingPatientsData : [];

  useEffect(() => {
    if (!isLoaded || !isSignedIn || patientsLoading) return;

    const hasRole = !!user.publicMetadata?.role;
    const isOnboardingPage = pathname === '/onboarding';
    const hasPatients = existingPatients.length > 0;

    if (!hasRole && hasPatients && isOnboardingPage) {
      // Recovery: patient was created but Clerk metadata failed to update.
      // Auto-select the first patient and go to dashboard.
      setPatientId(existingPatients[0].id);
      router.replace('/');
    } else if (!hasRole && !hasPatients && !isOnboardingPage) {
      // Brand new user with no role and no patients → onboarding
      router.replace('/onboarding');
    } else if (hasRole && isOnboardingPage) {
      // Already onboarded user trying to access onboarding → dashboard
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, user, pathname, router, patientsLoading, existingPatients, setPatientId]);

  if (!isLoaded || patientsLoading) return null;

  const hasRole = !!user?.publicMetadata?.role;
  const isOnboardingPage = pathname === '/onboarding';
  const hasPatients = existingPatients && existingPatients.length > 0;

  // Prevent rendering dashboard if user needs onboarding
  if (isSignedIn && !hasRole && !hasPatients && !isOnboardingPage) {
    return null;
  }

  return <>{children}</>;
}
