import { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { markExerciseDone, UnavailableError } from '../api/patient';
import { pick, useLanguage } from '../context/LanguageContext';
import { Button, Card, InfoRow } from '../components/ui';
import { formatDay } from '../utils/format';
import { colors, fonts, radius, spacing } from '../theme';

export default function ExerciseDetailScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const exercise = route.params?.exercise;
  const [done, setDone] = useState(Boolean(exercise?.doneToday));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const title = pick(exercise?.title, lang);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  if (!exercise) return null;

  const onMarkDone = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await markExerciseDone(exercise.id);
      setDone(true);
      setMessage({ tone: 'ok', text: t.exercise.saved });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof UnavailableError ? t.unavailable : t.exercise.saveFailed });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: colors.ground }} contentContainerStyle={styles.content}>
      {exercise.videoUrl ? (
        <Video
          source={{ uri: exercise.videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping={false}
          accessibilityLabel={title}
        />
      ) : (
        <View style={[styles.video, styles.noVideo]}>
          <Ionicons name="videocam-off-outline" size={32} color={colors.muted} />
          <Text style={styles.meta}>{t.exercise.noVideo}</Text>
        </View>
      )}

      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {exercise.description ? <Text style={styles.body}>{pick(exercise.description, lang)}</Text> : null}

      <Card>
        {exercise.therapy ? <InfoRow label={t.tabs.plan} value={pick(exercise.therapy, lang)} /> : null}
        <InfoRow label={t.exercise.reps} value={pick(exercise.repetitions, lang)} />
        <InfoRow label={t.exercise.frequency} value={pick(exercise.frequency, lang)} />
        <InfoRow label={t.exercise.lastDone} value={exercise.lastDoneAt ? formatDay(exercise.lastDoneAt, lang, t) : '—'} last />
      </Card>

      {exercise.steps.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>{t.exercise.steps}</Text>
          {exercise.steps.map((step, index) => (
            <View key={index} style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{index + 1}</Text></View>
              <Text style={styles.stepText}>{pick(step, lang)}</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {message ? (
        <Text style={[styles.message, message.tone === 'error' ? styles.messageError : styles.messageOk]} accessibilityLiveRegion="polite">
          {message.text}
        </Text>
      ) : null}

      <Button
        title={done ? t.exercise.doneToday : saving ? t.exercise.marking : t.exercise.markDone}
        icon={done ? 'checkmark-circle' : 'checkmark-circle-outline'}
        variant={done ? 'outline' : 'primary'}
        disabled={done}
        loading={saving}
        onPress={onMarkDone}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: 40 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, backgroundColor: '#000', marginBottom: spacing.lg, overflow: 'hidden' },
  noVideo: { backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: colors.ink, marginBottom: spacing.sm },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.ink, marginBottom: spacing.lg },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  step: { flexDirection: 'row', gap: spacing.md, paddingVertical: 8, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  stepText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.ink, flex: 1 },
  message: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  messageOk: { backgroundColor: colors.greenTint, color: colors.green },
  messageError: { backgroundColor: colors.dangerTint, color: colors.danger },
});
