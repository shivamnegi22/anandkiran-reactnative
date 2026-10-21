import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, spacing } from '../theme';
import { useLanguage } from '../context/LanguageContext';

/** Anandkiran sun-rising mark (same as the website). */
export const LogoMark = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 36 36" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx="18" cy="22" r="8" fill={colors.saffron} />
    <Path d="M18 4v6M6 12l4 4M30 12l-4 4M2 24h6M28 24h6" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" />
    <Path d="M4 30h28" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);

/** Scrollable screen with safe-area padding, optional title block and pull-to-refresh. */
export const Screen = ({ title, subtitle, children, refreshing = false, onRefresh, scroll = true, right }) => {
  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  ) : null;

  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {header}
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} tintColor={colors.green} /> : undefined}
      >
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

export const Card = ({ children, style, onPress, accessibilityLabel }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>
    {action ? (
      <Pressable onPress={onAction} hitSlop={10} accessibilityRole="button">
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

const BUTTON_VARIANTS = {
  primary: { bg: colors.green, fg: '#FFFFFF', border: colors.green },
  accent: { bg: colors.saffron, fg: colors.ink, border: colors.saffron },
  outline: { bg: colors.surface, fg: colors.green, border: colors.green },
  ghost: { bg: 'transparent', fg: colors.green, border: 'transparent' },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
};

export const Button = ({ title, onPress, variant = 'primary', icon, disabled, loading, style, small }) => {
  const v = BUTTON_VARIANTS[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: v.bg, borderColor: v.border },
        (disabled || loading) && { opacity: 0.6 },
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon ? <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} accessibilityElementsHidden importantForAccessibility="no" /> : null}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
};

const BADGE_TONES = {
  green: { bg: colors.greenTint, fg: colors.green },
  saffron: { bg: colors.saffronTint, fg: colors.saffronText },
  grey: { bg: colors.ground, fg: colors.muted },
  danger: { bg: colors.dangerTint, fg: colors.danger },
};

export const Badge = ({ label, tone = 'green', icon }) => {
  const t = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
};

export const IconTile = ({ name, tone = 'green', size = 44 }) => {
  const palette = {
    green: { bg: colors.green, fg: '#FFFFFF' },
    saffron: { bg: colors.saffron, fg: colors.ink },
    soft: { bg: colors.greenTint, fg: colors.green },
    sand: { bg: colors.saffronTint, fg: colors.saffronText },
  }[tone];
  return (
    <View style={[styles.iconTile, { width: size, height: size, backgroundColor: palette.bg }]}>
      <Ionicons name={name} size={size * 0.5} color={palette.fg} />
    </View>
  );
};

export const ProgressBar = ({ value = 0, buffer = 0, height = 8, dark = false }) => (
  <View
    style={[styles.track, { height, backgroundColor: dark ? 'rgba(255,255,255,0.2)' : colors.line }]}
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
  >
    {buffer > 0 ? <View style={[styles.fill, { width: `${Math.min(1, buffer) * 100}%`, backgroundColor: dark ? 'rgba(255,255,255,0.25)' : colors.lineStrong }]} /> : null}
    <View style={[styles.fill, { width: `${Math.min(1, value) * 100}%`, backgroundColor: colors.saffron }]} />
  </View>
);

export const InfoRow = ({ label, value, last }) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

export const LoadingState = () => {
  const { t } = useLanguage();
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.green} />
      <Text style={styles.stateText}>{t.common.loading}</Text>
    </View>
  );
};

export const ErrorState = ({ onRetry }) => {
  const { t } = useLanguage();
  return (
    <View style={styles.state}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
      <Text style={styles.stateTitle}>{t.common.errorTitle}</Text>
      <Text style={styles.stateText}>{t.common.errorBody}</Text>
      {onRetry ? <Button title={t.common.retry} onPress={onRetry} variant="outline" icon="refresh" small style={{ marginTop: spacing.md }} /> : null}
    </View>
  );
};

export const EmptyState = ({ icon = 'leaf-outline', title, text, children }) => (
  <View style={[styles.state, styles.emptyCard]}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={28} color={colors.green} />
    </View>
    {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
    <Text style={styles.stateText}>{text}</Text>
    {children}
  </View>
);

/** Shown when a backend endpoint isn't live yet (404). */
export const UnavailableState = ({ icon }) => {
  const { t } = useLanguage();
  return <EmptyState icon={icon || 'time-outline'} title={t.common.comingSoonTitle} text={t.unavailable} />;
};

/** Renders the right state for a useApi() result, or the children when ready. */
export const AsyncContent = ({ query, empty, isEmpty, unavailableIcon, children }) => {
  if (query.status === 'loading' && !query.data) return <LoadingState />;
  if (query.status === 'unavailable') return <UnavailableState icon={unavailableIcon} />;
  if (query.status === 'error' && !query.data) return <ErrorState onRetry={query.reload} />;
  if (isEmpty && isEmpty(query.data)) return empty;
  return children(query.data);
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { padding: spacing.xl, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 34, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26, color: colors.ink },
  sectionAction: { fontFamily: fonts.semibold, fontSize: 14, color: colors.green },
  button: {
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSmall: { minHeight: 44, paddingHorizontal: spacing.lg },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
  iconTile: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { width: '100%', borderRadius: 99, overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, flexShrink: 0 },
  infoValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, flex: 1, textAlign: 'right' },
  state: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: spacing.xl, gap: spacing.sm },
  stateTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink, textAlign: 'center' },
  stateText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  emptyCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed' },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.greenTint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  shadow,
});
