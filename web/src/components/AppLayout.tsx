"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Nav from "@/components/Nav"; // the mobile nav
import { OnboardingGuard } from "@/components/OnboardingGuard";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Do not show the sidebar/nav on onboarding or auth pages
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isOnboarding = pathname === "/onboarding";
  const hideNavigation = isAuthPage || isOnboarding;

  return (
    <OnboardingGuard>
      <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
        {!hideNavigation && <Sidebar />}
        <main style={{ flex: 1, position: "relative", overflowX: "hidden" }}>
          {children}
          {!hideNavigation && <Nav />}
        </main>
      </div>
    </OnboardingGuard>
  );
}
