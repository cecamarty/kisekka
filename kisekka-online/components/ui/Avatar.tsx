import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  uri: string | null;
  name: string;
  size: number;
}

// Derive a stable background color from the name string
function colorFromName(name: string): string {
  const palette = [
    '#0095F6', '#ED4956', '#F59E0B', '#7C3AED',
    '#10B981', '#F97316', '#3B82F6', '#EC4899',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function Avatar({ uri, name, size }: AvatarProps) {
  const radius = size / 2;
  const fontSize = size * 0.38;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: radius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: colorFromName(name) },
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#EFEFEF',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
  },
});
