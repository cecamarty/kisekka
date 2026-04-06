/**
 * HomeScreen — placeholder for Phase 1.
 * Confirms the full auth → onboarding → home flow works end-to-end.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/auth';
import { Colors, Typography, Spacing, primaryButton } from '../../constants/theme';

export default function HomeScreen() {
  const { userProfile } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>Kisekka Online</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>
          Welcome to Kisekka Online,{'\n'}
          <Text style={styles.name}>{userProfile?.displayName ?? 'Trader'} 👋</Text>
        </Text>
        <Text style={styles.shopName}>{userProfile?.shopName}</Text>
        <Text style={styles.hint}>
          Feed, listings and announcements coming in Phase 2.
        </Text>

        <TouchableOpacity
          style={[primaryButton, styles.signOutButton]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Text style={[Typography.button, { color: Colors.white }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmark: {
    ...Typography.h3,
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    ...Typography.h2,
    lineHeight: 32,
  },
  name: {
    ...Typography.h1,
    color: Colors.primary,
  },
  shopName: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  hint: {
    ...Typography.caption,
    marginTop: Spacing.base,
    color: Colors.textMuted,
  },
  signOutButton: {
    marginTop: Spacing.xxl,
  },
});
