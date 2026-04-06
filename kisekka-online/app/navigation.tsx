/**
 * Root navigation.
 * Three stacks controlled entirely by auth state from useAuth:
 *   loading     → SplashScreen (blank while Firebase resolves)
 *   !user       → AuthStack
 *   user, !profile → OnboardingStack
 *   user, profile  → AppStack
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/theme';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import GoogleAuthHandler from '../screens/auth/GoogleAuthHandler';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import HomeScreen from '../screens/app/HomeScreen';

// ── Param list types ──────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Welcome: undefined;
  PhoneEntry: undefined;
  OTPVerification: { phoneNumber: string };
  GoogleAuth: undefined;
};

export type OnboardingStackParamList = {
  ProfileSetup: undefined;
};

export type AppStackParamList = {
  Home: undefined;
};

// ── Stack navigators ──────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="GoogleAuth" component={GoogleAuthHandler} />
    </AuthStack.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={HomeScreen} />
    </AppStack.Navigator>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function RootNavigation() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthNavigator />
      ) : !userProfile ? (
        <OnboardingNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
