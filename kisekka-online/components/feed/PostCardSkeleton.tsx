import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from '../ui/SkeletonBox';
import { Colors, Spacing } from '../../constants/theme';

export default function PostCardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width={42} height={42} borderRadius={21} />
        <View style={styles.headerText}>
          <SkeletonBox width={140} height={13} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width={100} height={11} borderRadius={4} />
        </View>
      </View>
      {/* Body text */}
      <View style={styles.body}>
        <SkeletonBox width="100%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="90%" height={13} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="60%" height={13} borderRadius={4} />
      </View>
      {/* Image placeholder */}
      <SkeletonBox width={240} height={160} borderRadius={4} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
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
    gap: 4,
  },
  body: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  image: {
    marginLeft: Spacing.base,
  },
});
