import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../app/navigation';
import { useFeed, filterPosts, FeedFilter } from '../../hooks/useFeed';
import { useAuth } from '../../hooks/useAuth';
import { incrementWhatsappTap, savePost, unsavePost } from '../../services/posts';
import { getUserProfile } from '../../services/auth';
import { Post } from '../../types/post';
import { Colors, Typography, Spacing } from '../../constants/theme';
import PostCard from '../../components/feed/PostCard';
import PostCardSkeleton from '../../components/feed/PostCardSkeleton';
import FilterBar from '../../components/feed/FilterBar';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { posts, loading, refresh, savedPostIds } = useFeed();
  const [filter, setFilter]     = useState<FeedFilter>('all');
  const [localSaved, setLocalSaved] = useState<Set<string>>(new Set());

  const isSaved = (postId: string): boolean => {
    const inServer = savedPostIds.has(postId);
    const inLocal  = localSaved.has(postId);
    // localSaved tracks optimistic toggles; XOR with server state
    return inLocal ? !inServer : inServer;
  };

  const handleWhatsapp = useCallback(async (post: Post) => {
    // 1. Track — fire and forget, never awaited
    incrementWhatsappTap(post.id);
    // 2. Fetch author's WhatsApp number then open immediately
    try {
      const profile = await getUserProfile(post.authorId);
      const number  = profile?.whatsappNumber?.replace(/\D/g, '') ?? '';
      await Linking.openURL(`whatsapp://send?phone=${number}`);
    } catch {
      Alert.alert('WhatsApp', 'Could not open WhatsApp. Make sure it is installed.');
    }
  }, []);

  const handleSave = useCallback(async (post: Post) => {
    if (!user) return;
    const currently = isSaved(post.id);
    setLocalSaved((prev) => {
      const next = new Set(prev);
      if (currently) next.delete(post.id); else next.add(post.id);
      return next;
    });
    try {
      if (currently) {
        await unsavePost(user.uid, post.id);
      } else {
        await savePost(user.uid, post.id);
      }
    } catch {
      // Revert on failure
      setLocalSaved((prev) => {
        const next = new Set(prev);
        if (currently) next.add(post.id); else next.delete(post.id);
        return next;
      });
    }
  }, [user, savedPostIds, localSaved]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = filterPosts(posts, filter);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to post something on Kisekka Online
        </Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => navigation.navigate('CreatePost')}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyBtnText}>Create First Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.navbar}>
        <Text style={styles.wordmark}>Kisekka Online</Text>
      </View>

      <FilterBar selected={filter} onChange={setFilter} />

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <PostCardSkeleton />}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isSaved={isSaved(item.id)}
              onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
              onWhatsappPress={() => handleWhatsapp(item)}
              onSavePress={() => handleSave(item)}
            />
          )}
          ListEmptyComponent={renderEmpty}
          onRefresh={refresh}
          refreshing={false}
          contentContainerStyle={displayed.length === 0 ? styles.emptyContainer : undefined}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navbar: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordmark: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing.base,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    ...Typography.button,
    color: Colors.white,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    fontFamily: 'Inter_400Regular',
    lineHeight: 34,
  },
});
