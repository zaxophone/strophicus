import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Lesson } from '../exercise/exercise';
import { colors } from '../ui/theme';

interface Props {
  lesson: Lesson;
  /** The lesson after this one, if there is one. */
  next?: Lesson;
  onHome: () => void;
  onNext: () => void;
}

const name = (lesson: Lesson) => (lesson.number === undefined ? lesson.title : `Lesson ${lesson.number}: ${lesson.title}`);

/** Shown after the last exercise of a lesson: congratulations, and where to go from here. */
export function CompleteScreen({ lesson, next, onHome, onNext }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.heading}>Congratulations!</Text>
        <Text style={styles.label}>{lesson.free ? 'Piece complete:' : 'Lesson complete:'}</Text>
        <Text style={styles.name}>{name(lesson)}</Text>
      </View>
      <View style={styles.buttons}>
        {next && (
          <Pressable style={styles.primary} onPress={onNext} accessibilityRole="button">
            <Text style={styles.primaryText}>Next lesson</Text>
            <Text style={styles.primarySub} numberOfLines={1}>{name(next)}</Text>
          </Pressable>
        )}
        <Pressable style={next ? styles.secondary : styles.primary} onPress={onHome} accessibilityRole="button">
          <Text style={next ? styles.secondaryText : styles.primaryText}>Back to home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 24 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  heading: { fontSize: 34, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  label: { fontSize: 18, color: colors.muted, marginTop: 8 },
  name: { fontSize: 24, fontWeight: '700', color: colors.primaryInk, textAlign: 'center' },
  buttons: { gap: 12, paddingBottom: 24 },
  primary: { backgroundColor: colors.primary, borderRadius: 32, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  primarySub: { color: '#e0e7ff', fontSize: 14, marginTop: 2 },
  secondary: { backgroundColor: colors.primaryTint, borderRadius: 32, paddingVertical: 16, alignItems: 'center' },
  secondaryText: { color: colors.primaryInk, fontSize: 17, fontWeight: '700' },
});
