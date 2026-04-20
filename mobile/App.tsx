import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  useFonts, 
  DMSans_400Regular, 
  DMSans_500Medium, 
  DMSans_600SemiBold 
} from '@expo-google-fonts/dm-sans';
import { 
  DMSerifDisplay_400Regular 
} from '@expo-google-fonts/dm-serif-display';
import { colors, spacing, border } from './theme';

export default function App() {
  let [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSerifDisplay_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Top Bar */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSub}>Good morning</Text>
              <Text style={styles.greetingTitle}>Margaret</Text>
            </View>
            <View style={styles.avatar} />
          </View>
          
          {/* Main Card (Today's Score) */}
          <View style={styles.mainCard}>
            <Text style={styles.cardLabel}>Today's score</Text>
            <Text style={styles.cardValue}>7 / 10</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: '70%' }]} />
            </View>
          </View>
          
          {/* Mini Cards */}
          <View style={styles.miniRow}>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Meds due</Text>
              <Text style={[styles.miniVal, { color: colors.gold }]}>2 left</Text>
            </View>
            <View style={styles.miniCard}>
              <Text style={styles.miniLabel}>Last check</Text>
              <Text style={styles.miniVal}>3h ago</Text>
            </View>
          </View>
          
          {/* Meds List */}
          <Text style={styles.listHeader}>MEDICATIONS</Text>
          
          <View style={styles.listItem}>
            <View style={[styles.dot, { backgroundColor: colors.mint }]} />
            <Text style={styles.itemText}>Metformin 500mg</Text>
            <View style={[styles.badge, styles.badgeMint]}>
              <Text style={styles.badgeTextMint}>Done</Text>
            </View>
          </View>
          
          <View style={styles.listItem}>
            <View style={[styles.dot, { backgroundColor: colors.gold }]} />
            <Text style={styles.itemText}>Lisinopril 10mg</Text>
            <View style={[styles.badge, styles.badgeGold]}>
              <Text style={styles.badgeTextGold}>Due</Text>
            </View>
          </View>
          
          <View style={styles.listItem}>
            <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <Text style={styles.itemText}>Atorvastatin 20mg</Text>
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={styles.badgeTextGray}>8 PM</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.btnPrimary}>
            <Text style={styles.btnText}>Log medication</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safeArea: {
    flex: 1,
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
  badgeMint: {
    backgroundColor: 'rgba(93,202,165,.2)',
  },
  badgeTextMint: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.mint,
  },
  badgeGold: {
    backgroundColor: 'rgba(201,148,58,.2)',
  },
  badgeTextGold: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.gold,
  },
  badgeGray: {
    backgroundColor: 'rgba(255,255,255,.06)',
  },
  badgeTextGray: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: colors.muted,
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
  }
});
