import { useUser } from '@clerk/nextjs';

export enum Role {
  PRIMARY_CAREGIVER = 'PRIMARY_CAREGIVER',
  SECONDARY_CAREGIVER = 'SECONDARY_CAREGIVER',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN'
}

export enum Action {
  LOG_MEDICATION = 'LOG_MEDICATION',
  EDIT_MEDICATIONS = 'EDIT_MEDICATIONS',
  MANAGE_TEAM = 'MANAGE_TEAM',
  GENERATE_AI_SUMMARY = 'GENERATE_AI_SUMMARY',
  VIEW_HEALTH_TIMELINE = 'VIEW_HEALTH_TIMELINE',
  VERIFY_PILL_PHOTO = 'VERIFY_PILL_PHOTO',
  VOICE_JOURNAL = 'VOICE_JOURNAL',
  RESOLVE_ALERTS = 'RESOLVE_ALERTS',
  DOWNLOAD_APPT_BRIEF = 'DOWNLOAD_APPT_BRIEF'
}

export const PERMISSIONS: Record<Role, Set<Action>> = {
  [Role.PRIMARY_CAREGIVER]: new Set(Object.values(Action)),
  [Role.SECONDARY_CAREGIVER]: new Set([Action.LOG_MEDICATION, Action.VERIFY_PILL_PHOTO, Action.VOICE_JOURNAL, Action.VIEW_HEALTH_TIMELINE, Action.RESOLVE_ALERTS]),
  [Role.DOCTOR]: new Set([Action.VIEW_HEALTH_TIMELINE, Action.DOWNLOAD_APPT_BRIEF]),
  [Role.PATIENT]: new Set([Action.VIEW_HEALTH_TIMELINE]),
  [Role.AGENCY_ADMIN]: new Set([Action.VIEW_HEALTH_TIMELINE, Action.MANAGE_TEAM]),
  [Role.PLATFORM_ADMIN]: new Set(Object.values(Action)),
};

export const canDo = (role: Role, action: Action): boolean => {
  return PERMISSIONS[role]?.has(action) ?? false;
};

export function usePermissions() {
  const { user, isLoaded } = useUser();
  
  // For development, defaulting to PRIMARY_CAREGIVER
  // In real app: const userRole = (user?.publicMetadata?.role as Role) || Role.PRIMARY_CAREGIVER;
  const userRole = Role.PRIMARY_CAREGIVER;

  const can = (action: Action): boolean => {
    if (!isLoaded) return false;
    return canDo(userRole, action);
  };

  return { can, role: userRole, isLoaded };
}
