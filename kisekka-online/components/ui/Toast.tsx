/**
 * In-app ToastNotification component.
 *
 * Slides in from the top for 3 seconds then auto-dismisses.
 * Used for foreground push notifications and system feedback (e.g. "Announcement is now live!").
 *
 * Usage via the ToastManager singleton:
 *   ToastManager.show({ title: 'Hello', body: 'World' });
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export interface ToastMessage {
  title: string;
  body?: string;
  onPress?: () => void;
}

// ── Singleton emitter ─────────────────────────────────────────────────────────

type Listener = (msg: ToastMessage) => void;
let _listener: Listener | null = null;

export const ToastManager = {
  show(msg: ToastMessage) {
    _listener?.(msg);
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

const TOAST_DURATION_MS = 3000;

export default function ToastNotification() {
  const [visible, setVisible]   = useState(false);
  const [message, setMessage]   = useState<ToastMessage | null>(null);
  const slideY = useRef(new Animated.Value(-100)).current;
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (timer.current) clearTimeout(timer.current);
    Animated.timing(slideY, { toValue: -100, duration: 250, useNativeDriver: true }).start(() =>
      setVisible(false)
    );
  };

  const show = (msg: ToastMessage) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(msg);
    setVisible(true);
    slideY.setValue(-100);
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    timer.current = setTimeout(dismiss, TOAST_DURATION_MS);
  };

  useEffect(() => {
    _listener = show;
    return () => { _listener = null; };
  }, []);

  if (!visible || !message) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity
        style={styles.inner}
        onPress={() => { message.onPress?.(); dismiss(); }}
        activeOpacity={0.9}
      >
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>{message.title}</Text>
          {message.body ? (
            <Text style={styles.body} numberOfLines={2}>{message.body}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 9999,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    gap: Spacing.sm,
  },
  textBlock: { flex: 1, gap: 2 },
  title: { ...Typography.bodyMedium, color: Colors.white, fontSize: 13 },
  body:  { ...Typography.caption,   color: 'rgba(255,255,255,0.75)' },
  closeBtn:  { padding: 4 },
  closeText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
});
