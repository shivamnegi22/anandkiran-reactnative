import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loginPatient } from '../api/patient';
import { StaffAccountError, useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CLINIC } from '../config/env';
import { Button, LogoMark } from '../components/ui';
import LanguageSwitch from '../components/LanguageSwitch';
import { colors, fonts, radius, spacing } from '../theme';

export default function LoginScreen() {
  const { t, lang } = useLanguage();
  const { signIn } = useAuth();
  const [regNo, setRegNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    if (!regNo.trim()) {
      setError(t.login.required);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await loginPatient(regNo.trim());
      await signIn(data);
    } catch (err) {
      if (err instanceof StaffAccountError) setError(t.login.staff);
      else if (err?.response?.data?.message) setError(err.response.data.message);
      else if (err?.response) setError(t.login.failed);
      else setError(t.login.network);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.brand}>
                <LogoMark size={40} />
                <View>
                  <Text style={styles.brandName}>{t.appName}</Text>
                  <Text style={styles.brandTag}>{t.tagline}</Text>
                </View>
              </View>
              <LanguageSwitch dark />
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header">{t.login.welcome}</Text>
            <Text style={styles.heroText}>{t.login.subtitle}</Text>
            <View style={styles.heroCircle} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label} nativeID="regLabel">{t.login.label}</Text>
            <View style={[styles.inputWrap, error ? styles.inputError : null]}>
              <Ionicons name="id-card-outline" size={20} color={colors.muted} />
              <TextInput
                value={regNo}
                onChangeText={(value) => {
                  // Same rule as before: digits only, up to 10.
                  setRegNo(value.replace(/[^0-9]/g, ''));
                  if (error) setError('');
                }}
                placeholder={t.login.placeholder}
                placeholderTextColor={colors.subtle}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={10}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                accessibilityLabelledBy="regLabel"
                accessibilityLabel={t.login.label}
                style={styles.input}
              />
            </View>
            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">{error}</Text>
            ) : null}

            <Button title={loading ? t.login.submitting : t.login.submit} onPress={onSubmit} loading={loading} icon={loading ? undefined : 'log-in-outline'} style={{ marginTop: spacing.lg }} />

            <Text style={styles.note}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.green} /> {t.login.patientsOnly}
            </Text>
          </View>

          <Pressable onPress={() => setShowHelp((v) => !v)} style={styles.helpToggle} accessibilityRole="button" accessibilityState={{ expanded: showHelp }}>
            <Text style={styles.helpToggleText}>{t.login.help}</Text>
            <Ionicons name={showHelp ? 'chevron-up' : 'chevron-down'} size={16} color={colors.green} />
          </Pressable>
          {showHelp ? (
            <View style={styles.help}>
              <Text style={styles.helpText}>{t.login.helpBody}</Text>
              <View style={styles.helpActions}>
                <Button title={t.common.call} icon="call-outline" variant="outline" small onPress={() => Linking.openURL(CLINIC.phoneHref)} style={{ flex: 1 }} />
                <Button title={t.common.whatsapp} icon="logo-whatsapp" variant="outline" small onPress={() => Linking.openURL(CLINIC.whatsappHref)} style={{ flex: 1 }} />
              </View>
              <Text style={styles.helpPhone}>{CLINIC.phone} · {CLINIC.name[lang]}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.greenDark },
  scroll: { flexGrow: 1, backgroundColor: colors.ground, paddingBottom: 40 },
  hero: { backgroundColor: colors.greenDark, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 72, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: '#FFFFFF' },
  brandTag: { fontFamily: fonts.regular, fontSize: 12, color: colors.onDarkMuted },
  heroTitle: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 42, color: '#FFFFFF' },
  heroText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.onDark, marginTop: 6, maxWidth: 340 },
  heroCircle: { position: 'absolute', right: -70, bottom: -90, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.saffron, opacity: 0.16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.xl,
    marginTop: -44,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 54,
  },
  inputError: { borderColor: colors.danger },
  input: { flex: 1, fontFamily: fonts.medium, fontSize: 18, letterSpacing: 1, color: colors.ink, paddingVertical: 12 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 8 },
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: spacing.lg },
  helpToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 18, minHeight: 48 },
  helpToggleText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.green },
  help: { marginHorizontal: spacing.xl, backgroundColor: colors.saffronTint, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  helpText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.ink },
  helpActions: { flexDirection: 'row', gap: spacing.sm },
  helpPhone: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, textAlign: 'center' },
});
