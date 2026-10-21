import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CLINIC } from '../config/env';
import { formatDate, isPast } from '../utils/format';
import { Badge, Button, Card, InfoRow, LogoMark, Screen } from '../components/ui';
import LanguageSwitch from '../components/LanguageSwitch';
import { colors, fonts, spacing } from '../theme';

export default function ProfileScreen() {
  const { t, lang } = useLanguage();
  const { user, signOut } = useAuth();
  const initials = (user?.fullName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const expired = user?.expiryDate && isPast(user.expiryDate);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      signOut();
      return;
    }
    Alert.alert(t.profile.logout, t.profile.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.profile.logout, style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen title={t.profile.title}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'A'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.fullName || '—'}</Text>
          <Text style={styles.meta}>{t.profile.regNo}: {user?.registrationNumber || '—'}</Text>
        </View>
      </View>

      <Card>
        <InfoRow label={t.profile.name} value={user?.fullName} />
        <InfoRow label={t.profile.regNo} value={user?.registrationNumber} />
        <InfoRow label={t.profile.phone} value={user?.phoneNumber} />
        <View style={styles.validRow}>
          <Text style={styles.validLabel}>{t.profile.validTill}</Text>
          {user?.expiryDate ? (
            <Badge label={formatDate(user.expiryDate, lang)} tone={expired ? 'danger' : 'green'} icon={expired ? 'alert-circle' : 'shield-checkmark'} />
          ) : (
            <Text style={styles.validValue}>—</Text>
          )}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>{t.profile.language}</Text>
        <LanguageSwitch />
      </Card>

      <Card>
        <View style={styles.clinicHead}>
          <LogoMark size={28} />
          <Text style={styles.cardTitle}>{t.profile.clinic}: {CLINIC.name[lang]}</Text>
        </View>
        <Text style={styles.meta}>{CLINIC.phone} · {CLINIC.email}</Text>
        <View style={styles.actions}>
          <Button title={t.common.call} icon="call-outline" variant="outline" small onPress={() => Linking.openURL(CLINIC.phoneHref)} style={{ flex: 1 }} />
          <Button title={t.common.whatsapp} icon="logo-whatsapp" variant="outline" small onPress={() => Linking.openURL(CLINIC.whatsappHref)} style={{ flex: 1 }} />
        </View>
        <Button title={t.profile.bookOnline} icon="calendar-outline" variant="accent" small onPress={() => Linking.openURL(CLINIC.bookingUrl)} style={{ marginTop: spacing.sm }} />
      </Card>

      <Button title={t.profile.logout} icon="log-out-outline" variant="danger" onPress={confirmLogout} style={{ marginTop: spacing.sm }} />
      <Text style={styles.version}>{t.profile.version} {Constants.expoConfig?.version || ''}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 24, color: '#FFFFFF' },
  name: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
  validRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14 },
  validLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  validValue: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, marginBottom: spacing.sm },
  clinicHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  version: { fontFamily: fonts.regular, fontSize: 12, color: colors.subtle, textAlign: 'center', marginTop: spacing.lg },
});
