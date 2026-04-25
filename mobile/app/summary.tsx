import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, border } from '../theme';
import { usePermissions, Action } from '../hooks/usePermissions';

export default function SummaryScreen() {
  const { can } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summaryText, setSummaryText] = useState("");
  const shimmerAnim = new Animated.Value(0.3);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Mock SSE simulation
      let text = "Dad has generally been adhering to his medication schedule, but we noticed a slight increase in reported pain levels on Thursday and Friday. His appetite remains stable, though his energy levels dropped slightly over the weekend. Overall, vitals are within normal range.";
      let idx = 0;
      
      const interval = setInterval(() => {
        if (idx < text.length) {
          setSummaryText(prev => prev + text[idx]);
          idx++;
        } else {
          setLoading(false);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    }
  }, [loading]);

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

  const handleShare = () => {
    Linking.openURL('mailto:doctor@hospital.com?subject=Weekly Summary&body=' + encodeURIComponent(summaryText));
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
        <TouchableOpacity style={styles.btnGhost}>
          <Text style={styles.btnGhostText}>Generate</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>Apr 14 – Apr 21</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statValMint}>94%</Text>
            <Text style={styles.statLabel}>Adherence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValGold}>3.8</Text>
            <Text style={styles.statLabel}>Avg pain</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValMint}>7 / 7</Text>
            <Text style={styles.statLabel}>Check-ins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValAlert}>1</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </ScrollView>

        <View style={styles.aiCard}>
          <Text style={styles.aiLabel}>AI SUMMARY</Text>
          {loading && summaryText.length === 0 ? (
            <View>
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '100%' }]} />
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '85%' }]} />
              <Animated.View style={[styles.shimmerLine, { opacity: shimmerAnim, width: '60%' }]} />
            </View>
          ) : (
            <Text style={styles.aiText}>
              {summaryText}
              {loading && <Text style={{color: colors.mint}}>|</Text>}
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share with doctor</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medications</Text>
          <Text style={styles.bullet}>• Metformin 500mg: Missed 1 dose (Tue)</Text>
          <Text style={styles.bullet}>• Lisinopril 10mg: 100% adherence</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health trends</Text>
          <Text style={styles.bullet}>• Pain level increased from 2 to 4</Text>
          <Text style={styles.bullet}>• Mobility reported as consistently good</Text>
        </View>

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
