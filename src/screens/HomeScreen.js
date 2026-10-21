import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExercises, getHistory, getMusicTracks, getTherapyPlan } from '../api/patient';
import { useAuth } from '../context/AuthContext';
import { pick, useLanguage } from '../context/LanguageContext';
import { CLINIC } from '../config/env';
import useApi from '../utils/useApi';
import { formatDate, formatDay, formatTime, isPast } from '../utils/format';
import { Badge, Button, Card, IconTile, LoadingState, LogoMark, Screen, SectionHeader } from '../components/ui';
import { HistoryItem, TherapyCard } from '../components/items';
import { colors, fonts, radius, spacing } from '../theme';

// Each section loads on its own: one missing endpoint doesn't hide the rest.
const settle = async (promise) => {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error };
  }
};

export default function HomeScreen({ navigation }) {
  const { t, lang } = useLanguage();
  const { user, refreshProfile } = useAuth();
  const query = useApi(async () => {
    const [plan, exercises, tracks, history] = await Promise.all([
      settle(getTherapyPlan()),
      settle(getExercises()),
      settle(getMusicTracks()),
      settle(getHistory({ limit: 3 })),
      refreshProfile().catch(() => null),
    ]);
    return { plan, exercises, tracks, history };
  });

  const firstName = (user?.fullName || '').split(' ')[0];
  const data = query.data;
  const plan = data?.plan?.ok ? data.plan.value : null;
  const exercises = data?.exercises?.ok ? data.exercises.value : null;
  const tracks = data?.tracks?.ok ? data.tracks.value : null;
  const recent = data?.history?.ok ? data.history.value.items : null;
  const activeTherapies = (plan?.therapies || []).filter((therapy) => therapy.status !== 'completed');
  const exercisesLeft = exercises ? exercises.filter((exercise) => !exercise.doneToday).length : 0;
  const expired = user?.expiryDate && isPast(user.expiryDate);

  return (
    <Screen refreshing={query.refreshing} onRefresh={query.refresh}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <LogoMark size={30} />
          <Text style={styles.brandName}>{t.appName}</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t.tabs.profile} style={styles.avatar}>
          <Text style={styles.avatarText}>{(firstName[0] || 'A').toUpperCase()}</Text>
        </Pressable>
      </View>

      <Text style={styles.greeting} accessibilityRole="header">
        {t.home.greeting}{firstName ? `, ${firstName}` : ''}
      </Text>
      <View style={styles.metaRow}>
        {user?.registrationNumber ? <Text style={styles.meta}>{t.home.regNo}: {user.registrationNumber}</Text> : null}
        {user?.expiryDate && !expired ? <Badge label={`${formatDate(user.expiryDate, lang)} ${t.home.validTill}`} tone="green" icon="shield-checkmark" /> : null}
      </View>

      {expired ? (
        <Card style={styles.expired}>
          <Ionicons name="alert-circle" size={22} color={colors.danger} />
          <Text style={styles.expiredText}>{t.home.accessExpired}</Text>
          <Button title={t.common.callClinic} icon="call-outline" variant="danger" small onPress={() => Linking.openURL(CLINIC.phoneHref)} />
        </Card>
      ) : null}

      {/* Next session */}
      <View style={styles.nextCard}>
        <Text style={styles.nextLabel}>{t.home.nextSession}</Text>
        {plan?.nextSession?.date ? (
          <>
            <Text style={styles.nextDate}>{formatDay(plan.nextSession.date, lang, t)}</Text>
            <Text style={styles.nextDetail}>
              {[formatTime(plan.nextSession.time || plan.nextSession.date), pick(plan.nextSession.therapy, lang)].filter(Boolean).join(' · ')}
            </Text>
            {plan.nextSession.therapist ? <Text style={styles.nextDetail}>{t.common.therapist}: {pick(plan.nextSession.therapist, lang)}</Text> : null}
          </>
        ) : (
          <>
            <Text style={styles.nextEmpty}>{query.status === 'loading' ? t.common.loading : t.home.noNextSession}</Text>
            <Button title={t.home.bookSession} icon="calendar-outline" variant="accent" small style={{ alignSelf: 'flex-start', marginTop: spacing.md }} onPress={() => Linking.openURL(CLINIC.bookingUrl)} />
          </>
        )}
        <View style={styles.nextCircle} />
      </View>

      {query.status === 'loading' && !data ? <LoadingState /> : (
        <>
          {/* Today */}
          <SectionHeader title={t.home.todayTitle} />
          <View style={styles.tiles}>
            <Card style={styles.tile} onPress={() => navigation.navigate('Plan')} accessibilityLabel={t.plan.exercises}>
              <IconTile name="fitness-outline" tone="soft" />
              <Text style={styles.tileTitle}>{t.plan.exercises}</Text>
              <Text style={styles.tileText}>
                {!exercises ? t.home.noExercises : exercises.length === 0 ? t.home.noExercises : exercisesLeft === 0 ? t.home.exercisesDone : t.home.exercisesLeft(exercisesLeft)}
              </Text>
            </Card>
            <Card style={styles.tile} onPress={() => navigation.navigate('Music')} accessibilityLabel={t.music.title}>
              <IconTile name="musical-notes-outline" tone="sand" />
              <Text style={styles.tileTitle}>{t.music.title}</Text>
              <Text style={styles.tileText}>{tracks ? t.home.musicCount(tracks.length) : t.music.subtitle}</Text>
            </Card>
          </View>

          {/* Ongoing therapies */}
          {activeTherapies.length > 0 ? (
            <>
              <SectionHeader title={t.home.activeTherapies} action={t.common.viewAll} onAction={() => navigation.navigate('Plan')} />
              {activeTherapies.slice(0, 2).map((therapy) => (
                <TherapyCard key={therapy.id} therapy={therapy} onPress={() => navigation.navigate('TherapyDetail', { therapy })} />
              ))}
            </>
          ) : null}

          {/* Recent activity */}
          {recent && recent.length > 0 ? (
            <>
              <SectionHeader title={t.home.recentActivity} action={t.common.viewAll} onAction={() => navigation.navigate('History')} />
              <Card style={{ paddingVertical: 4 }}>
                {recent.map((item, index) => (
                  <View key={item.id} style={index > 0 ? styles.divider : null}>
                    <HistoryItem item={item} compact />
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {/* Help */}
          <Card style={styles.help}>
            <Text style={styles.helpTitle}>{t.home.needHelp}</Text>
            <Text style={styles.meta}>{CLINIC.phone}</Text>
            <View style={styles.helpActions}>
              <Button title={t.common.call} icon="call-outline" variant="outline" small onPress={() => Linking.openURL(CLINIC.phoneHref)} style={{ flex: 1 }} />
              <Button title={t.common.whatsapp} icon="logo-whatsapp" variant="outline" small onPress={() => Linking.openURL(CLINIC.whatsappHref)} style={{ flex: 1 }} />
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 17, color: '#FFFFFF' },
  greeting: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 38, color: colors.ink },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: spacing.xl },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  expired: { backgroundColor: colors.dangerTint, borderColor: colors.dangerTint, gap: spacing.sm },
  expiredText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 22, color: colors.ink },
  nextCard: { backgroundColor: colors.greenDark, borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden' },
  nextLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.saffron },
  nextDate: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: '#FFFFFF', marginTop: 6 },
  nextDetail: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.onDark },
  nextEmpty: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 25, color: '#FFFFFF', marginTop: 6 },
  nextCircle: { position: 'absolute', right: -50, top: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: colors.saffron, opacity: 0.14 },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: { flex: 1, gap: 6, marginBottom: 0 },
  tileTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.ink, marginTop: 6 },
  tileText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  help: { marginTop: spacing.xl, backgroundColor: colors.saffronTint, borderColor: colors.saffronTint, gap: 4 },
  helpTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  helpActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
