import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, border } from '../../theme';
import { usePermissions, Action } from '../../hooks/usePermissions';
import { trpc } from '../../trpc/client';
import { usePatient } from '../../context/PatientContext';

export default function MedicationsScreen() {
  const { can } = usePermissions();
  const { patientId } = usePatient();
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', notes: '' });

  const utils = trpc.useUtils();

  const { data: medications, isLoading } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs } = trpc.medicationLogs.today.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const logMutation = trpc.medicationLogs.log.useMutation({
    onSuccess: () => {
      utils.medicationLogs.today.invalidate();
      utils.medications.list.invalidate();
      setSelectedMedId(null);
      setLogNotes('');
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const addMutation = trpc.medications.create.useMutation({
    onSuccess: () => {
      utils.medications.list.invalidate();
      setShowAddModal(false);
      setNewMed({ name: '', dosage: '', frequency: '', notes: '' });
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  function getMedStatus(medId: string): 'Done' | 'Due' | 'Missed' | 'Scheduled' {
    const log = todayLogs?.find(l => l.medicationId === medId);
    if (log?.status === 'taken') return 'Done';
    if (log?.status === 'missed') return 'Missed';
    if (log?.status === 'skipped') return 'Done';
    return 'Due';
  }

  const selectedMed = medications?.find(m => m.id === selectedMedId);

  const handleLogDose = (status: 'taken' | 'skipped') => {
    if (!selectedMedId) return;
    logMutation.mutate({ medicationId: selectedMedId, status, notes: logNotes || undefined });
  };

  const handleAddMed = () => {
    if (!patientId || !newMed.name || !newMed.dosage || !newMed.frequency) return;
    addMutation.mutate({
      patientId: patientId!,
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      notes: newMed.notes || undefined,
    });
  };

  if (!patientId) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={[styles.header, { textAlign: 'center', marginTop: spacing.xl }]}>No patient selected</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Today's medications</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.mint} style={{ marginVertical: 40 }} />
        ) : medications && medications.length > 0 ? (
          medications.map((med) => {
            const status = getMedStatus(med.id);
            let badgeColor = colors.muted;
            let badgeBg = 'rgba(255,255,255,.06)';
            if (status === 'Done') {
              badgeColor = colors.mint;
              badgeBg = 'rgba(93,202,165,.2)';
            } else if (status === 'Due') {
              badgeColor = colors.gold;
              badgeBg = 'rgba(201,148,58,.2)';
            } else if (status === 'Missed') {
              badgeColor = colors.alert;
              badgeBg = 'rgba(224,112,112,.2)';
            }

            return (
              <View key={med.id} style={styles.medCard}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.name} {med.dosage}</Text>
                  <Text style={styles.medTime}>{med.frequency}{med.scheduleTimes.length > 0 ? ` · ${med.scheduleTimes.join(', ')}` : ''}</Text>
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>{status}</Text>
                  </View>
                </View>

                {can(Action.LOG_MEDICATION) && status !== 'Done' && (
                  <TouchableOpacity style={styles.btnPrimary} onPress={() => setSelectedMedId(med.id)}>
                    <Text style={styles.btnText}>Log dose</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        ) : (
          <Text style={{ color: colors.muted, fontFamily: 'DMSans_400Regular', textAlign: 'center', marginTop: spacing.xl }}>
            No medications added yet. Tap + to add one.
          </Text>
        )}
      </ScrollView>

      {can(Action.EDIT_MEDICATIONS) && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Log Dose Bottom Sheet Modal */}
      <Modal visible={!!selectedMedId} transparent animationType="slide" onRequestClose={() => setSelectedMedId(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedMedId(null)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>{selectedMed?.name} {selectedMed?.dosage}</Text>
            
            <View style={styles.cameraBox}>
              {can(Action.VERIFY_PILL_PHOTO) ? (
                <TouchableOpacity style={styles.cameraBtn}>
                  <Text style={styles.cameraBtnText}>Take photo to verify</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{color: colors.gold, fontFamily: 'DMSans_400Regular'}}>Photo verification not available</Text>
              )}
            </View>

            <TouchableOpacity style={styles.ghostBtn} onPress={() => handleLogDose('skipped')}>
              <Text style={styles.ghostBtnText}>Skip this dose</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Add notes (optional)"
              placeholderTextColor={colors.muted}
              value={logNotes}
              onChangeText={setLogNotes}
            />

            <TouchableOpacity
              style={[styles.submitBtn, logMutation.isPending && { opacity: 0.6 }]}
              onPress={() => handleLogDose('taken')}
              disabled={logMutation.isPending}
            >
              <Text style={styles.btnText}>{logMutation.isPending ? 'Logging...' : 'Log dose taken'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Medication Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowAddModal(false)} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>Add medication</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Medication name"
              placeholderTextColor={colors.muted}
              value={newMed.name}
              onChangeText={(t) => setNewMed(prev => ({ ...prev, name: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage (e.g. 500mg)"
              placeholderTextColor={colors.muted}
              value={newMed.dosage}
              onChangeText={(t) => setNewMed(prev => ({ ...prev, dosage: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Frequency (e.g. Twice daily)"
              placeholderTextColor={colors.muted}
              value={newMed.frequency}
              onChangeText={(t) => setNewMed(prev => ({ ...prev, frequency: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.muted}
              value={newMed.notes}
              onChangeText={(t) => setNewMed(prev => ({ ...prev, notes: t }))}
            />

            <TouchableOpacity
              style={[styles.submitBtn, addMutation.isPending && { opacity: 0.6 }]}
              onPress={handleAddMed}
              disabled={addMutation.isPending}
            >
              <Text style={styles.btnText}>{addMutation.isPending ? 'Adding...' : 'Add medication'}</Text>
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
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: colors.textOnDark,
    marginBottom: spacing.xl,
  },
  medCard: {
    backgroundColor: colors.ink2,
    borderRadius: border.radius,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  medInfo: {
    marginBottom: spacing.sm,
  },
  medName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.textOnDark,
    marginBottom: 4,
  },
  medTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  btnPrimary: {
    backgroundColor: 'rgba(255,255,255,.06)',
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: colors.ink,
    marginTop: -2,
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
    fontSize: 24,
    color: colors.textOnDark,
    marginBottom: spacing.lg,
  },
  cameraBox: {
    backgroundColor: 'rgba(201,148,58,.1)',
    borderRadius: border.radiusSm,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,148,58,.3)',
    marginBottom: spacing.md,
  },
  cameraBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  cameraBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  ghostBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.muted,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.1)',
    color: colors.textOnDark,
    borderRadius: border.radiusSm,
    padding: spacing.md,
    fontFamily: 'DMSans_400Regular',
    marginBottom: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.sageLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  }
});
