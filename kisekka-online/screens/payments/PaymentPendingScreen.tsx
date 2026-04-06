/**
 * PaymentPendingScreen
 *
 * Shown immediately after initiating an ioTec STK push.
 * Opens a real-time Firestore listener on the payment document and
 * reacts to status changes:
 *   confirmed → success state → navigate to feed after 2 s
 *   failed    → failure state → "Try Again" → back to AnnouncementPaymentScreen
 *
 * The user can also cancel, which sets the post back to draft.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { AppStackParamList } from '../../app/navigation';
import { db } from '../../services/firebase';
import { PaymentStatus } from '../../types/post';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: RouteProp<AppStackParamList, 'PaymentPending'>;
};

export default function PaymentPendingScreen({ navigation, route }: Props) {
  const { paymentId, postId } = route.params;

  const [status, setStatus] = useState<PaymentStatus>('pending');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while pending
  useEffect(() => {
    if (status !== 'pending') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulseAnim]);

  // Real-time payment status listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'announcement_payments', paymentId), (snap) => {
      if (!snap.exists()) return;
      const payStatus = snap.data().status as PaymentStatus;
      setStatus(payStatus);

      if (payStatus === 'confirmed') {
        // Navigate to feed after 2 s with success toast handled by App-level handler
        setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'BottomTabs' }] });
        }, 2000);
      }
    });
    return unsub;
  }, [paymentId, navigation]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel payment?',
      'Your announcement will be saved as a draft.',
      [
        { text: 'Keep waiting', style: 'cancel' },
        {
          text: 'Cancel payment',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'posts', postId), { status: 'draft' });
            } catch {
              // Best-effort; post remains in pending_payment
            }
            navigation.reset({ index: 0, routes: [{ name: 'BottomTabs' }] });
          },
        },
      ]
    );
  };

  // ── Confirmed ────────────────────────────────────────────────────────────────
  if (status === 'confirmed') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={styles.successTitle}>Payment confirmed!</Text>
          <Text style={styles.successSubtitle}>Your announcement is now live.</Text>
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Text style={styles.failIcon}>❌</Text>
          <Text style={styles.failTitle}>Payment failed</Text>
          <Text style={styles.failSubtitle}>
            The transaction was not completed. You can try again.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'BottomTabs' }] })}>
            <Text style={styles.cancelLink}>Go to feed</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Pending ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.center}>
        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.pulseIcon}>📲</Text>
        </Animated.View>

        <Text style={styles.pendingTitle}>Check your phone</Text>
        <Text style={styles.pendingSubtitle}>
          We've sent a payment prompt to your phone.{'\n'}
          Enter your Mobile Money PIN to complete payment.
        </Text>

        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.base,
  },
  pulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  pulseIcon:   { fontSize: 40 },
  pendingTitle: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  pendingSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cancelBtn: {
    marginTop: Spacing.xl,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: { ...Typography.button, color: Colors.textSecondary },

  // Success
  successIcon:     { fontSize: 64, marginBottom: Spacing.sm },
  successTitle:    { ...Typography.h2, color: Colors.text },
  successSubtitle: { ...Typography.body, color: Colors.textSecondary },

  // Failed
  failIcon:     { fontSize: 64, marginBottom: Spacing.sm },
  failTitle:    { ...Typography.h2, color: Colors.error },
  failSubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  retryBtnText: { ...Typography.button, color: Colors.white },
  cancelLink:   { ...Typography.caption, color: Colors.primary, marginTop: Spacing.base },
});
