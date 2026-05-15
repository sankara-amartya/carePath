import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, border } from '../theme';
import { usePermissions, Action } from '../hooks/usePermissions';
import { trpc } from '../trpc/client';
import { usePatient } from '../context/PatientContext';

export default function SummaryScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const { patientId } = usePatient();
  const shimmerAnim = new Animated.Value(0.3);

  const utils = trpc.useUtils();

  // Fetch real data
  const { data: latestSummary, isLoading: summaryLoading } = trpc.aiSummaries.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId && can(Action.GENERATE_AI_SUMMARY) }
  );

  const { data: medications } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs } = trpc.medicationLogs.today.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: checks } = trpc.healthChecks.list.useQuery(
    { patientId: patientId!, days: 7 },
    { enabled: !!patientId }
  );

  const { data: alerts } = trpc.alerts.list.useQuery(
    { patientId: patientId!, resolved: false },
    { enabled: !!patientId }
  );

  const generateMutation = trpc.aiSummaries.generate.useMutation({
    onSuccess: () => utils.aiSummaries.latest.invalidate(),
    onError: (err) => Alert.alert('Error', err.message),
  });

  // Compute real stats
  const totalMeds = medications?.length ?? 0;
  const takenCount = todayLogs?.filter(l => l.status === 'taken').length ?? 0;
  const adherence = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0;

  const avgPain = checks && checks.length > 0
    ? (checks.reduce((sum, c) => sum + c.pain, 0) / checks.length).toFixed(1)
    : '—';

  const checkInCount = checks?.length ?? 0;
  const alertCount = alerts?.length ?? 0;

  // Week date range
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  useEffect(() => {
    if (summaryLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 0.6, duration: 600, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [summaryLoading]);

  const handleGenerate = () => {
    if (!patientId) return;
    const ws = weekStart.toISOString();
    const we = now.toISOString();
    generateMutation.mutate({ patientId, weekStart: ws, weekEnd: we });
  };

  if (!can(Action.GENERATE_AI_SUMMARY)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
            <Text style={{color: colors.muted, fontSize: 24}}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly summary</Text>
        </View>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: spacing.xl }}>
          You don't have permission to view summaries.
        </Text>
      </SafeAreaView>
    );
  }

  const summaryContent = latestSummary?.content ?? '';

  const handleShare = () => {
    Linking.openURL('mailto:?subject=Weekly Health Summary&body=' + encodeURIComponent(summaryContent));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.md }}>
            <Text style={{color: colors.muted, fontSize: 24, top: -2}}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Weekly summary</Text>
        </View>
        <TouchableOpacity
          style={[styles.btnGhost, generateMutation.isPending && { opacity: 0.6 }]}
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
        >
          <Text style={styles.btnGhostText}>{generateMutation.isPending ? 'Generating...' : 'Generate'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>{dateRange}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statValMint}>{adherence}%</Text>
            <Text style={styles.statLabel}>Adherence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={Number(avgPain) > 3 ? styles.statValGold : styles.statValMint}>{avgPain}</Text>
            <Text style={styles.statLabel}>Avg pain</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValMint}>{checkInCount} / 7</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={alertCount > 0 ? styles.statValAlert : styles.statValMint}>{alertCount}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </ScrollView>

        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>AI SUMMARY</Text>
          {summaryLoading || generateMutation.isPending ? (
            <View>
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '100%' }]} />
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '85%' }]} />
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '60%' }]} />
            </View>
          ) : summaryContent ? (
            <Text style={styles.aiText}>{summaryContent}</Text>
          ) : (
            <Text style={[styles.aiText, { color: colors.muted }]}>
              No summary generated yet. Tap "Generate" to create one.
            </Text>
          )}
        </View>

        {summaryContent ? (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>Share with doctor</Text>
          </TouchableOpacity>
        ) : null}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: colors.textOnDark,
  },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(93,202,165,.15)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,.3)',
  },
  btnGhostText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.mint,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  datePillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
  },
  statsStrip: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,.03)',
    borderRadius: border.radiusSm,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.05)',
  },
  statValMint: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: colors.mint,
  },
  statValGold: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: colors.gold,
  },
  statValAlert: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: colors.alert,
  },
  statLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
  },
  aiCard: {
    backgroundColor: colors.ink2,
    borderLeftWidth: 2,
    borderLeftColor: colors.mint,
    borderRadius: border.radius,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  aiLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: colors.mint,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  shimmerLine: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 4,
    marginBottom: 8,
  },
  aiText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textOnDark,
    lineHeight: 22,
  },
  shareBtn: {
    marginHorizontal: spacing.lg,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(201,148,58,.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,148,58,.3)',
    marginBottom: spacing.xl,
  },
  shareBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.gold,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: colors.textOnDark,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
    lineHeight: 20,
  }
});
