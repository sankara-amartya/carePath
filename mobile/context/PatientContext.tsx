import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { trpc } from '../trpc/client';

type PatientContextType = {
  patientId: string | null;
  setPatientId: (id: string) => void;
  isLoading: boolean;
};

const PatientContext = createContext<PatientContextType>({
  patientId: null,
  setPatientId: () => {},
  isLoading: true,
});

const STORAGE_KEY = 'carepath_patient_id';

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patientId, setPatientIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fetch patient list if no stored ID
  const { data: patients } = trpc.patients.listForUser.useQuery(undefined, {
    enabled: !patientId && !isLoading,
  });

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored) setPatientIdState(stored);
      setIsLoading(false);
    });
  }, []);

  // Auto-select first patient if none stored
  useEffect(() => {
    if (!patientId && patients && patients.length > 0) {
      setPatientId(patients[0].id);
    }
  }, [patients, patientId]);

  const setPatientId = (id: string) => {
    SecureStore.setItemAsync(STORAGE_KEY, id);
    setPatientIdState(id);
  };

  return (
    <PatientContext.Provider value={{ patientId, setPatientId, isLoading }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  return useContext(PatientContext);
}
