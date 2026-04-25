import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import { colors, spacing, border } from '../../theme';
import { trpc } from '../../trpc/client';
import { usePatient } from '../../context/PatientContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { patientId } = usePatient();

  const { data: medications, isLoading: medsLoading } = trpc.medications.list.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: todayLogs, isLoading: logsLoading } = trpc.medicationLogs.today.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const { data: latestCheck } = trpc.healthChecks.latest.useQuery(
    { patientId: patientId! },
    { enabled: !!patientId }
  );

  const isLoading = medsLoading || logsLoading;

  // Calculate stats from real data
  const totalMeds = medications?.length ?? 0;
  const loggedMedIds = new Set(todayLogs?.map(l => l.medicationId) ?? []);
  const doneCount = todayLogs?.filter(l => l.status === 'taken').length ?? 0;
  const dueMeds = totalMeds - loggedMedIds.size;
  const adherenceScore = totalMeds > 0 ? Math.round((doneCount / totalMeds) * 10) : 0;

  const lastCheckAgo = latestCheck
    ? getTimeAgo(new Date(latestCheck.createdAt))
    : 'No check-ins';

  // Determine med status based on today's logs
  function getMedStatus(medId: string, scheduleTimes: string[]): 'Done' | 'Due' | 'Missed' | 'Scheduled' {
    const log = todayLogs?.find(l => l.medicationId === medId);
    if (log?.status === 'taken') return 'Done';
    if (log?.status === 'missed') return 'Missed';
    if (log?.status === 'skipped') return 'Done';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const time of scheduleTimes) {
      const [h, m] = time.split(':').map(Number);
      if (h * 60 + (m || 0) <= currentMinutes) return 'Due';
    }
    return 'Scheduled';
  }

  const firstName = user?.firstName ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!patientId) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.greetingTitle}>Welcome to CarePath</Text>
        <Text style={[styles.greetingSub, { marginTop: spacing.md }]}>No patient profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>{greeting}</Text>
            <Text style={styles.greetingTitle}>{firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Main Card (Today's Score) */}
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Today's score</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.mint} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={styles.cardValue}>{adherenceScore} / 10</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${adherenceScore * 10}%` }]} />
              </View>
            </>
          )}
        </View>

        {/* Mini Cards */}
        <View style={styles.miniRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Meds due</Text>
            <Text style={[styles.miniVal, dueMeds > 0 && { color: colors.gold }]}>
              {isLoading ? '...' : `${dueMeds} left`}
            </Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Last check</Text>
            <Text style={styles.miniVal}>{lastCheckAgo}</Text>
          </View>
        </View>

        {/* Meds List */}
        <Text style={styles.listHeader}>MEDICATIONS</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.mint} style={{ marginVertical: 20 }} />
        ) : medications && medications.length > 0 ? (
          medications.map((med) => {
            const status = getMedStatus(med.id, med.scheduleTimes);
            const badgeStyle = getBadgeStyle(status);

            return (
              <View key={med.id} style={styles.listItem}>
                <View style={[styles.dot, { backgroundColor: badgeStyle.dotColor }]} />
                <Text style={styles.itemText}>{med.name} {med.dosage}</Text>
                <View style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <Text style={[styles.badgeText, { color: badgeStyle.color }]}>
                    {status === 'Scheduled' ? (med.scheduleTimes[0] ?? 'Later') : status}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ color: colors.muted, fontFamily: 'DMSans_400Regular', paddingVertical: spacing.md }}>
            No medications added yet.
          </Text>
        )}

        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/checkin')}>
          <Text style={styles.btnText}>Health check-in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getBadgeStyle(status: string) {
  switch (status) {
    case 'Done':
      return { color: colors.mint, bg: 'rgba(93,202,165,.2)', dotColor: colors.mint };
    case 'Due':
      return { color: colors.gold, bg: 'rgba(201,148,58,.2)', dotColor: colors.gold };
    case 'Missed':
      return { color: colors.alert, bg: 'rgba(224,112,112,.2)', dotColor: colors.alert };
    default:
      return { color: colors.muted, bg: 'rgba(255,255,255,.06)', dotColor: 'rgba(255,255,255,0.2)' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    marginBottom: 2,
  },
  greetingTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    color: colors.textOnDark,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.textOnDark,
  },
  mainCard: {
    backgroundColor: 'rgba(93,202,165,.12)',
    borderRadius: border.radius,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  cardValue: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    color: colors.mint,
    marginBottom: 10,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,.1)',
    borderRadius: 2,
  },
  fill: {
    height: 4,
    backgroundColor: colors.mint,
    borderRadius: 2,
  },
  miniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  miniCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.04)',
    borderRadius: border.radiusSm,
    padding: spacing.md,
  },
  miniLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  miniVal: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 16,
    color: colors.textOnDark,
  },
  listHeader: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,.05)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  itemText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textOnDark,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  btnPrimary: {
    backgroundColor: colors.sageLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 24,
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
