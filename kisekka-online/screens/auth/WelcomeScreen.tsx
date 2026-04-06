import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../app/navigation';
import { Colors, Typography, Spacing, BorderRadius, primaryButton, outlineButton } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Logo / branding area */}
      <View style={styles.brandArea}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>K</Text>
        </View>
        <Text style={styles.wordmark}>Kisekka Online</Text>
        <Text style={styles.tagline}>
          Connect with every trader,{'\n'}dealer and member of Kisekka.
        </Text>
      </View>

      {/* Auth actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PhoneEntry')}
        >
          <Text style={[Typography.button, styles.primaryButtonText]}>
            Continue with Phone
          </Text>
        </TouchableOpacity>

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>

        <TouchableOpacity
          style={outlineButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('GoogleAuth')}
        >
          <View style={styles.googleButtonInner}>
            {/* Google G — inline SVG-style using text */}
            <Text style={styles.googleG}>G</Text>
            <Text style={[Typography.button, styles.outlineButtonText]}>
              Continue with Google
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        By continuing you agree to our{' '}
        <Text style={styles.footerLink}>Terms</Text> &{' '}
        <Text style={styles.footerLink}>Privacy Policy</Text>.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  brandArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: {
    fontSize: 44,
    fontFamily: 'Inter_700Bold',
    color: Colors.white,
    letterSpacing: -1,
  },
  wordmark: {
    ...Typography.display,
    color: Colors.text,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  primaryButtonText: {
    color: Colors.white,
  },
  outlineButtonText: {
    color: Colors.text,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  orText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  googleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  googleG: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#4285F4',
  },
  footer: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
});
