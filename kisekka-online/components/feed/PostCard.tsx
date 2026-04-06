import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Post } from '../../types/post';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import Avatar from '../ui/Avatar';
import PostTypeBadge from '../ui/PostTypeBadge';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MEDIA_HEIGHT = 200;
const MEDIA_WIDTH  = Math.round(MEDIA_HEIGHT * (4 / 3));

interface PostCardProps {
  post: Post;
  isSaved: boolean;
  onPress: () => void;
  onWhatsappPress: () => void;
  onSavePress: () => void;
}

function timeAgo(timestamp: { toMillis: () => number }): string {
  const diffMs  = Date.now() - timestamp.toMillis();
  const mins    = Math.floor(diffMs / 60_000);
  const hours   = Math.floor(mins / 60);
  const days    = Math.floor(hours / 24);
  if (days  > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (mins  > 0) return `${mins}m`;
  return 'now';
}

export default function PostCard({ post, isSaved, onPress, onWhatsappPress, onSavePress }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          uri={post.authorProfilePhotoUrl}
          name={post.authorShopName}
          size={42}
        />
        <View style={styles.headerText}>
          <Text style={styles.shopName} numberOfLines={1}>{post.authorShopName}</Text>
          <Text style={styles.meta}>{post.marketLocation} · {timeAgo(post.createdAt)}</Text>
        </View>
        <PostTypeBadge type={post.type} />
      </View>

      {/* Description */}
      <View style={styles.body}>
        <Text
          style={styles.description}
          numberOfLines={expanded ? undefined : 3}
        >
          {post.description}
        </Text>
        {!expanded && post.description.length > 120 && (
          <TouchableOpacity onPress={() => setExpanded(true)}>
            <Text style={styles.seeMore}>see more</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media strip */}
      {post.mediaUrls.length > 0 && (
        <FlatList
          horizontal
          data={post.mediaUrls}
          keyExtractor={(url) => url}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaList}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          )}
        />
      )}

      {/* Action row */}
      <View style={styles.actions}>
        {/* WhatsApp — fire-and-forget tracking, never blocked */}
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={onWhatsappPress}
          activeOpacity={0.8}
        >
          <Text style={styles.whatsappIcon}>📲</Text>
          <Text style={styles.whatsappLabel}>WhatsApp</Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={onSavePress} style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={[styles.actionIcon, isSaved && styles.savedIcon]}>
              {isSaved ? '🔖' : '🏷️'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  shopName: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  meta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  body: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 20,
  },
  seeMore: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mediaList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  mediaImage: {
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.shimmer,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D36620',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
  },
  whatsappIcon: {
    fontSize: 15,
  },
  whatsappLabel: {
    ...Typography.button,
    color: '#128C7E',
    fontSize: 13,
  },
  rightActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.base,
  },
  iconBtn: {
    padding: 6,
  },
  actionIcon: {
    fontSize: 18,
  },
  savedIcon: {
    opacity: 1,
  },
});
