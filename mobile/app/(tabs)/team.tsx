import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, border } from '../../theme';
import { usePermissions, Action } from '../../hooks/usePermissions';
import { trpc } from '../../trpc/client';
import { usePatient } from '../../context/PatientContext';

const ROLE_COLORS: Record<string, string> = {
  PRIMARY_CAREGIVER: colors.mint,
  SECONDARY_CAREGIVER: colors.sageLight,
  DOCTOR: colors.gold,
  PATIENT: colors.textOnDark,
  AGENCY_ADMIN: colors.warm,
  PLATFORM_ADMIN: colors.mint,
};

const ROLE_LABELS: Record<string, string> = {
  PRIMARY_CAREGIVER: 'Primary Caregiver',
  SECONDARY_CAREGIVER: 'Secondary Caregiver',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
  AGENCY_ADMIN: 'Agency Admin',
  PLATFORM_ADMIN: 'Platform Admin',
};

const ROLES = ['PRIMARY_CAREGIVER', 'SECONDARY_CAREGIVER', 'DOCTOR', 'PATIENT', 'AGENCY_ADMIN'] as const;

export default function TeamScreen() {
  const { can } = usePermissions();
  const { patientId } = usePatient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('SECONDARY_CAREGIVER');

  const utils = trpc.useUtils();

  const { data: members, isLoading } = trpc.careTeam.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const inviteMutation = trpc.careTeam.invite.useMutation({
    onSuccess: () => {
      utils.careTeam.list.invalidate();
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('SECONDARY_CAREGIVER');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const removeMutation = trpc.careTeam.remove.useMutation({
    onSuccess: () => utils.careTeam.list.invalidate(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleInvite = () => {
    if (!patientId || !inviteEmail.trim()) return;
    inviteMutation.mutate({
      patientId: patientId!,
      email: inviteEmail.trim(),
      role: inviteRole as any,
    });
  };

  const handleRemove = (memberId: string, name: string) => {
    Alert.alert('Remove member', `Remove ${name} from the care team?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate({ memberId }) },
    ]);
  };

  if (!patientId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={[styles.title, { textAlign: 'center', marginTop: spacing.xl }]}>No patient selected</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Care team</Text>
        {can(Action.MANAGE_TEAM) && (
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(true)}>
            <Text style={styles.inviteBtnText}>+ Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator color={colors.mint} style={{ marginVertical: 40 }} />
        ) : members && members.length > 0 ? (
          members.map((member) => {
            const roleColor = ROLE_COLORS[member.role] ?? colors.muted;
            const roleLabel = ROLE_LABELS[member.role] ?? member.role;
            const name = member.user?.name ?? member.user?.email ?? 'Unknown';
            const email = member.user?.email ?? '';
            const initials = name.charAt(0).toUpperCase();

            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberRow}>
                  <View style={[styles.memberAvatar, { borderColor: roleColor }]}>
                    <Text style={[styles.memberInitial, { color: roleColor }]}>{initials}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{name}</Text>
                    {email ? <Text style={styles.memberEmail}>{email}</Text> : null}
                    <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                      <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
                    </View>
                  </View>
                  {can(Action.MANAGE_TEAM) && member.role !== 'PRIMARY_CAREGIVER' && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(member.id, name)}>
                      <Text style={styles.removeBtnText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No team members yet</Text>
            <Text style={styles.emptyDesc}>
              Invite caregivers, doctors, or family members to collaborate on care.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal visible={showInvite} transparent animationType="slide" onRequestClose={() => setShowInvite(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowInvite(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Invite to care team</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.muted}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleList}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, inviteRole === role && styles.roleOptionActive]}
                  onPress={() => setInviteRole(role)}
                >
                  <Text style={[styles.roleOptionText, inviteRole === role && { color: colors.mint }]}>
                    {ROLE_LABELS[role]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, inviteMutation.isPending && { opacity: 0.6 }]}
              onPress={handleInvite}
              disabled={inviteMutation.isPending}
            >
              <Text style={styles.submitBtnText}>{inviteMutation.isPending ? 'Inviting...' : 'Send invite'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: colors.textOnDark,
  },
  inviteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(93,202,165,.15)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,.3)',
  },
  inviteBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.mint,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  memberCard: {
    backgroundColor: colors.ink2,
    borderRadius: border.radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.04)',
    marginRight: spacing.md,
  },
  memberInitial: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.textOnDark,
    marginBottom: 2,
  },
  memberEmail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(224,112,112,.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 20,
    color: colors.alert,
    marginTop: -2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: colors.textOnDark,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.ink2,
    borderTopLeftRadius: border.radiusLg,
    borderTopRightRadius: border.radiusLg,
    padding: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  sheetTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: colors.textOnDark,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
    color: colors.textOnDark,
    borderRadius: border.radiusSm,
    padding: spacing.md,
    fontFamily: 'DMSans_400Regular',
    marginBottom: spacing.md,
  },
  roleLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  roleList: {
    marginBottom: spacing.lg,
  },
  roleOption: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: border.radiusSm,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  roleOptionActive: {
    backgroundColor: 'rgba(93,202,165,.1)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,.3)',
  },
  roleOptionText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.muted,
  },
  submitBtn: {
    backgroundColor: colors.sageLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  submitBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#fff',
  },
});
