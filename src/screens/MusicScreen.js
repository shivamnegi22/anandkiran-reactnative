import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { getMusicTracks, streamUrl } from '../api/patient';
import { pick, useLanguage } from '../context/LanguageContext';
import useApi from '../utils/useApi';
import { formatDuration } from '../utils/format';
import { AsyncContent, Card, EmptyState, ProgressBar, Screen } from '../components/ui';
import { colors, fonts, radius, spacing } from '../theme';

/*
 * Music therapy player: one track at a time, resumes where each track was paused.
 * Tracks stream from the backend with the patient's token, which is how the clinic sees
 * listening activity in the admin "Patient Reports".
 */
export default function MusicScreen() {
  const { t, lang } = useLanguage();
  const query = useApi(getMusicTracks);
  const soundRef = useRef(null);
  const positions = useRef({}); // track key -> last position (ms)
  const [current, setCurrent] = useState(null); // track object
  const [status, setStatus] = useState({ playing: false, loading: false, position: 0, duration: 0, buffered: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false }).catch(() => {});
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  const onStatus = useCallback((key) => (s) => {
    if (!s.isLoaded) return;
    positions.current[key] = s.positionMillis;
    setStatus({
      playing: s.isPlaying,
      loading: s.isBuffering && !s.isPlaying,
      position: s.positionMillis || 0,
      duration: s.durationMillis || 0,
      buffered: s.playableDurationMillis || 0,
    });
    if (s.didJustFinish) {
      positions.current[key] = 0;
      setStatus((prev) => ({ ...prev, playing: false, position: 0 }));
    }
  }, []);

  const playTrack = async (track) => {
    setError('');
    try {
      // Same track: toggle pause / resume.
      if (current?.key === track.key && soundRef.current) {
        if (status.playing) await soundRef.current.pauseAsync();
        else await soundRef.current.playAsync();
        return;
      }
      // New track: stop the previous one first.
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setCurrent(track);
      setStatus({ playing: false, loading: true, position: positions.current[track.key] || 0, duration: 0, buffered: 0 });
      const { sound } = await Audio.Sound.createAsync(
        { uri: streamUrl(track) },
        { shouldPlay: true, positionMillis: positions.current[track.key] || 0, progressUpdateIntervalMillis: 500 },
        onStatus(track.key)
      );
      soundRef.current = sound;
    } catch (err) {
      setStatus((prev) => ({ ...prev, playing: false, loading: false }));
      setError(t.music.playFailed);
    }
  };

  const restart = async () => {
    if (!soundRef.current || !current) return;
    positions.current[current.key] = 0;
    await soundRef.current.setPositionAsync(0).catch(() => {});
    await soundRef.current.playAsync().catch(() => {});
  };

  const progress = status.duration ? status.position / status.duration : 0;
  const buffered = status.duration ? status.buffered / status.duration : 0;

  return (
    <Screen title={t.music.title} subtitle={t.music.subtitle} refreshing={query.refreshing} onRefresh={query.refresh}>
      {current ? (
        <View style={styles.player} accessibilityLabel={`${t.music.nowPlaying}: ${pick(current.title, lang)}`}>
          <Text style={styles.playerLabel}>{t.music.nowPlaying}</Text>
          <Text style={styles.playerTitle} numberOfLines={2}>{pick(current.title, lang)}</Text>
          <View style={{ marginTop: spacing.lg }}>
            <ProgressBar value={progress} buffer={buffered} dark height={6} />
            <View style={styles.times}>
              <Text style={styles.time}>{formatDuration(status.position)}</Text>
              <Text style={styles.time}>{formatDuration(status.duration)}</Text>
            </View>
          </View>
          <View style={styles.controls}>
            <Pressable onPress={restart} style={styles.smallControl} accessibilityRole="button" accessibilityLabel={t.music.restart}>
              <Ionicons name="play-skip-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={() => playTrack(current)}
              style={styles.bigControl}
              accessibilityRole="button"
              accessibilityLabel={status.playing ? t.music.pause : t.music.play}
            >
              {status.loading ? <ActivityIndicator color={colors.ink} /> : <Ionicons name={status.playing ? 'pause' : 'play'} size={30} color={colors.ink} />}
            </Pressable>
            <View style={styles.smallControl} />
          </View>
          <View style={styles.playerCircle} />
        </View>
      ) : null}

      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

      <AsyncContent
        query={query}
        unavailableIcon="musical-notes-outline"
        isEmpty={(data) => !data?.length}
        empty={<EmptyState icon="musical-notes-outline" text={t.music.empty} />}
      >
        {(tracks) => (
          <>
            {tracks.map((track) => {
              const active = current?.key === track.key;
              const playing = active && status.playing;
              return (
                <Card
                  key={track.key}
                  onPress={() => playTrack(track)}
                  accessibilityLabel={`${playing ? t.music.pause : t.music.play}: ${pick(track.title, lang)}`}
                  style={[styles.track, active && styles.trackActive]}
                >
                  <View style={[styles.trackIcon, active && styles.trackIconActive]}>
                    {active && status.loading ? (
                      <ActivityIndicator color={colors.ink} />
                    ) : (
                      <Ionicons name={playing ? 'pause' : 'play'} size={22} color={active ? colors.ink : colors.green} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle} numberOfLines={2}>{pick(track.title, lang)}</Text>
                    {track.purpose || track.description ? (
                      <Text style={styles.trackMeta} numberOfLines={2}>{pick(track.purpose, lang) || pick(track.description, lang)}</Text>
                    ) : null}
                  </View>
                  {playing ? <Ionicons name="volume-high" size={20} color={colors.green} /> : null}
                </Card>
              );
            })}
            <View style={styles.tip}>
              <Ionicons name="headset-outline" size={20} color={colors.green} />
              <Text style={styles.tipText}>{t.music.headphones}</Text>
            </View>
          </>
        )}
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { backgroundColor: colors.greenDark, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.xl, overflow: 'hidden' },
  playerLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.saffron },
  playerTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: '#FFFFFF', marginTop: 6 },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontFamily: fonts.medium, fontSize: 12, color: colors.onDarkMuted },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxl, marginTop: spacing.md },
  smallControl: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  bigControl: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.saffron, alignItems: 'center', justifyContent: 'center' },
  playerCircle: { position: 'absolute', right: -60, top: -60, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.saffron, opacity: 0.12 },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, backgroundColor: colors.dangerTint, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  track: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  trackActive: { borderColor: colors.saffron, backgroundColor: '#FFFBF4' },
  trackIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  trackIconActive: { backgroundColor: colors.saffron },
  trackTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23, color: colors.ink },
  trackMeta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.muted },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.greenTint, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  tipText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.green, flex: 1 },
});
