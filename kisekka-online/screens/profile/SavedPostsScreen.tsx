import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { fetchSavedPosts } from '../../services/posts';
import { Post } from '../../types/post';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = Math.floor((SCREEN_WIDTH - 2) / 3);

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

type SavedItem = Post | null; // null means post was deleted

export default function SavedPostsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [items, setItems]   = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const posts = await fetchSavedPosts(user.uid);
      setItems(posts);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
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
        <Text style={styles.headerTitle}>Saved Posts</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, i) => (item ? item.id : `deleted-${i}`)}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔖</Text>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon on any post to save it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (!item) {
            // Post was deleted
            return (
              <View style={[styles.gridItem, styles.deletedItem]}>
                <Text style={styles.deletedText}>No longer available</Text>
              </View>
            );
          }
          return (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              activeOpacity={0.85}
            >
              {item.mediaUrls[0] ? (
                <Image
                  source={{ uri: item.mediaUrls[0] }}
                  style={styles.gridImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.gridImage, styles.gridNoMedia]}>
                  <Text style={styles.gridNoMediaText} numberOfLines={3}>
                    {item.description}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
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
  container:  { flex: 1, backgroundColor: Colors.white },
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
  gridRow:  { gap: 1 },
  gridItem: { flex: 1 / 3 },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.shimmer,
  },
  gridNoMedia: {
    backgroundColor: Colors.background,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridNoMediaText: {
    ...Typography.micro,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  deletedItem: {
    backgroundColor: Colors.divider,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  deletedText: {
    ...Typography.micro,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIcon:     { fontSize: 48 },
  emptyTitle:    { ...Typography.h3, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
});
