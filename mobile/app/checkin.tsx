import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, border } from '../theme';
import { trpc } from '../trpc/client';
import { usePatient } from '../context/PatientContext';

export default function CheckInScreen() {
  const router = useRouter();
  const { patientId } = usePatient();
  const [pain, setPain] = useState(3);
  const [mood, setMood] = useState(3);
  const [appetite, setAppetite] = useState(3);
  const [mobility, setMobility] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const utils = trpc.useUtils();

  const mutation = trpc.healthChecks.create.useMutation({
    onSuccess: () => {
      utils.healthChecks.latest.invalidate();
      utils.healthChecks.list.invalidate();
      setSubmitted(true);
      setTimeout(() => router.back(), 1500);
    },
    onError: (err) => Alert.alert('Error', err.message),
  });

  const handleSubmit = () => {
    if (!patientId) return;
    mutation.mutate({ patientId, pain, mood, appetite, mobility, energy });
  };

  const renderSlider = (label: string, value: number, setValue: (val: number) => void) => {
    const isLow = value < 3;
    const accentColor = isLow ? colors.gold : colors.mint;
    
    return (
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>{label}</Text>
          <Text style={[styles.sliderValue, { color: accentColor }]}>{value} / 5</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={value}
          onValueChange={setValue}
          minimumTrackTintColor={accentColor}
          maximumTrackTintColor="rgba(255,255,255,0.1)"
          thumbTintColor={accentColor}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How is Dad today?</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>x</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {submitted ? (
          <View style={{ alignItems: 'center', marginTop: spacing.xl * 2 }}>
            <View style={{ 
              width: 64, height: 64, borderRadius: 32, 
              backgroundColor: 'rgba(93,202,165,.2)', 
              alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg 
            }}>
              <Text style={{ color: colors.mint, fontSize: 28 }}>✓</Text>
            </View>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: colors.mint }}>Check-in saved</Text>
          </View>
        ) : (
          <>
            {renderSlider('Pain', pain, setPain)}
            {renderSlider('Mood', mood, setMood)}
            {renderSlider('Appetite', appetite, setAppetite)}
            {renderSlider('Mobility', mobility, setMobility)}
            {renderSlider('Energy', energy, setEnergy)}

            <View style={styles.voiceSection}>
              <Text style={styles.voiceLabel}>Add a voice note (optional)</Text>
              <TouchableOpacity 
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                onPressIn={() => setIsRecording(true)}
                onPressOut={() => setIsRecording(false)}
              >
                {isRecording ? <View style={styles.recordingPulse} /> : <View style={styles.micIcon} />}
              </TouchableOpacity>
              <Text style={styles.voiceHelperText}>
                {isRecording ? 'Recording... release to stop' : 'Hold to record'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, mutation.isPending && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={mutation.isPending}
            >
              <Text style={styles.submitBtnText}>{mutation.isPending ? 'Submitting...' : 'Submit check-in'}</Text>
            </TouchableOpacity>
          </>
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
  header: {
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.muted,
    fontSize: 16,
    fontFamily: 'DMSans_400Regular',
    marginTop: -2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  sliderRow: {
    marginBottom: spacing.lg,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sliderLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.muted,
  },
  sliderValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  voiceSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: border.radius,
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  voiceLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.textOnDark,
    marginBottom: spacing.lg,
  },
  recordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  recordBtnActive: {
    backgroundColor: 'rgba(224,112,112,.2)',
  },
  recordingPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.alert,
  },
  micIcon: {
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.ink,
  },
  voiceHelperText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
  },
  submitBtn: {
    backgroundColor: colors.sageLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: spacing.xl * 2,
  },
  submitBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#fff',
  }
});
