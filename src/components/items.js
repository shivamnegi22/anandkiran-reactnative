import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, IconTile, ProgressBar } from './ui';
import { pick, useLanguage } from '../context/LanguageContext';
import { colors, fonts, spacing } from '../theme';
import { formatDate, formatDay, formatTime } from '../utils/format';
import { WEEKDAYS } from '../i18n/strings';

const THERAPY_ICONS = {
  physiotherapy: 'body-outline',
  'music-therapy': 'musical-notes-outline',
  'occupational-therapy': 'hand-left-outline',
  'speech-therapy': 'chatbubbles-outline',
};

export const therapyIcon = (type) => THERAPY_ICONS[type] || 'medkit-outline';

export const statusBadge = (status, t) => {
  if (status === 'completed') return <Badge label={t.plan.completed} tone="grey" icon="checkmark" />;
  if (status === 'paused') return <Badge label={t.plan.paused} tone="saffron" />;
  return <Badge label={t.plan.active} tone="green" />;
};

const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

/** Backend days ("Mon", "monday", 1) shown in the patient's language. */
export const dayName = (day, lang) => {
  const index = typeof day === 'number' ? day : DAY_INDEX[String(day).slice(0, 3).toLowerCase()];
  return index === undefined ? String(day) : WEEKDAYS[lang][index];
};

/** Days + time + frequency on one line, e.g. "सोमवार, बुधवार · 10:30 am". */
export const scheduleText = (therapy, lang = 'hi') =>
  [therapy.days.map((day) => dayName(day, lang)).join(', '), therapy.time ? formatTime(therapy.time) : '', pick(therapy.frequency, lang)]
    .filter(Boolean)
    .join(' · ');

export function TherapyCard({ therapy, onPress }) {
  const { t, lang } = useLanguage();
  const progress = therapy.sessionsTotal > 0 ? therapy.sessionsDone / therapy.sessionsTotal : 0;
  const name = pick(therapy.name, lang);
  return (
    <Card onPress={onPress} accessibilityLabel={name}>
      <View style={styles.row}>
        <IconTile name={therapyIcon(therapy.type)} tone={therapy.type === 'music-therapy' || therapy.type === 'speech-therapy' ? 'saffron' : 'green'} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{name}</Text>
          {therapy.therapist ? <Text style={styles.meta}>{t.common.therapist}: {pick(therapy.therapist, lang)}</Text> : null}
        </View>
        {statusBadge(therapy.status, t)}
      </View>
      {scheduleText(therapy, lang) ? (
        <View style={styles.scheduleRow}>
          <Ionicons name="calendar-outline" size={15} color={colors.green} />
          <Text style={styles.schedule}>{scheduleText(therapy, lang)}</Text>
        </View>
      ) : null}
      {therapy.sessionsTotal > 0 ? (
        <View style={{ marginTop: spacing.md, gap: 6 }}>
          <Text style={styles.meta}>{t.plan.sessionsOf(therapy.sessionsDone, therapy.sessionsTotal)}</Text>
          <ProgressBar value={progress} />
        </View>
      ) : null}
    </Card>
  );
}

const HISTORY_META = {
  session: { icon: 'medkit-outline', tone: 'green' },
  exercise: { icon: 'fitness-outline', tone: 'soft' },
  music: { icon: 'musical-notes-outline', tone: 'saffron' },
  test: { icon: 'clipboard-outline', tone: 'sand' },
  plan: { icon: 'document-text-outline', tone: 'soft' },
};

export function HistoryItem({ item, compact = false }) {
  const { t, lang } = useLanguage();
  const meta = HISTORY_META[item.type] || HISTORY_META.session;
  const title = pick(item.title, lang) || pick(item.therapy, lang) || t.history[item.type];
  const statusTone = item.status === 'missed' ? 'danger' : item.status === 'cancelled' ? 'grey' : 'green';
  const statusLabel = t.history[item.status];
  const date = item.date ? `${formatDay(item.date, lang, t)} · ${formatTime(item.date)}` : '';

  return (
    <View style={[styles.historyItem, compact && { paddingVertical: 10 }]}>
      <IconTile name={meta.icon} tone={meta.tone} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.historyTop}>
          <Text style={styles.historyTitle} numberOfLines={compact ? 1 : 2}>{title}</Text>
          {statusLabel && !compact ? <Badge label={statusLabel} tone={statusTone} /> : null}
        </View>
        {date ? <Text style={styles.meta}>{date}</Text> : null}
        {!compact && item.therapist ? <Text style={styles.meta}>{t.common.therapist}: {pick(item.therapist, lang)}</Text> : null}
        {!compact && item.durationMinutes ? <Text style={styles.meta}>{t.history.duration}: {item.durationMinutes} {t.common.minutes}</Text> : null}
        {!compact && item.notes ? <Text style={styles.notes}>{pick(item.notes, lang)}</Text> : null}
      </View>
    </View>
  );
}

export const dateLine = (value, lang) => formatDate(value, lang);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.muted },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, backgroundColor: colors.ground, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  schedule: { fontFamily: fonts.medium, fontSize: 13, color: colors.ink, flex: 1 },
  historyItem: { flexDirection: 'row', gap: spacing.md, paddingVertical: 14, alignItems: 'flex-start' },
  historyTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  historyTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, color: colors.ink, flex: 1 },
  notes: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.ink, backgroundColor: colors.ground, borderRadius: 10, padding: 10, marginTop: 6 },
});
