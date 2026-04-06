import React from 'react';
import { FlatList, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { FeedFilter } from '../../hooks/useFeed';
import { Colors, Typography, Spacing } from '../../constants/theme';

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'listing',      label: 'Parts' },
  { key: 'looking_for',  label: 'Looking For' },
  { key: 'announcement', label: 'Announcements' },
];

interface FilterBarProps {
  selected: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

export default function FilterBar({ selected, onChange }: FilterBarProps) {
  return (
    <FlatList
      horizontal
      data={FILTERS}
      keyExtractor={(item) => item.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        const active = item.key === selected;
        return (
          <TouchableOpacity
            onPress={() => onChange(item.key)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.white,
  },
});
