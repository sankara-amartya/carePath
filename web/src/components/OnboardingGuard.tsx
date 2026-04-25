"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    // Check if the user has a role assigned in their Clerk publicMetadata
    const hasRole = !!user.publicMetadata?.role;
    const isOnboardingPage = pathname === '/onboarding';

    if (!hasRole && !isOnboardingPage) {
      // Brand new user with no role: Force them to onboarding to create a patient profile
      router.replace('/onboarding');
    } else if (hasRole && isOnboardingPage) {
      // Already onboarded user trying to access onboarding: Send them to dashboard
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, user, pathname, router]);

  // While Clerk is loading, or if they are being redirected, we can just show nothing (or a loader)
  // to prevent a flash of the dashboard before the redirect kicks in.
  if (!isLoaded) return null;

  const hasRole = !!user?.publicMetadata?.role;
  const isOnboardingPage = pathname === '/onboarding';

  // Prevent rendering the dashboard children if they belong on the onboarding page
  if (isSignedIn && !hasRole && !isOnboardingPage) {
    return null; 
  }

  return <>{children}</>;
}
