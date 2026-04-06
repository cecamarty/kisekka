/**
 * DiscoverScreen
 *
 * Section A — Search (always visible at top):
 *   Debounced 400 ms query against active posts and user list.
 *   Results show Posts and Shops with type label.
 *
 * Section B — Browse by Category (shown when search is empty):
 *   Grid of all 12 category chips.
 *   Tapping one filters the feed using useFeed + client-side filter.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getDocs, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { AppStackParamList } from '../../app/navigation';
import { db } from '../../services/firebase';
import { UserProfile } from '../../services/auth';
import { Post } from '../../types/post';
import { CATEGORIES } from '../../constants/categories';
import { SEARCH_DEBOUNCE_MS } from '../../constants/limits';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/ui/Avatar';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
};

type SearchResult =
  | { kind: 'post'; post: Post }
  | { kind: 'user'; user: UserProfile & { uid: string } };

// ── Data fetching helpers ─────────────────────────────────────────────────────

let cachedPosts: Post[] = [];
let cachedUsers: (UserProfile & { uid: string })[] = [];

async function loadSearchData(): Promise<void> {
  const [postSnap, userSnap] = await Promise.all([
    getDocs(query(
      collection(db, 'posts'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(200)
    )),
    getDocs(collection(db, 'users')),
  ]);
  cachedPosts = postSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
  cachedUsers = userSnap.docs.map((d) => ({
    uid: d.id,
    ...(d.data() as UserProfile),
  }));
}

function searchResults(q: string): SearchResult[] {
  const lower = q.toLowerCase().trim();
  if (!lower) return [];

  const matchedPosts: SearchResult[] = cachedPosts
    .filter((p) => p.description.toLowerCase().includes(lower))
    .slice(0, 10)
    .map((p) => ({ kind: 'post', post: p }));

  const matchedUsers: SearchResult[] = cachedUsers
    .filter(
      (u) =>
        u.shopName.toLowerCase().includes(lower) ||
        u.displayName.toLowerCase().includes(lower)
    )
    .slice(0, 5)
    .map((u) => ({ kind: 'user', user: u }));

  return [...matchedUsers, ...matchedPosts];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DiscoverScreen({ navigation }: Props) {
  const [query, setQuery]               = useState('');
  const [debouncedQ, setDebouncedQ]     = useState('');
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [dataLoaded, setDataLoaded]     = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load search corpus once on mount
  useEffect(() => {
    loadSearchData().then(() => setDataLoaded(true)).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQ(query), SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  useEffect(() => {
    if (!dataLoaded || !debouncedQ.trim()) {
      setResults([]);
      return;
    }
    setResults(searchResults(debouncedQ));
  }, [debouncedQ, dataLoaded]);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQ('');
    setResults([]);
  }, []);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderResult = useCallback(({ item }: { item: SearchResult }) => {
    if (item.kind === 'user') {
      return (
        <TouchableOpacity
          style={styles.resultRow}
          onPress={() => navigation.navigate('UserProfile', { userId: item.user.uid })}
          activeOpacity={0.75}
        >
          <Avatar uri={item.user.profilePhotoUrl} name={item.user.displayName} size={40} />
          <View style={styles.resultText}>
            <Text style={styles.resultTitle}>{item.user.shopName}</Text>
            <Text style={styles.resultMeta}>{item.user.marketLocation}</Text>
          </View>
          <View style={styles.kindBadge}>
            <Text style={styles.kindBadgeText}>Shop</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => navigation.navigate('PostDetail', { postId: item.post.id })}
        activeOpacity={0.75}
      >
        {item.post.mediaUrls[0] ? (
          <Image source={{ uri: item.post.mediaUrls[0] }} style={styles.resultThumb} />
        ) : (
          <View style={[styles.resultThumb, styles.resultThumbEmpty]} />
        )}
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.post.description}</Text>
          <Text style={styles.resultMeta}>{item.post.authorShopName}</Text>
        </View>
        <View style={[styles.kindBadge, styles.kindBadgePost]}>
          <Text style={styles.kindBadgeText}>Post</Text>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  // ── Main render ─────────────────────────────────────────────────────────────

  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search posts, shops…"
          placeholderTextColor={Colors.textPlaceholder}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        /* ── Search results ── */
        <FlatList
          data={results}
          keyExtractor={(item, i) =>
            item.kind === 'post' ? `post-${item.post.id}` : `user-${item.user.uid}-${i}`
          }
          renderItem={renderResult}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {!dataLoaded ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <Text style={styles.emptyText}>No results for "{debouncedQ}"</Text>
              )}
            </View>
          }
        />
      ) : (
        /* ── Browse by Category ── */
        <FlatList
          data={CATEGORIES}
          keyExtractor={(c) => c}
          numColumns={2}
          contentContainerStyle={styles.categoryGrid}
          columnWrapperStyle={styles.categoryRow}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Browse by Category</Text>
              {activeCategory && (
                <TouchableOpacity onPress={() => setActiveCategory(null)}>
                  <Text style={styles.clearFilter}>Clear filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: cat }) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setActiveCategory(active ? null : cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBg,
  },
  searchIcon:  { fontSize: 16, marginRight: 6, color: Colors.textSecondary },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 10,
  },
  clearBtn:     { padding: 6 },
  clearBtnText: { ...Typography.caption, color: Colors.textSecondary },

  // Results
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  resultThumb: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.shimmer,
  },
  resultThumbEmpty: { backgroundColor: Colors.divider },
  resultText:  { flex: 1, gap: 2 },
  resultTitle: { ...Typography.bodyMedium, color: Colors.text },
  resultMeta:  { ...Typography.caption, color: Colors.textSecondary },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  kindBadgePost: { backgroundColor: Colors.divider },
  kindBadgeText: { ...Typography.micro, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  emptyState: { padding: Spacing.xxxl, alignItems: 'center' },
  emptyText:  { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  // Category grid
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  clearFilter:  { ...Typography.caption, color: Colors.primary },
  categoryGrid: { paddingHorizontal: Spacing.base, paddingBottom: 32 },
  categoryRow:  { gap: Spacing.sm, marginBottom: Spacing.sm },
  categoryChip: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText:       { ...Typography.bodyMedium, color: Colors.text },
  categoryChipTextActive: { color: Colors.white },
});
