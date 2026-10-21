import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { colors, fonts } from '../theme';

/** हिंदी / EN segmented switch (same as the website header). */
export default function LanguageSwitch({ dark = false }) {
  const { lang, setLang } = useLanguage();
  const options = [
    { value: 'hi', label: 'हिंदी', a11y: 'हिंदी' },
    { value: 'en', label: 'EN', a11y: 'English' },
  ];
  return (
    <View style={[styles.wrap, dark && styles.wrapDark]} accessibilityRole="radiogroup">
      {options.map((option) => {
        const active = lang === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setLang(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={option.a11y}
            style={[styles.option, active && (dark ? styles.activeDark : styles.active)]}
          >
            <Text style={[styles.text, dark && styles.textDark, active && (dark ? styles.textActiveDark : styles.textActive)]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 999, overflow: 'hidden', alignSelf: 'flex-start' },
  wrapDark: { borderColor: 'rgba(255,255,255,0.35)' },
  option: { minHeight: 40, minWidth: 54, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  active: { backgroundColor: colors.green },
  activeDark: { backgroundColor: colors.saffron },
  text: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  textDark: { color: colors.onDark },
  textActive: { color: '#FFFFFF', fontFamily: fonts.semibold },
  textActiveDark: { color: colors.ink, fontFamily: fonts.semibold },
});
