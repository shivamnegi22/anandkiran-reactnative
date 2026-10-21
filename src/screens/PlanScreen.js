import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getExercises, getTherapyPlan } from '../api/patient';
import { pick, useLanguage } from '../context/LanguageContext';
import useApi from '../utils/useApi';
import { AsyncContent, Badge, Card, EmptyState, IconTile, Screen } from '../components/ui';
import { TherapyCard } from '../components/items';
import Segmented from '../components/Segmented';
import { colors, fonts, spacing } from '../theme';

export default function PlanScreen({ navigation, route }) {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState(route.params?.tab || 'therapies');
  const plan = useApi(getTherapyPlan);
  const exercises = useApi(getExercises);

  // Refresh when coming back (e.g. after marking an exercise done).
  const latest = useRef({ plan, exercises });
  latest.current = { plan, exercises };
  useEffect(() => navigation.addListener('focus', () => {
    const { plan: p, exercises: e } = latest.current;
    if (p.data) p.refresh();
    if (e.data) e.refresh();
  }), [navigation]);

  const active = tab === 'therapies' ? plan : exercises;

  return (
    <Screen title={t.plan.title} subtitle={t.plan.subtitle} refreshing={active.refreshing} onRefresh={active.refresh}>
      <View style={{ marginBottom: spacing.lg }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'therapies', label: t.plan.therapies },
            { value: 'exercises', label: t.plan.exercises },
          ]}
        />
      </View>

      {tab === 'therapies' ? (
        <AsyncContent
          query={plan}
          unavailableIcon="medkit-outline"
          isEmpty={(data) => !data?.therapies?.length}
          empty={<EmptyState icon="medkit-outline" text={t.plan.empty} />}
        >
          {(data) =>
            data.therapies.map((therapy) => (
              <TherapyCard key={therapy.id} therapy={therapy} onPress={() => navigation.navigate('TherapyDetail', { therapy })} />
            ))
          }
        </AsyncContent>
      ) : (
        <AsyncContent
          query={exercises}
          unavailableIcon="fitness-outline"
          isEmpty={(data) => !data?.length}
          empty={<EmptyState icon="fitness-outline" text={t.plan.exercisesEmpty} />}
        >
          {(data) =>
            data.map((exercise) => (
              <Card key={exercise.id} onPress={() => navigation.navigate('ExerciseDetail', { exercise })} accessibilityLabel={pick(exercise.title, lang)}>
                <View style={styles.row}>
                  <IconTile name={exercise.videoUrl ? 'play' : 'fitness-outline'} tone={exercise.doneToday ? 'soft' : 'green'} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.title}>{pick(exercise.title, lang)}</Text>
                    <Text style={styles.meta}>{[pick(exercise.therapy, lang), pick(exercise.repetitions, lang), pick(exercise.frequency, lang)].filter(Boolean).join(' · ')}</Text>
                  </View>
                  {exercise.doneToday ? <Badge label={t.plan.doneToday} tone="green" icon="checkmark" /> : <Badge label={t.plan.pending} tone="saffron" />}
                </View>
              </Card>
            ))
          }
        </AsyncContent>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
});
