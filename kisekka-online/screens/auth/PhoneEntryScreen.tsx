import React, { useRef, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../app/navigation';
import { firebaseConfig } from '../../services/firebase';
import { sendPhoneOTP } from '../../services/auth';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  inputStyle,
  primaryButton,
} from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'PhoneEntry'>;
};

// Common country codes for quick selection
const COUNTRY_CODES = [
  { label: '🇺🇬 +256', value: '+256' },
  { label: '🇰🇪 +254', value: '+254' },
  { label: '🇹🇿 +255', value: '+255' },
  { label: '🇷🇼 +250', value: '+250' },
  { label: '🇬🇧 +44', value: '+44' },
  { label: '🇺🇸 +1', value: '+1' },
];

export default function PhoneEntryScreen({ navigation }: Props) {
  const recaptchaVerifier = useRef<any>(null);
  const [countryCode, setCountryCode] = useState('+256');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const fullNumber = `${countryCode}${phoneNumber.replace(/^0+/, '')}`;

  const handleSendOTP = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 7) {
      Alert.alert('Invalid number', 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOTP(fullNumber, recaptchaVerifier.current);
      navigation.navigate('OTPVerification', { phoneNumber: fullNumber });
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* reCAPTCHA — invisible until needed */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter your number</Text>
            <Text style={styles.subtitle}>
              We'll send a one-time code to verify your account.
            </Text>
          </View>

          {/* Phone input row */}
          <View style={styles.inputRow}>
            {/* Country code picker */}
            <TouchableOpacity
              style={styles.countryButton}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.countryCode}>{countryCode}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>

            <TextInput
              style={[inputStyle, styles.phoneInput]}
              placeholder="700 000 000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={12}
              autoFocus
            />
          </View>

          {/* Country code dropdown */}
          {showCountryPicker && (
            <View style={styles.dropdown}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCountryCode(c.value);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.dropdownLabel}>{c.label}</Text>
                  {countryCode === c.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Full number preview */}
          {phoneNumber.length > 0 && (
            <Text style={styles.preview}>{fullNumber}</Text>
          )}

          {/* Send OTP */}
          <TouchableOpacity
            style={[primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[Typography.button, { color: Colors.white }]}>
                Send Code
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  countryCode: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  chevron: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  phoneInput: {
    flex: 1,
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dropdownLabel: {
    ...Typography.body,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: 'Inter_700Bold',
  },
  preview: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
