import { useLayoutEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pick, useLanguage } from '../context/LanguageContext';
import { Card, IconTile, InfoRow, ProgressBar } from '../components/ui';
import { scheduleText, statusBadge, therapyIcon } from '../components/items';
import { formatDate } from '../utils/format';
import { colors, fonts, radius, spacing } from '../theme';

export default function TherapyDetailScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const therapy = route.params?.therapy;
  const name = pick(therapy?.name, lang);

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  if (!therapy) return null;
  const progress = therapy.sessionsTotal > 0 ? therapy.sessionsDone / therapy.sessionsTotal : 0;

  return (
    <ScrollView style={{ backgroundColor: colors.ground }} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <IconTile name={therapyIcon(therapy.type)} tone="saffron" size={56} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.heroTitle} accessibilityRole="header">{name}</Text>
          {statusBadge(therapy.status, t)}
        </View>
      </View>

      {therapy.description ? <Text style={styles.body}>{pick(therapy.description, lang)}</Text> : null}

      <Card>
        <InfoRow label={t.common.therapist} value={pick(therapy.therapist, lang)} />
        <InfoRow label={t.plan.schedule} value={scheduleText(therapy, lang)} />
        <InfoRow label={t.plan.started} value={formatDate(therapy.startDate, lang)} />
        <InfoRow label={t.plan.ends} value={formatDate(therapy.endDate, lang)} last />
      </Card>

      {therapy.sessionsTotal > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>{t.plan.progress}</Text>
          <Text style={styles.meta}>{t.plan.sessionsOf(therapy.sessionsDone, therapy.sessionsTotal)}</Text>
          <View style={{ marginTop: spacing.sm }}><ProgressBar value={progress} height={10} /></View>
        </Card>
      ) : null}

      {therapy.goals.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>{t.plan.goals}</Text>
          {therapy.goals.map((goal, index) => (
            <View key={index} style={styles.goal}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.goalText}>{pick(goal, lang)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {therapy.notes ? (
        <Card style={{ backgroundColor: colors.saffronTint, borderColor: colors.saffronTint }}>
          <Text style={styles.cardTitle}>{t.plan.notes}</Text>
          <Text style={styles.body}>{pick(therapy.notes, lang)}</Text>
        </Card>
      ) : null}

      {therapy.guides.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>{t.plan.guides}</Text>
          {therapy.guides.map((guide, index) => (
            <Pressable key={index} style={styles.guide} onPress={() => guide.url && Linking.openURL(guide.url)} accessibilityRole="link">
              <Ionicons name={guide.type === 'pdf' ? 'document-text-outline' : 'play-circle-outline'} size={22} color={colors.green} />
              <Text style={styles.guideText}>{pick(guide.title, lang)}</Text>
              <Ionicons name="open-outline" size={16} color={colors.muted} />
            </Pressable>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.lg },
  heroTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.ink, marginBottom: spacing.lg },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginBottom: 6 },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  goal: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingVertical: 6 },
  goalText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink, flex: 1 },
  guide: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, minHeight: 48, borderTopWidth: 1, borderTopColor: colors.line },
  guideText: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, flex: 1 },
});
