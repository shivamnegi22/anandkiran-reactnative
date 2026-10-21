import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getHistory, UnavailableError } from '../api/patient';
import { useLanguage } from '../context/LanguageContext';
import { Button, Card, EmptyState, ErrorState, LoadingState, Screen, UnavailableState } from '../components/ui';
import { HistoryItem } from '../components/items';
import Segmented from '../components/Segmented';
import { formatMonth } from '../utils/format';
import { colors, fonts, spacing } from '../theme';

const PAGE_SIZE = 20;

/** Full therapy record: when each session / exercise / music / test happened, newest first. */
export default function HistoryScreen() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState({ status: 'loading', items: [], page: 1, totalPages: 1, refreshing: false, loadingMore: false });
  const requestId = useRef(0);

  const load = useCallback(async ({ page = 1, refreshing = false } = {}) => {
    const id = ++requestId.current;
    setState((prev) => ({
      ...prev,
      status: page === 1 && !refreshing ? 'loading' : prev.status,
      refreshing,
      loadingMore: page > 1,
    }));
    try {
      const result = await getHistory({ page, limit: PAGE_SIZE, type: filter });
      if (id !== requestId.current) return;
      setState((prev) => ({
        status: 'ready',
        items: page === 1 ? result.items : [...prev.items, ...result.items],
        page: result.page,
        totalPages: result.totalPages,
        refreshing: false,
        loadingMore: false,
      }));
    } catch (error) {
      if (id !== requestId.current) return;
      setState((prev) => ({
        ...prev,
        status: error instanceof UnavailableError ? 'unavailable' : prev.items.length ? 'ready' : 'error',
        refreshing: false,
        loadingMore: false,
      }));
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Group by month for the timeline headings.
  const groups = [];
  state.items.forEach((item) => {
    const month = formatMonth(item.date, lang) || '—';
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  });

  const filters = ['all', 'session', 'exercise', 'music', 'test'].map((value) => ({ value, label: t.history[value] }));

  let body;
  if (state.status === 'loading') body = <LoadingState />;
  else if (state.status === 'unavailable') body = <UnavailableState icon="time-outline" />;
  else if (state.status === 'error') body = <ErrorState onRetry={() => load()} />;
  else if (!state.items.length) body = <EmptyState icon="time-outline" text={filter === 'all' ? t.history.empty : t.history.emptyFilter} />;
  else {
    body = (
      <>
        {groups.map((group) => (
          <View key={group.month} style={{ marginBottom: spacing.lg }}>
            <Text style={styles.month} accessibilityRole="header">{group.month}</Text>
            <Card style={{ paddingVertical: 4 }}>
              {group.items.map((item, index) => (
                <View key={item.id} style={index > 0 ? styles.divider : null}>
                  <HistoryItem item={item} />
                </View>
              ))}
            </Card>
          </View>
        ))}
        {state.page < state.totalPages ? (
          <Button title={t.history.loadMore} variant="outline" icon="chevron-down" loading={state.loadingMore} onPress={() => load({ page: state.page + 1 })} />
        ) : null}
      </>
    );
  }

  return (
    <Screen title={t.history.title} subtitle={t.history.subtitle} refreshing={state.refreshing} onRefresh={() => load({ refreshing: true })}>
      <View style={{ marginBottom: spacing.lg }}>
        <Segmented scrollable value={filter} onChange={setFilter} options={filters} />
      </View>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  month: { fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.5, color: colors.saffronText, marginBottom: spacing.sm, marginLeft: 4 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
});
