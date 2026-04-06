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
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { createPost, generatePostId } from '../../services/posts';
import { fetchFollowerTokens } from '../../services/follows';
import { sendNewPostNotifications } from '../../services/notifications';
import { uploadToR2 } from '../../services/r2';
import { PostType } from '../../types/post';
import { CATEGORIES } from '../../constants/categories';
import { NOTIFICATION_FOLLOWER_CAP } from '../../constants/limits';
import { Colors, Typography, Spacing, BorderRadius, inputStyle } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

const POST_TYPES: { type: PostType; emoji: string; title: string; subtitle: string }[] = [
  { type: 'listing',      emoji: '📦', title: 'Listing',       subtitle: 'Show what you have' },
  { type: 'looking_for',  emoji: '🔍', title: 'Looking For',   subtitle: 'Find what you need' },
  { type: 'announcement', emoji: '📢', title: 'Announcement',  subtitle: 'Tell the market' },
];

export default function CreatePostScreen({ navigation }: Props) {
  const { user, userProfile } = useAuth();

  const [step, setStep]                       = useState<1 | 2>(1);
  const [postType, setPostType]               = useState<PostType | null>(null);
  const [description, setDescription]         = useState('');
  const [selectedCategories, setCategories]   = useState<string[]>([]);
  const [mediaUris, setMediaUris]             = useState<string[]>([]);
  const [expiryDays, setExpiryDays]           = useState('1');
  const [uploading, setUploading]             = useState(false);
  const [uploadProgress, setUploadProgress]   = useState<Record<number, number>>({});

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const pickMedia = async () => {
    if (mediaUris.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - mediaUris.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setMediaUris((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  };

  const removeMedia = (uri: string) => {
    setMediaUris((prev) => prev.filter((u) => u !== uri));
  };

  const handleSubmit = async () => {
    if (!user || !userProfile || !postType) return;
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a description.');
      return;
    }

    setUploading(true);
    try {
      const postId = generatePostId();
      const mediaUrls: string[] = [];

      // Upload media files sequentially to R2
      for (let i = 0; i < mediaUris.length; i++) {
        const ext = mediaUris[i].split('.').pop() ?? 'jpg';
        const key = `posts/${postId}/${i}.${ext}`;
        const url = await uploadToR2(mediaUris[i], key, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [i]: progress }));
        });
        mediaUrls.push(url);
      }

      // Compute expiry for announcements
      let expiresAt = null;
      if (postType === 'announcement') {
        const days = Math.min(7, Math.max(1, parseInt(expiryDays, 10) || 1));
        const { Timestamp } = await import('firebase/firestore');
        expiresAt = Timestamp.fromDate(
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        );
      }

      // Announcements start in pending_payment — they go live after payment confirmation.
      // All other post types are active immediately.
      const status = postType === 'announcement' ? 'pending_payment' : 'active';

      await createPost(
        {
          authorId:              user.uid,
          authorName:            userProfile.displayName,
          authorShopName:        userProfile.shopName,
          authorProfilePhotoUrl: userProfile.profilePhotoUrl,
          type:                  postType,
          description:           description.trim(),
          mediaUrls,
          categories:            selectedCategories,
          marketLocation:        userProfile.marketLocation,
          expiresAt,
          status,
        },
        postId
      );

      if (postType === 'announcement') {
        // Navigate to payment screen — post is already written with pending_payment status
        navigation.replace('AnnouncementPayment', {
          postId,
          description: description.trim(),
        });
      } else {
        // Notify followers (fire-and-forget)
        fetchFollowerTokens(user.uid, NOTIFICATION_FOLLOWER_CAP)
          .then((tokens) => sendNewPostNotifications(tokens, userProfile.shopName, description.trim(), postId))
          .catch(() => {});
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      console.warn('[CreatePost] Submit failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // ── Step 1: Type selector ──────────────────────────────────────────────────

  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.typeList}>
          <Text style={styles.typeHeading}>What are you posting?</Text>
          {POST_TYPES.map(({ type, emoji, title, subtitle }) => (
            <TouchableOpacity
              key={type}
              style={styles.typeCard}
              onPress={() => { setPostType(type); setStep(2); }}
              activeOpacity={0.8}
            >
              <Text style={styles.typeEmoji}>{emoji}</Text>
              <View style={styles.typeText}>
                <Text style={styles.typeTitle}>{title}</Text>
                <Text style={styles.typeSubtitle}>{subtitle}</Text>
              </View>
              <Text style={styles.typeChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Post details ───────────────────────────────────────────────────

  const totalProgress = mediaUris.length > 0
    ? Object.values(uploadProgress).reduce((a, b) => a + b, 0) / mediaUris.length
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)} style={styles.closeBtn}>
          <Text style={styles.closeText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {POST_TYPES.find((t) => t.type === postType)?.title}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={uploading}
          style={styles.postBtn}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {/* Upload progress bar */}
        {uploading && mediaUris.length > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${totalProgress * 100}%` }]} />
          </View>
        )}

        {/* Description */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Write your post…"
          placeholderTextColor={Colors.textPlaceholder}
          multiline
          value={description}
          onChangeText={setDescription}
          maxLength={1000}
        />

        {/* Expiry (announcements only) */}
        {postType === 'announcement' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Expires in (days, max 7)</Text>
            {/* DEFERRED: replace with proper date picker when native modules are available */}
            <TextInput
              style={[inputStyle, styles.smallInput]}
              keyboardType="number-pad"
              maxLength={1}
              value={expiryDays}
              onChangeText={setExpiryDays}
              placeholder="1–7"
              placeholderTextColor={Colors.textPlaceholder}
            />
          </View>
        )}

        {/* Categories */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Categories (optional)</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
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

        {/* Media */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Photos (up to 5)</Text>
          <FlatList
            horizontal
            data={[...mediaUris, mediaUris.length < 5 ? '__add__' : null].filter(Boolean) as string[]}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaRow}
            renderItem={({ item, index }) => {
              if (item === '__add__') {
                return (
                  <TouchableOpacity onPress={pickMedia} style={styles.mediaAdd}>
                    <Text style={styles.mediaAddIcon}>+</Text>
                  </TouchableOpacity>
                );
              }
              const progressVal = uploadProgress[index];
              return (
                <View style={styles.mediaThumb}>
                  <Image source={{ uri: item }} style={styles.mediaImg} resizeMode="cover" />
                  {progressVal !== undefined && progressVal < 1 && (
                    <View style={styles.mediaOverlay}>
                      <Text style={styles.mediaProgressText}>
                        {Math.round(progressVal * 100)}%
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removeMedia(item)}
                    style={styles.mediaRemove}
                  >
                    <Text style={styles.mediaRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
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
  closeBtn:    { width: 32, alignItems: 'center' },
  closeText:   { fontSize: 18, color: Colors.text },
  headerTitle: { ...Typography.h3, color: Colors.text },
  postBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnText: { ...Typography.button, color: Colors.white },

  // Step 1
  typeList:    { padding: Spacing.base, gap: Spacing.sm },
  typeHeading: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    gap: Spacing.base,
    backgroundColor: Colors.white,
  },
  typeEmoji:    { fontSize: 32 },
  typeText:     { flex: 1 },
  typeTitle:    { ...Typography.bodyMedium, color: Colors.text },
  typeSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  typeChevron:  { fontSize: 24, color: Colors.textSecondary },

  // Step 2
  form: {
    padding: Spacing.base,
    gap: Spacing.xl,
    paddingBottom: 40,
  },
  descriptionInput: {
    ...inputStyle,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { ...Typography.captionBold, color: Colors.text },
  smallInput: { width: 80 },

  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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

  mediaRow:     { gap: Spacing.sm, paddingBottom: 4 },
  mediaThumb:   { position: 'relative' },
  mediaImg:     { width: 90, height: 90, borderRadius: BorderRadius.sm, backgroundColor: Colors.shimmer },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaProgressText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13 },
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaRemoveText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold' },
  mediaAdd: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  mediaAddIcon: { fontSize: 28, color: Colors.textSecondary },

  progressBar: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
