/**
 * GoogleAuthHandler — not a visible screen.
 * Manages the Google OAuth flow via expo-auth-session and hands the
 * credential off to Firebase. Navigation out is handled automatically
 * by the auth state change in useAuth.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../app/navigation';
import { signInWithGoogle } from '../../services/auth';
import { Colors, Typography } from '../../constants/theme';

// Required to dismiss the auth browser on iOS after redirect
WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'GoogleAuth'>;
};

export default function GoogleAuthHandler({ navigation }: Props) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Trigger the prompt as soon as the request is ready
  useEffect(() => {
    if (request) {
      promptAsync();
    }
  }, [request]);

  // Handle the auth session response
  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const { id_token } = response.params;
      signInWithGoogle(id_token).catch((error) => {
        Alert.alert('Sign-in failed', error.message ?? 'Google sign-in failed.');
        navigation.goBack();
      });
      // Auth state change → useAuth → navigator handles the rest
    } else if (response.type === 'error') {
      Alert.alert('Sign-in failed', 'Google sign-in was cancelled or failed.');
      navigation.goBack();
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      navigation.goBack();
    }
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.label}>Signing in with Google…</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  label: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
