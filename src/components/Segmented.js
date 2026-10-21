import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

/** Pill-style tabs / filter chips. */
export default function Segmented({ options, value, onChange, scrollable = false }) {
  const chips = options.map((option) => {
    const active = option.value === value;
    return (
      <Pressable
        key={option.value}
        onPress={() => onChange(option.value)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[styles.chip, scrollable ? null : { flex: 1 }, active && styles.active]}
      >
        <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>{option.label}</Text>
      </Pressable>
    );
  });
  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll} accessibilityRole="tablist">
        {chips}
      </ScrollView>
    );
  }
  return <View style={styles.wrap} accessibilityRole="tablist">{chips}</View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#ECE8DD', borderRadius: 999, padding: 4, gap: 4 },
  scroll: { gap: 8, paddingBottom: 4 },
  chip: { minHeight: 42, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  active: { backgroundColor: colors.green },
  text: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  textActive: { fontFamily: fonts.semibold, color: '#FFFFFF' },
});
