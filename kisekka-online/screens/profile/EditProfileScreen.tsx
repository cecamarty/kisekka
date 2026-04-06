import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/auth';
import { uploadToR2 } from '../../services/r2';
import { CATEGORIES } from '../../constants/categories';
import { Colors, Typography, Spacing, BorderRadius, inputStyle } from '../../constants/theme';
import Avatar from '../../components/ui/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const { user, userProfile, refreshProfile } = useAuth();

  const [displayName,    setDisplayName]    = useState(userProfile?.displayName ?? '');
  const [shopName,       setShopName]       = useState(userProfile?.shopName ?? '');
  const [bio,            setBio]            = useState(userProfile?.bio ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(userProfile?.whatsappNumber ?? '');
  const [marketLocation, setMarketLocation] = useState(userProfile?.marketLocation ?? '');
  const [categories,     setCategories]     = useState<string[]>(userProfile?.categories ?? []);
  const [avatarUri,      setAvatarUri]      = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim() || !shopName.trim()) {
      Alert.alert('Required', 'Display name and shop name are required.');
      return;
    }

    setSaving(true);
    try {
      let profilePhotoUrl = userProfile?.profilePhotoUrl ?? null;

      if (avatarUri) {
        const ext = avatarUri.split('.').pop() ?? 'jpg';
        profilePhotoUrl = await uploadToR2(avatarUri, `profiles/${user.uid}/avatar.${ext}`);
      }

      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        shopName: shopName.trim(),
        bio: bio.trim(),
        whatsappNumber: whatsappNumber.trim(),
        marketLocation: marketLocation.trim(),
        categories,
        profilePhotoUrl,
      });

      await refreshProfile();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      console.warn('[EditProfile] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentAvatarUri = avatarUri ?? userProfile?.profilePhotoUrl ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={currentAvatarUri}
            name={displayName || 'U'}
            size={86}
          />
          <TouchableOpacity onPress={pickAvatar} style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={inputStyle}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={Colors.textPlaceholder}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={inputStyle}
            value={shopName}
            onChangeText={setShopName}
            placeholder="Your shop name"
            placeholderTextColor={Colors.textPlaceholder}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[inputStyle, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell the market about yourself…"
            placeholderTextColor={Colors.textPlaceholder}
            multiline
            maxLength={200}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>WhatsApp Number</Text>
          <TextInput
            style={inputStyle}
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
            placeholder="+256 …"
            placeholderTextColor={Colors.textPlaceholder}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Market Location / Stall</Text>
          <TextInput
            style={inputStyle}
            value={marketLocation}
            onChangeText={setMarketLocation}
            placeholder="e.g. Kisekka Market, Row C, Stall 14"
            placeholderTextColor={Colors.textPlaceholder}
          />
        </View>

        {/* Categories */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Categories</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => {
              const active = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleCategory(cat)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn:    { width: 60 },
  cancelText:   { ...Typography.body, color: Colors.textSecondary },
  headerTitle:  { ...Typography.h3, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
  form: {
    padding: Spacing.base,
    gap: Spacing.xl,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  changePhotoBtn:  {},
  changePhotoText: { ...Typography.body, color: Colors.primary },
  fieldGroup: { gap: Spacing.xs },
  label:      { ...Typography.captionBold, color: Colors.text },
  multiline:  { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive:      { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel:       { ...Typography.caption, color: Colors.textSecondary },
  chipLabelActive: { color: Colors.white, fontFamily: 'Inter_600SemiBold' },
});
