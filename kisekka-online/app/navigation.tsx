/**
 * Root navigation.
 *
 * Auth state (from useAuth) drives which navigator is shown:
 *   loading        → spinner
 *   !user          → AuthStack
 *   user, !profile → OnboardingStack
 *   user, profile  → AppStack (bottom tabs + modals)
 *
 * AppStack structure:
 *   BottomTabs
 *     Home       → HomeScreen
 *     Discover   → DiscoverScreen
 *     Create     → intercepted by tabPress → opens CreatePost modal
 *     Profile    → ProfileScreen (own)
 *   + modal / push screens layered above the tabs:
 *     CreatePost, PostDetail, UserProfile, EditProfile,
 *     AnnouncementPayment, PaymentPending,
 *     SavedPosts, EditPost
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants/theme';

// Auth screens
import WelcomeScreen         from '../screens/auth/WelcomeScreen';
import PhoneEntryScreen      from '../screens/auth/PhoneEntryScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import GoogleAuthHandler     from '../screens/auth/GoogleAuthHandler';

// Onboarding
import ProfileSetupScreen    from '../screens/onboarding/ProfileSetupScreen';

// App screens
import HomeScreen            from '../screens/app/HomeScreen';
import DiscoverScreen        from '../screens/discover/DiscoverScreen';
import CreatePostScreen      from '../screens/posts/CreatePostScreen';
import PostDetailScreen      from '../screens/posts/PostDetailScreen';
import EditPostScreen        from '../screens/posts/EditPostScreen';
import ProfileScreen         from '../screens/profile/ProfileScreen';
import EditProfileScreen     from '../screens/profile/EditProfileScreen';
import SavedPostsScreen      from '../screens/profile/SavedPostsScreen';
import AnnouncementPaymentScreen from '../screens/payments/AnnouncementPaymentScreen';
import PaymentPendingScreen  from '../screens/payments/PaymentPendingScreen';

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

export type BottomTabParamList = {
  Home:     undefined;
  Discover: undefined;
  Create:   undefined;
  Profile:  undefined;
};

export type AppStackParamList = {
  BottomTabs:          undefined;
  CreatePost:          undefined;
  PostDetail:          { postId: string };
  UserProfile:         { userId: string };
  EditProfile:         undefined;
  EditPost:            { postId: string };
  SavedPosts:          undefined;
  AnnouncementPayment: { postId: string; description: string };
  PaymentPending:      { paymentId: string; postId: string };
};

// ── Navigators ────────────────────────────────────────────────────────────────

const AuthStack       = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AppStack        = createNativeStackNavigator<AppStackParamList>();
const BottomTab       = createBottomTabNavigator<BottomTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome"         component={WelcomeScreen} />
      <AuthStack.Screen name="PhoneEntry"      component={PhoneEntryScreen} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <AuthStack.Screen name="GoogleAuth"      component={GoogleAuthHandler} />
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

// Custom Create tab button — intercepts press and opens the CreatePost modal
// instead of switching tabs. The "Create" tab itself never renders a screen.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CreateTabButton({ children, onPress }: { children: React.ReactNode; onPress?: (...args: any[]) => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.createTabBtn}
      activeOpacity={0.85}
    >
      <View style={styles.createTabInner}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </View>
    </TouchableOpacity>
  );
}

function BottomTabNavigator() {
  return (
    <BottomTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.iconMuted,
        tabBarStyle: {
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          backgroundColor: Colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_600SemiBold',
        },
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Create"
        component={View}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreatePost');
          },
        })}
      />
      <BottomTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="BottomTabs"  component={BottomTabNavigator} />
      <AppStack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ presentation: 'modal' }}
      />
      <AppStack.Screen name="PostDetail"  component={PostDetailScreen} />
      <AppStack.Screen name="UserProfile" component={ProfileScreen} />
      <AppStack.Screen name="EditProfile" component={EditProfileScreen} />
      <AppStack.Screen name="EditPost"    component={EditPostScreen} />
      <AppStack.Screen name="SavedPosts"  component={SavedPostsScreen} />
      <AppStack.Screen
        name="AnnouncementPayment"
        component={AnnouncementPaymentScreen}
        options={{ presentation: 'modal' }}
      />
      <AppStack.Screen name="PaymentPending" component={PaymentPendingScreen} />
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
  createTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    top: -6,
  },
  createTabInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
});
