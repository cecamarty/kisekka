import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';

import { AuthProvider, useAuth } from './hooks/useAuth';
import RootNavigation from './app/navigation';
import { Colors } from './constants/theme';
import ToastNotification, { ToastManager } from './components/ui/Toast';
import { registerForPushNotifications } from './services/notifications';

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

// ── NotificationBootstrap ─────────────────────────────────────────────────────
// Registers push token once the user has a profile (i.e. after onboarding),
// and wires up the foreground / tap handlers.
// Rendered inside AuthProvider so it can read user state.

function NotificationBootstrap() {
  const { user, userProfile } = useAuth();
  const registeredRef = useRef(false);

  // Register push token after onboarding completes — not during onboarding
  useEffect(() => {
    if (!user || !userProfile || registeredRef.current) return;
    registeredRef.current = true;
    registerForPushNotifications(user.uid).catch(() => {});
  }, [user, userProfile]);

  // Foreground notification → show in-app toast
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      ToastManager.show({
        title: title ?? 'Kisekka Online',
        body: body ?? undefined,
      });
    });
    return () => sub.remove();
  }, []);

  // Notification tap → deep link navigation
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (!data) return;

      if (data.type === 'follow' && data.userId) {
        Linking.openURL(`kisekka://UserProfile?userId=${data.userId}`).catch(() => {});
      } else if ((data.type === 'post' || data.type === 'payment') && data.postId) {
        Linking.openURL(`kisekka://PostDetail?postId=${data.postId}`).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NotificationBootstrap />
        <RootNavigation />
        <StatusBar style="dark" />
        {/* Toast sits above everything — must be outside NavigationContainer */}
        <ToastNotification />
      </AuthProvider>
    </View>
  );
}
