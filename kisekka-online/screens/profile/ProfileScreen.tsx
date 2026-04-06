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
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import { getUserProfile, UserProfile } from '../../services/auth';
import { fetchUserPosts } from '../../services/posts';
import { Post } from '../../types/post';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import Avatar from '../../components/ui/Avatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_ITEM = Math.floor((SCREEN_WIDTH - 2) / 3); // 3-column grid with 1px gaps

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: RouteProp<AppStackParamList, 'UserProfile'> | { params?: undefined };
};

export default function ProfileScreen({ navigation, route }: Props) {
  const { user, userProfile: ownProfile } = useAuth();
  // If no userId param, show own profile
  const targetId = (route as RouteProp<AppStackParamList, 'UserProfile'>).params?.userId ?? user?.uid ?? '';
  const isOwn    = targetId === user?.uid;

  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [posts,   setPosts]     = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);

  const { following, toggle, loading: followLoading } = useFollow(targetId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, userPosts] = await Promise.all([
        getUserProfile(targetId),
        fetchUserPosts(targetId),
      ]);
      setProfile(p);
      setPosts(userPosts);
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  const headerComponent = (
    <View style={styles.header}>
      {/* Back button for other user's profile */}
      {!isOwn && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      )}

      {/* Avatar + stats */}
      <View style={styles.avatarRow}>
        <Avatar uri={profile.profilePhotoUrl} name={profile.displayName} size={86} />
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{profile.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{profile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.shopName}>{profile.shopName}</Text>
        <Text style={styles.location}>{profile.marketLocation}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      {/* Category chips */}
      {profile.categories.length > 0 && (
        <View style={styles.chips}>
          {profile.categories.map((cat) => (
            <View key={cat} style={styles.chip}>
              <Text style={styles.chipLabel}>{cat}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action button */}
      {isOwn ? (
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.editBtn, following && styles.followingBtn]}
          onPress={toggle}
          disabled={followLoading}
        >
          <Text style={[styles.editBtnText, following && styles.followingBtnText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        ListHeaderComponent={headerComponent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
            style={styles.gridItem}
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
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        columnWrapperStyle={styles.gridRow}
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
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  backRow:  { marginBottom: Spacing.sm },
  backText: { ...Typography.body, color: Colors.primary },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem:  { alignItems: 'center' },
  statNum:   { ...Typography.h2, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  bioSection: { marginTop: Spacing.sm, gap: 2 },
  displayName: { ...Typography.bodyMedium, color: Colors.text },
  shopName:    { ...Typography.body, color: Colors.textSecondary },
  location:    { ...Typography.caption, color: Colors.textSecondary },
  bio:         { ...Typography.body, color: Colors.text, marginTop: 4 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
  },
  chipLabel: { ...Typography.micro, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  editBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editBtnText: { ...Typography.button, color: Colors.text, fontSize: 13 },
  followingBtn:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  followingBtnText: { color: Colors.white },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
  },
  gridRow:    { gap: 1 },
  gridItem:   { flex: 1 / 3 },
  gridImage:  { width: '100%', aspectRatio: 1, backgroundColor: Colors.shimmer },
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
});
