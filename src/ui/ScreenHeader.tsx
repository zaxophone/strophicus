import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from './theme';

interface Props {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
}

/** The bar at the top of a screen that sits below the home page. */
export function ScreenHeader({ title, subtitle, backLabel = 'Back', onBack }: Props) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel={backLabel}>
        <Text style={styles.chevron}>‹</Text>
        <Text style={styles.backText}>{backLabel}</Text>
      </Pressable>
      <View style={styles.titles} pointerEvents="none">
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, minHeight: 52 },
  back: { flexDirection: 'row', alignItems: 'center', width: 96 },
  chevron: { fontSize: 30, lineHeight: 32, color: colors.primary, marginRight: 4 },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  titles: { flex: 1, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 1 },
});
