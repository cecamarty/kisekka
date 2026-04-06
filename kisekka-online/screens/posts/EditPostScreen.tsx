/**
 * EditPostScreen — description and categories only.
 * Post type and media are immutable after creation.
 */

import React, { useEffect, useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../app/navigation';
import { fetchPost, editPost } from '../../services/posts';
import { CATEGORIES } from '../../constants/categories';
import { Colors, Typography, Spacing, BorderRadius, inputStyle } from '../../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: RouteProp<AppStackParamList, 'EditPost'>;
};

export default function EditPostScreen({ navigation, route }: Props) {
  const { postId } = route.params;

  const [description, setDescription]   = useState('');
  const [categories, setCategories]     = useState<string[]>([]);
  const [initialising, setInitialising] = useState(true);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetchPost(postId).then((post) => {
      if (!post) { navigation.goBack(); return; }
      setDescription(post.description);
      setCategories(post.categories);
      setInitialising(false);
    });
  }, [postId]);

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Description cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await editPost(postId, { description: description.trim(), categories });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (initialising) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={1000}
          placeholder="Write your post…"
          placeholderTextColor={Colors.textPlaceholder}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Categories</Text>
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
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{cat}</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
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
  backBtn:     { width: 32 },
  backText:    { fontSize: 26, color: Colors.text, lineHeight: 30 },
  headerTitle: { ...Typography.h3, color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnText: { ...Typography.button, color: Colors.white },
  form: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: 40 },
  descriptionInput: {
    ...inputStyle,
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { ...Typography.captionBold, color: Colors.text },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
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
