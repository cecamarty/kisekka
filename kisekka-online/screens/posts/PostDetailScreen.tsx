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
  Modal,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../app/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import {
  fetchPost,
  deletePost,
  reportPost,
  REPORT_REASONS,
  ReportReason,
  incrementWhatsappTap,
} from '../../services/posts';
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

function isExpiredPost(post: Post): boolean {
  if (!post.expiresAt) return false;
  return post.expiresAt.toMillis() < Date.now();
}

export default function PostDetailScreen({ navigation, route }: Props) {
  const { postId } = route.params;
  const { user } = useAuth();

  const [post, setPost]             = useState<Post | null>(null);
  const [author, setAuthor]         = useState<UserProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeImg, setActiveImg]   = useState(0);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reporting, setReporting]   = useState(false);

  const isOwn = post?.authorId === user?.uid;
  const { following, loading: followLoading, toggle } = useFollow(post?.authorId ?? '');

  useEffect(() => {
    (async () => {
      try {
        const p = await fetchPost(postId);
        if (!p) { navigation.goBack(); return; }
        const a = await getUserProfile(p.authorId);
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
    setMenuOpen(false);
    Alert.alert('Delete Post', 'Are you sure? This cannot be undone.', [
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

  const handleEdit = () => {
    setMenuOpen(false);
    navigation.navigate('EditPost', { postId });
  };

  const handleReport = async (reason: ReportReason) => {
    if (!user) return;
    setReporting(true);
    try {
      await reportPost(postId, user.uid, reason);
      setReportModal(false);
      Alert.alert('Reported', 'Thank you. Our team will review this post.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Try again.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const expired = isExpiredPost(post) || post.status === 'expired';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Nav bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <PostTypeBadge type={post.type} />
        <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Expired banner */}
      {expired && post.type === 'announcement' && (
        <View style={styles.expiredBanner}>
          <Text style={styles.expiredBannerText}>This announcement has expired</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Media viewer */}
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
                  <View key={i} style={[styles.dot, i === activeImg && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.description}>{post.description}</Text>

          {/* Author section */}
          <View style={styles.authorCard}>
            <TouchableOpacity
              style={styles.authorInfo}
              onPress={() =>
                post.authorId !== user?.uid &&
                navigation.navigate('UserProfile', { userId: post.authorId })
              }
            >
              <Avatar uri={post.authorProfilePhotoUrl} name={post.authorShopName} size={48} />
              <View style={styles.authorText}>
                <Text style={styles.authorName}>{post.authorShopName}</Text>
                <Text style={styles.authorLocation}>{post.marketLocation}</Text>
              </View>
            </TouchableOpacity>

            {!isOwn && (
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

          {/* WhatsApp CTA — hidden for expired announcements */}
          {!expired && (
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={handleWhatsapp}
              activeOpacity={0.85}
            >
              <Text style={styles.whatsappIcon}>📲</Text>
              <Text style={styles.whatsappLabel}>Contact on WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Three-dot action sheet */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={styles.sheet}>
            {isOwn ? (
              <>
                <TouchableOpacity style={styles.sheetItem} onPress={handleEdit}>
                  <Text style={styles.sheetItemText}>Edit Post</Text>
                </TouchableOpacity>
                <View style={styles.sheetDivider} />
                <TouchableOpacity style={styles.sheetItem} onPress={handleDelete}>
                  <Text style={[styles.sheetItemText, { color: Colors.error }]}>Delete Post</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => { setMenuOpen(false); setReportModal(true); }}
              >
                <Text style={[styles.sheetItemText, { color: Colors.error }]}>Report Post</Text>
              </TouchableOpacity>
            )}
            <View style={styles.sheetDivider} />
            <TouchableOpacity style={styles.sheetItem} onPress={() => setMenuOpen(false)}>
              <Text style={[styles.sheetItemText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report reason picker */}
      <Modal
        visible={reportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModal(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setReportModal(false)}>
          <View style={styles.reportSheet}>
            <Text style={styles.reportTitle}>Why are you reporting this?</Text>
            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={styles.reportItem}
                onPress={() => handleReport(reason)}
                disabled={reporting}
              >
                {reporting ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.reportItemText}>{reason}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:  { padding: 4, width: 32 },
  backText: { fontSize: 26, color: Colors.text, lineHeight: 30 },
  menuBtn:  { padding: 4, width: 32, alignItems: 'flex-end' },
  menuIcon: { fontSize: 22, color: Colors.text },

  expiredBanner: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  expiredBannerText: { ...Typography.captionBold, color: '#92400E', textAlign: 'center' },

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
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary },
  content:   { padding: Spacing.base, gap: Spacing.xl },
  description: { ...Typography.body, color: Colors.text, lineHeight: 22 },
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

  // Sheet / overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  sheetDivider: { height: 1, backgroundColor: Colors.border },
  sheetItem:    { paddingVertical: 16, paddingHorizontal: Spacing.base },
  sheetItemText: { ...Typography.body, color: Colors.text, textAlign: 'center' },

  // Report sheet
  reportSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    paddingTop: Spacing.base,
    overflow: 'hidden',
  },
  reportTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  reportItem:     { paddingVertical: 14, paddingHorizontal: Spacing.base },
  reportItemText: { ...Typography.body, color: Colors.text },
});
