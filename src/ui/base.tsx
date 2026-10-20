import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { colors, font, radius, shadow } from '../theme';

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'over';

const variants: Record<Variant, TextStyle> = {
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 38, color: colors.ink },
  title: { fontFamily: font.bold, fontSize: 22, lineHeight: 27, color: colors.ink },
  heading: { fontFamily: font.semi, fontSize: 16, lineHeight: 21, color: colors.ink },
  body: { fontFamily: font.body, fontSize: 14, lineHeight: 20, color: colors.inkSoft },
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 17, color: colors.inkSoft },
  caption: { fontFamily: font.body, fontSize: 11.5, lineHeight: 15, color: colors.inkMuted },
  over: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
};

export function T({
  v = 'body',
  color,
  center,
  style,
  ...rest
}: TextProps & { v?: Variant; color?: string; center?: boolean }) {
  return (
    <Text
      {...rest}
      style={[variants[v], color ? { color } : null, center ? { textAlign: 'center' } : null, style]}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export function Screen({
  children,
  scroll = true,
  pad = 16,
  bottom = 24,
  style,
  ...rest
}: ScrollViewProps & { scroll?: boolean; pad?: number; bottom?: number }) {
  const insets = useSafeAreaInsets();
  if (!scroll) {
    return (
      <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }, style as any]}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      {...rest}
      style={[{ flex: 1, backgroundColor: colors.bg }, style]}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: pad,
        paddingBottom: insets.bottom + bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  soft,
  ...rest
}: ViewProps & { soft?: boolean }) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: soft ? colors.cardAlt : colors.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.lineSoft,
          padding: 16,
        },
        soft ? null : shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({ children, style, gap = 8, ...rest }: ViewProps & { gap?: number }) {
  return (
    <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

export function Spacer({ h = 12 }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.lineSoft }, style]} />;
}

/* ------------------------------------------------------------------ *
 * Buttons
 * ------------------------------------------------------------------ */

export function tap(enabled = true) {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function tapSuccess(enabled = true) {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

type BtnTone = 'primary' | 'quiet' | 'ghost' | 'dark' | 'sage';

export function Btn({
  label,
  onPress,
  tone = 'primary',
  icon,
  disabled,
  loading,
  small,
  style,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  tone?: BtnTone;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const tones: Record<BtnTone, { bg: string; fg: string; border?: string }> = {
    primary: { bg: colors.coral, fg: '#FFF8F2' },
    sage: { bg: colors.sage, fg: '#F7FBF7' },
    quiet: { bg: colors.card, fg: colors.ink, border: colors.line },
    ghost: { bg: 'transparent', fg: colors.inkSoft },
    dark: { bg: colors.espresso, fg: colors.onDark },
  };
  const t = tones[tone];
  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: t.bg,
          borderRadius: radius.pill,
          paddingVertical: small ? 9 : 15,
          paddingHorizontal: small ? 14 : 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 14 : 17} color={t.fg} /> : null}
          <Text
            style={{
              fontFamily: font.bold,
              fontSize: small ? 13 : 15,
              color: t.fg,
              letterSpacing: 0.1,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({
  name,
  onPress,
  size = 20,
  color = colors.inkSoft,
  bg,
  style,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          width: size + 18,
          height: size + 18,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg ?? 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = colors.sage,
  icon,
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        paddingVertical: small ? 6 : 9,
        paddingHorizontal: small ? 11 : 14,
        borderRadius: radius.pill,
        backgroundColor: active ? tone : colors.card,
        borderWidth: 1,
        borderColor: active ? tone : colors.line,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? (
        <Ionicons name={icon} size={13} color={active ? '#FFF8F2' : colors.inkSoft} />
      ) : null}
      <Text
        style={{
          fontFamily: font.semi,
          fontSize: small ? 12 : 13,
          color: active ? '#FFF8F2' : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Pill({
  children,
  bg = colors.cardAlt,
  fg = colors.inkSoft,
  style,
}: {
  children: React.ReactNode;
  bg?: string;
  fg?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.pill,
          paddingHorizontal: 9,
          paddingVertical: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text style={{ fontFamily: font.semi, fontSize: 11.5, color: fg }}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Progress
 * ------------------------------------------------------------------ */

export function Bar({
  pct,
  color = colors.sage,
  height = 6,
  track = colors.lineSoft,
  style,
}: {
  pct: number;
  color?: string;
  height?: number;
  track?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { height, backgroundColor: track, borderRadius: height, overflow: 'hidden' },
        style,
      ]}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height,
        }}
      />
    </View>
  );
}

export function Ring({
  pct,
  size = 72,
  stroke = 8,
  color = colors.sage,
  track = colors.lineSoft,
  children,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(circ * clamped) / 100} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Misc
 * ------------------------------------------------------------------ */

export function EmojiTile({
  emoji,
  size = 38,
  bg = colors.cardAlt,
  fontSize,
}: {
  emoji: string;
  size?: number;
  bg?: string;
  fontSize?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 3.2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: fontSize ?? size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: 10, marginTop: 18 }}>
      <T v="over">{children}</T>
      {right}
    </Row>
  );
}

export function Empty({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body?: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 34, gap: 6 }}>
      <Text style={{ fontSize: 34 }}>{emoji}</Text>
      <T v="heading">{title}</T>
      {body ? (
        <T v="body" center style={{ maxWidth: 260 }}>
          {body}
        </T>
      ) : null}
    </View>
  );
}

export function Press({ children, style, ...rest }: PressableProps & { children: React.ReactNode }) {
  return (
    <Pressable
      {...rest}
      style={(state) => [
        { opacity: state.pressed ? 0.75 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {children}
    </Pressable>
  );
}
