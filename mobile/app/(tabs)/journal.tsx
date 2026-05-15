import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, border } from '../../theme';
import { trpc } from '../../trpc/client';
import { usePatient } from '../../context/PatientContext';

const EMOJI_MAP: Record<string, string[]> = {
  pain:     ['😣', '😟', '😐', '🙂', '😊'],
  mood:     ['😢', '😔', '😐', '🙂', '😄'],
  appetite: ['🚫', '😕', '😐', '🍽️', '😋'],
  mobility: ['🦽', '🚶', '😐', '🏃', '💪'],
  energy:   ['😴', '🥱', '😐', '⚡', '🔥'],
};

const LABELS = ['pain', 'mood', 'appetite', 'mobility', 'energy'] as const;

export default function JournalScreen() {
  const router = useRouter();
  const { patientId } = usePatient();

  const { data: checks, isLoading } = trpc.healthChecks.list.useQuery(
    { patientId: patientId!, days: 30 },
    { enabled: !!patientId }
  );

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
        <Text style={styles.title}>Health journal</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/checkin')}>
          <Text style={styles.newBtnText}>+ New entry</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <ActivityIndicator color={colors.mint} style={{ marginVertical: 40 }} />
        ) : checks && checks.length > 0 ? (
          checks.map((check) => {
            const date = new Date(check.createdAt);
            const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

            return (
              <View key={check.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{dayStr}</Text>
                  <Text style={styles.cardTime}>{timeStr}</Text>
                </View>

                {LABELS.map((label) => {
                  const value = check[label] as number;
                  const emoji = EMOJI_MAP[label][value - 1] ?? '😐';
                  const barColor = value < 3 ? colors.gold : colors.mint;
                  const barWidth = `${(value / 5) * 100}%`;

                  return (
                    <View key={label} style={styles.vitalRow}>
                      <Text style={styles.vitalLabel}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: barWidth, backgroundColor: barColor }]} />
                      </View>
                      <Text style={styles.vitalEmoji}>{emoji}</Text>
                      <Text style={[styles.vitalVal, { color: barColor }]}>{value}</Text>
                    </View>
                  );
                })}

                {check.notes && (
                  <Text style={styles.notes}>{check.notes}</Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No check-ins yet</Text>
            <Text style={styles.emptyDesc}>
              Daily check-ins help track health trends over time. Tap "New entry" to log today's vitals.
            </Text>
          </View>
        )}
      </ScrollView>
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
  newBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(93,202,165,.15)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,.3)',
  },
  newBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.mint,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    backgroundColor: colors.ink2,
    borderRadius: border.radius,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardDate: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.textOnDark,
  },
  cardTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  vitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  vitalLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
    width: 70,
  },
  barTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,.08)',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  vitalEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  vitalVal: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    width: 16,
    textAlign: 'right',
  },
  notes: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
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
});
