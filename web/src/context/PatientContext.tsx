"use client";

/**
 * PatientContext — stores the "currently viewed patient" ID across all pages.
 *
 * WHY: Every tRPC call (medications.list, healthChecks.latest, etc.) needs a
 * patientId. Rather than passing it as a prop through every component, we store
 * it in a React context so any page can read it with usePatient().
 *
 * HOW IT WORKS:
 *  - On first load we check localStorage for a saved patientId.
 *  - When a patient is selected (e.g. via onboarding or patient switcher),
 *    we call setPatientId() which saves to localStorage so it persists on refresh.
 *  - The Sidebar shows the current patient name.
 *
 * In a multi-patient production setup you'd fetch the list from the DB.
 * For now, we seed with a hardcoded demo patient ID that matches your Neon DB.
 */

import React, { createContext, useContext, useState } from "react";

type PatientContextType = {
  patientId: string | null;
  setPatientId: (id: string) => void;
};

const PatientContext = createContext<PatientContextType>({
  patientId: null,
  setPatientId: () => {},
});

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patientId, setPatientIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("carepath_patient_id") ?? null;
    }
    return null;
  });

  const setPatientId = (id: string) => {
    localStorage.setItem("carepath_patient_id", id);
    setPatientIdState(id);
  };

  return (
    <PatientContext.Provider value={{ patientId, setPatientId }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  return useContext(PatientContext);
}
