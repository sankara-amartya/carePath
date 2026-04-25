import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, border } from '../../theme';
import { usePermissions, Action } from '../../hooks/usePermissions';

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  status: 'Done' | 'Due' | 'Missed' | 'Scheduled';
};

const MOCK_MEDS: Medication[] = [
  { id: '1', name: 'Metformin', dosage: '500mg', time: '8:00 AM', status: 'Done' },
  { id: '2', name: 'Lisinopril', dosage: '10mg', time: '12:00 PM', status: 'Due' },
  { id: '3', name: 'Atorvastatin', dosage: '20mg', time: '8:00 PM', status: 'Scheduled' },
];

export default function MedicationsScreen() {
  const { can } = usePermissions();
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);

  const handleLogClick = (med: Medication) => {
    setSelectedMed(med);
  };

  const closeBottomSheet = () => setSelectedMed(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Today's medications</Text>

        {MOCK_MEDS.map((med) => {
          let badgeColor = colors.muted;
          let badgeBg = 'rgba(255,255,255,.06)';
          if (med.status === 'Done') {
            badgeColor = colors.mint;
            badgeBg = 'rgba(93,202,165,.2)';
          } else if (med.status === 'Due') {
            badgeColor = colors.gold;
            badgeBg = 'rgba(201,148,58,.2)';
          } else if (med.status === 'Missed') {
            badgeColor = colors.alert;
            badgeBg = 'rgba(224,112,112,.2)';
          }

          return (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name} {med.dosage}</Text>
                <Text style={styles.medTime}>Scheduled: {med.time}</Text>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.badgeText, { color: badgeColor }]}>{med.status}</Text>
                </View>
              </View>

              {can(Action.LOG_MEDICATION) && med.status !== 'Done' && (
                <TouchableOpacity style={styles.btnPrimary} onPress={() => handleLogClick(med)}>
                  <Text style={styles.btnText}>Log dose</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {can(Action.EDIT_MEDICATIONS) && (
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Log Dose Bottom Sheet Modal */}
      <Modal visible={!!selectedMed} transparent animationType="slide" onRequestClose={closeBottomSheet}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={closeBottomSheet} />
          <View style={styles.bottomSheet}>
            <Text style={styles.sheetTitle}>{selectedMed?.name} {selectedMed?.dosage}</Text>
            
            <View style={styles.cameraBox}>
              {can(Action.VERIFY_PILL_PHOTO) ? (
                <TouchableOpacity style={styles.cameraBtn}>
                  <Text style={styles.cameraBtnText}>Take photo to verify</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{color: colors.gold}}>AI verification disabled</Text>
              )}
            </View>

            <TouchableOpacity style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>Taken without photo</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Add notes (optional)"
              placeholderTextColor={colors.muted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={closeBottomSheet}>
              <Text style={styles.btnText}>Log dose taken</Text>
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
