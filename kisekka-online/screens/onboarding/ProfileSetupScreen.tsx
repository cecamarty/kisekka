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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { createUserProfile } from '../../services/auth';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  inputStyle,
  primaryButton,
} from '../../constants/theme';

const CATEGORIES = [
  'Japanese Cars',
  'European Cars',
  'American Cars',
  'Trucks & Commercial',
  'Motorcycles',
  'Electronics & Electrical',
  'Tyres & Rims',
  'Body Parts',
  'Engine & Transmission',
  'Tools & Equipment',
  'General Hardware',
  'Other',
];

export default function ProfileSetupScreen() {
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [shopName, setShopName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState(
    // Pre-fill from phone auth if available
    user?.phoneNumber ?? ''
  );
  const [marketLocation, setMarketLocation] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) return Alert.alert('Required', 'Please enter your display name.');
    if (!shopName.trim()) return Alert.alert('Required', 'Please enter your shop name.');
    if (!whatsappNumber.trim()) return Alert.alert('Required', 'Please enter your WhatsApp number.');
    if (!marketLocation.trim()) return Alert.alert('Required', 'Please describe your stall location.');
    if (selectedCategories.length === 0) return Alert.alert('Required', 'Select at least one category.');

    if (!user) return;

    setLoading(true);
    try {
      // Profile photo upload to Cloudflare R2 would go here.
      // For now we store null (or a local URI as placeholder).
      await createUserProfile(user.uid, {
        displayName: displayName.trim(),
        shopName: shopName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        marketLocation: marketLocation.trim(),
        profilePhotoUrl: null, // Replace with R2 upload URL in Phase 2
        categories: selectedCategories,
      });
      // Refresh auth context so navigator switches to AppStack
      await refreshProfile();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Failed to save profile. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Set up your shop</Text>
            <Text style={styles.subtitle}>
              This is how other traders will find and know you.
            </Text>
          </View>

          {/* Profile photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoButton} onPress={pickPhoto} activeOpacity={0.8}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📷</Text>
                  <Text style={styles.photoPlaceholderLabel}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setProfilePhotoUri(null)}>
              <Text style={styles.skipPhoto}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            <Field label="Display Name" required>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Mukasa John"
                placeholderTextColor={Colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </Field>

            <Field label="Shop / Business Name" required>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Mukasa Auto Spares"
                placeholderTextColor={Colors.textMuted}
                value={shopName}
                onChangeText={setShopName}
                autoCapitalize="words"
              />
            </Field>

            <Field label="WhatsApp Number" required>
              <TextInput
                style={inputStyle}
                placeholder="+256 700 000 000"
                placeholderTextColor={Colors.textMuted}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Stall / Market Location" required>
              <TextInput
                style={[inputStyle, styles.multiline]}
                placeholder="e.g. Row 3, near the main gate, Kisekka"
                placeholderTextColor={Colors.textMuted}
                value={marketLocation}
                onChangeText={setMarketLocation}
                multiline
                numberOfLines={2}
              />
            </Field>

            {/* Category multi-select */}
            <Field label="What do you deal in?" required hint="Select all that apply">
              <View style={styles.chipGrid}>
                {CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={[Typography.button, { color: Colors.white }]}>
                Create My Profile
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Small helper component for labelled form fields
function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={fieldStyles.container}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
        {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  container: { gap: Spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { ...Typography.label },
  required: { color: Colors.error },
  hint: { ...Typography.caption },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
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
  },
  photoSection: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  photoButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  photoPreview: {
    width: 96,
    height: 96,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoPlaceholderIcon: { fontSize: 24 },
  photoPlaceholderLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  skipPhoto: {
    ...Typography.caption,
    color: Colors.primary,
  },
  form: {
    gap: Spacing.lg,
  },
  multiline: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.divider,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  chipTextActive: {
    color: Colors.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
