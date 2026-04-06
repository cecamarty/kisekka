import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../app/navigation';
import { confirmPhoneOTP } from '../../services/auth';
import { sendPhoneOTP } from '../../services/auth';
import { Colors, Typography, Spacing, BorderRadius, primaryButton } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'OTPVerification'>;
  route: RouteProp<AuthStackParamList, 'OTPVerification'>;
};

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60; // seconds

export default function OTPVerificationScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const hiddenInput = useRef<TextInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const handleCodeChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(sanitized);
    if (sanitized.length === OTP_LENGTH) {
      handleVerify(sanitized);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const finalCode = otpCode ?? code;
    if (finalCode.length !== OTP_LENGTH) {
      Alert.alert('Enter code', 'Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await confirmPhoneOTP(finalCode);
      // Auth state change triggers navigation automatically via useAuth
    } catch (error: any) {
      Alert.alert('Wrong code', 'The code you entered is incorrect. Please try again.');
      setCode('');
      hiddenInput.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    // Note: resend requires a new reCAPTCHA — navigate back to PhoneEntry
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{'\n'}
              <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
            </Text>
          </View>

          {/* OTP boxes — visual only, backed by a single hidden input */}
          <Pressable onPress={() => hiddenInput.current?.focus()}>
            <View style={styles.otpRow} pointerEvents="none">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.otpBox,
                    code[i] ? styles.otpBoxFilled : null,
                    loading ? styles.otpBoxDisabled : null,
                  ]}
                >
                  <Text style={styles.otpDigit}>{code[i] ?? ''}</Text>
                </View>
              ))}
            </View>
          </Pressable>

          {/* Hidden input that captures the full OTP, including SMS autofill */}
          <TextInput
            ref={hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            editable={!loading}
            textContentType="oneTimeCode"   // iOS SMS autofill
            autoComplete="sms-otp"          // Android SMS autofill
            style={styles.hiddenInput}
            caretHidden
          />

          {/* Verify button */}
          <TouchableOpacity
            style={[primaryButton, loading && styles.buttonDisabled]}
            onPress={() => handleVerify()}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[Typography.button, { color: Colors.white }]}>
                Verify
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive it? </Text>
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
              <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  phoneHighlight: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxDisabled: {
    opacity: 0.5,
  },
  otpDigit: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  resendLink: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
  resendDisabled: {
    color: Colors.textSecondary,
  },
});
