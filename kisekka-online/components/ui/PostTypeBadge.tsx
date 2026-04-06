import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PostType } from '../../types/post';
import { Colors, Typography } from '../../constants/theme';

const CONFIG: Record<PostType, { label: string; color: string }> = {
  listing:      { label: 'Listing',      color: Colors.primary },
  looking_for:  { label: 'Looking For',  color: Colors.amber },
  announcement: { label: 'Announcement', color: Colors.purple },
};

export default function PostTypeBadge({ type }: { type: PostType }) {
  const { label, color } = CONFIG[type];
  return (
    <View style={[styles.badge, { backgroundColor: color + '1A' }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.micro,
    fontFamily: 'Inter_600SemiBold',
  },
});
