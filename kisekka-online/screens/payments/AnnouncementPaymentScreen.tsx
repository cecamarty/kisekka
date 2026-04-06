/**
 * AnnouncementPaymentScreen
 *
 * Initiates an ioTec Pay STK push for an announcement post.
 * The user confirms or edits their phone number, then taps MTN or Airtel.
 *
 * Flow:
 *   1. Generate externalId
 *   2. Get ioTec access token (client_credentials)
 *   3. Call ioTec /collect endpoint
 *   4. Write announcement_payments doc to Firestore
 *   5. Update post status to pending_payment (already set on creation)
 *   6. Navigate to PaymentPendingScreen
 *
 * TODO: move token generation to Cloud Function before production.
 *       Client-side client_id/secret is an acceptable MVP shortcut per spec.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { collection, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { ANNOUNCEMENT_FEE_UGX } from '../../constants/pricing';
import { Colors, Typography, Spacing, BorderRadius, inputStyle } from '../../constants/theme';
import { PaymentMethod } from '../../types/post';

const IOTEC_TOKEN_URL = 'https://id.iotec.io/connect/token';
const IOTEC_COLLECT_URL = 'https://pay.iotec.io/api/collections/collect';

// TODO: move token generation to Cloud Function before production
const IOTEC_CLIENT_ID     = process.env.EXPO_PUBLIC_IOTEC_CLIENT_ID ?? '';
const IOTEC_CLIENT_SECRET = process.env.EXPO_PUBLIC_IOTEC_CLIENT_SECRET ?? '';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: RouteProp<AppStackParamList, 'AnnouncementPayment'>;
};

/** Normalise a phone number to the 2567XXXXXXXX format ioTec expects. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('256')) return digits;
  if (digits.startsWith('0')) return '256' + digits.slice(1);
  return '256' + digits;
}

async function getIotecToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: IOTEC_CLIENT_ID,
    client_secret: IOTEC_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });
  const res = await fetch(IOTEC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`ioTec token request failed: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

async function collectPayment(
  token: string,
  phone: string,
  externalId: string
): Promise<string | null> {
  const res = await fetch(IOTEC_COLLECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount: ANNOUNCEMENT_FEE_UGX,
      currency: 'UGX',
      phoneNumber: phone,
      category: 'MobileMoney',
      externalId,
      description: 'Kisekka Online Announcement',
    }),
  });
  if (!res.ok) throw new Error(`ioTec collect failed: ${res.status}`);
  const json = await res.json();
  // ioTec returns the request ID in various response shapes — try both
  return (json.requestId ?? json.id ?? null) as string | null;
}

export default function AnnouncementPaymentScreen({ navigation, route }: Props) {
  const { postId, description } = route.params;
  const { user, userProfile } = useAuth();

  const [phone, setPhone] = useState(userProfile?.whatsappNumber ?? '');
  const [loading, setLoading] = useState(false);

  const initiate = async (method: PaymentMethod) => {
    if (!user) return;
    const normPhone = normalisePhone(phone);
    if (normPhone.length < 12) {
      Alert.alert('Invalid number', 'Please enter a valid Ugandan phone number.');
      return;
    }

    setLoading(true);
    try {
      const externalId = `kisekka_${user.uid}_${Date.now()}`;

      // 1. Get ioTec access token
      const token = await getIotecToken();

      // 2. Initiate STK push collect
      const iotecRequestId = await collectPayment(token, normPhone, externalId);

      // 3. Write payment document to Firestore
      const paymentRef = doc(collection(db, 'announcement_payments'));
      await setDoc(paymentRef, {
        id: paymentRef.id,
        postId,
        payerId: user.uid,
        payerPhone: normPhone,
        amount: ANNOUNCEMENT_FEE_UGX,
        currency: 'UGX',
        iotecExternalId: externalId,
        iotecRequestId: iotecRequestId ?? null,
        method,
        status: 'pending',
        createdAt: serverTimestamp(),
        confirmedAt: null,
      });

      // 4. Ensure post is in pending_payment state
      await updateDoc(doc(db, 'posts', postId), { status: 'pending_payment' });

      // 5. Navigate immediately — never block on ioTec's async confirmation
      navigation.replace('PaymentPending', { paymentId: paymentRef.id, postId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Payment error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay for Announcement</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Your announcement</Text>
          <Text style={styles.previewText} numberOfLines={3}>{description}</Text>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount due</Text>
          <Text style={styles.amountValue}>UGX {ANNOUNCEMENT_FEE_UGX.toLocaleString()}</Text>
        </View>

        {/* Phone input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Phone number to charge</Text>
          <TextInput
            style={inputStyle}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+256 700 000 000"
            placeholderTextColor={Colors.textPlaceholder}
            editable={!loading}
          />
          <Text style={styles.phoneHint}>
            A payment prompt will appear on this phone. Enter your PIN to confirm.
          </Text>
        </View>

        {/* Payment method buttons */}
        <View style={styles.methodGroup}>
          <TouchableOpacity
            style={[styles.methodBtn, styles.mtnBtn, loading && styles.btnDisabled]}
            onPress={() => initiate('mtn_momo')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.methodBtnTitle}>MTN Mobile Money</Text>
                <Text style={styles.methodBtnSub}>Check your phone for a prompt</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodBtn, styles.airtelBtn, loading && styles.btnDisabled]}
            onPress={() => initiate('airtel_money')}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.methodBtnTitle}>Airtel Money</Text>
                <Text style={styles.methodBtnSub}>Check your phone for a prompt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:    { width: 32 },
  backText:   { fontSize: 26, color: Colors.text, lineHeight: 30 },
  headerTitle: { ...Typography.h3, color: Colors.text },
  body: {
    padding: Spacing.base,
    gap: Spacing.xl,
    paddingBottom: 40,
  },
  previewCard: {
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
    backgroundColor: Colors.background,
  },
  previewLabel: { ...Typography.captionBold, color: Colors.textSecondary },
  previewText:  { ...Typography.body, color: Colors.text },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  amountLabel: { ...Typography.body, color: Colors.textSecondary },
  amountValue: { ...Typography.h3, color: Colors.text },
  fieldGroup: { gap: Spacing.xs },
  fieldLabel: { ...Typography.captionBold, color: Colors.text },
  phoneHint:  { ...Typography.caption, color: Colors.textSecondary },
  methodGroup: { gap: Spacing.sm },
  methodBtn: {
    borderRadius: BorderRadius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  mtnBtn:   { backgroundColor: '#FFCC00' },
  airtelBtn: { backgroundColor: '#E40000' },
  methodBtnTitle: { ...Typography.button, color: Colors.white, fontSize: 15 },
  methodBtnSub:   { ...Typography.caption, color: 'rgba(255,255,255,0.85)' },
  btnDisabled: { opacity: 0.6 },
});
