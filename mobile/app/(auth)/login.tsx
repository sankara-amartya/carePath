import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo';
import { colors, spacing, border } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request the OTP code to be sent to the email
  const handleRequestCode = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Start the sign-in process using email code strategy
      const { supportedFirstFactors } = await signIn.create({
        identifier: email,
      });

      // Find the email code factor
      const isEmailCodeFactor = (factor: any) => {
        return factor.strategy === 'email_code' && factor.emailAddressId !== null;
      };

      const emailCodeFactor = supportedFirstFactors?.find(isEmailCodeFactor) as any;

      if (emailCodeFactor) {
        // Send the OTP to the email
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        });

        // Show the OTP input UI
        setPendingVerification(true);
      } else {
        Alert.alert('Error', 'Email OTP is not enabled in your Clerk dashboard.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', err.errors?.[0]?.message || 'Failed to send code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify the 6-digit code entered by the user
  const handleVerifyCode = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      // Verify the code
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      // If successful, set the session active!
      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
      } else {
        console.error('Sign in not complete:', completeSignIn);
        Alert.alert('Error', 'Additional steps required (MFA).');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Verification Failed', err.errors?.[0]?.message || 'Invalid code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to CarePath</Text>
        <Text style={styles.subtitle}>Sign in to your care team account</Text>
        
        {!pendingVerification ? (
          // --- STEP 1: EMAIL INPUT ---
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, isLoading && { opacity: 0.7 }]} 
              onPress={handleRequestCode}
              disabled={isLoading}
            >
              <Text style={styles.btnText}>{isLoading ? 'Sending Code...' : 'Send Login Code'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // --- STEP 2: OTP VERIFICATION ---
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <Text style={{ color: colors.muted, marginBottom: 12 }}>
                We sent a 6-digit code to {email}
              </Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, isLoading && { opacity: 0.7 }]} 
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              <Text style={styles.btnText}>{isLoading ? 'Verifying...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 20, alignItems: 'center' }}
              onPress={() => setPendingVerification(false)}
            >
              <Text style={{ color: colors.sageLight }}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 32,
    color: colors.textOnDark,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xl * 2,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.textOnDark,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: border.radiusSm,
    padding: spacing.md,
    color: colors.textOnDark,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: colors.sageLight,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
  }
});
