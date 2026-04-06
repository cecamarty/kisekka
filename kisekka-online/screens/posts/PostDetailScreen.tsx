import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import { fetchPost, deletePost, incrementWhatsappTap } from '../../services/posts';
import { getUserProfile, UserProfile } from '../../services/auth';
import { Post } from '../../types/post';
import { Colors, Typography, Spacing, BorderRadius, primaryButton } from '../../constants/theme';
import Avatar from '../../components/ui/Avatar';
import PostTypeBadge from '../../components/ui/PostTypeBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  route: RouteProp<AppStackParamList, 'PostDetail'>;
};

export default function PostDetailScreen({ navigation, route }: Props) {
  const { postId } = route.params;
  const { user } = useAuth();

  const [post, setPost]         = useState<Post | null>(null);
  const [author, setAuthor]     = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  const isOwn = post?.authorId === user?.uid;
  const { following, loading: followLoading, toggle } = useFollow(post?.authorId ?? '');

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          fetchPost(postId),
          fetchPost(postId).then((p2) => p2 ? getUserProfile(p2.authorId) : null),
        ]);
        setPost(p);
        setAuthor(a);
      } catch {
        Alert.alert('Error', 'Could not load post.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  const handleWhatsapp = async () => {
    if (!post || !author) return;
    incrementWhatsappTap(post.id);
    try {
      const number = author.whatsappNumber?.replace(/\D/g, '') ?? '';
      await Linking.openURL(`whatsapp://send?phone=${number}`);
    } catch {
      Alert.alert('WhatsApp', 'Could not open WhatsApp. Make sure it is installed.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Nav bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <PostTypeBadge type={post.type} />
        {isOwn && (
          <TouchableOpacity onPress={handleDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Media viewer — swipeable paged FlatList */}
        {/* DEFERRED: pinch-to-zoom — needs gesture handler config */}
        {post.mediaUrls.length > 0 && (
          <View>
            <FlatList
              horizontal
              pagingEnabled
              data={post.mediaUrls}
              keyExtractor={(url) => url}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImg(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.mediaImage}
                  resizeMode="cover"
                />
              )}
            />
            {post.mediaUrls.length > 1 && (
              <View style={styles.dots}>
                {post.mediaUrls.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, i === activeImg && styles.dotActive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          {/* Description */}
          <Text style={styles.description}>{post.description}</Text>

          {/* Author section */}
          <View style={styles.authorCard}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() => post.authorId !== user?.uid &&
                navigation.navigate('UserProfile', { userId: post.authorId })}
            >
              <Avatar
                uri={post.authorProfilePhotoUrl}
                name={post.authorShopName}
                size={48}
              />
              <View style={styles.authorText}>
                <Text style={styles.authorName}>{post.authorShopName}</Text>
                <Text style={styles.authorLocation}>{post.marketLocation}</Text>
              </View>
            </TouchableOpacity>

            {isOwn ? null : (
              <TouchableOpacity
                onPress={toggle}
                disabled={followLoading}
                style={[styles.followBtn, following && styles.followingBtn]}
              >
                <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
                  {following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* WhatsApp CTA */}
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleWhatsapp}
            activeOpacity={0.85}
          >
            <Text style={styles.whatsappIcon}>📲</Text>
            <Text style={styles.whatsappLabel}>Contact on WhatsApp</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:    { padding: 4, width: 32 },
  backText:   { fontSize: 26, color: Colors.text, lineHeight: 30 },
  deleteText: { ...Typography.caption, color: Colors.error },
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: Colors.shimmer,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary },
  content: {
    padding: Spacing.base,
    gap: Spacing.xl,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 22,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    gap: Spacing.base,
  },
  authorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorText:     { flex: 1 },
  authorName:     { ...Typography.bodyMedium, color: Colors.text },
  authorLocation: { ...Typography.caption, color: Colors.textSecondary },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  followingBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText:    { ...Typography.button, color: Colors.white, fontSize: 13 },
  followingBtnText: { color: Colors.text },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: BorderRadius.sm,
  },
  whatsappIcon:  { fontSize: 20 },
  whatsappLabel: { ...Typography.button, color: Colors.white, fontSize: 15 },
});
