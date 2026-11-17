import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Lesson } from '../exercise/exercise';
import { lessonProgress, nextExerciseIndex, Progress, resumePoint } from '../progress/progress';
import { colors } from '../ui/theme';

interface Props {
  lessons: Lesson[];
  /** Pieces to sing, listed after the lessons. */
  repertoire: Lesson[];
  progress: Progress;
  onOpenLesson: (lessonIndex: number, exerciseIndex: number) => void;
  onOpenPiece: (pieceIndex: number, exerciseIndex: number) => void;
  onOpenTuner: () => void;
}

export function HomeScreen({ lessons, repertoire, progress, onOpenLesson, onOpenPiece, onOpenTuner }: Props) {
  const resume = resumePoint(lessons, progress);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Lessons</Text>
      <Text style={styles.lead}>Sing along and the staff will show you how you are doing.</Text>

      {resume && (
        <Pressable
          style={styles.resume}
          onPress={() => onOpenLesson(resume.lessonIndex, resume.exerciseIndex)}
          accessibilityRole="button"
        >
          <View style={styles.resumeText}>
            <Text style={styles.resumeLabel}>Continue</Text>
            <Text style={styles.resumeTitle} numberOfLines={1}>
              {lessons[resume.lessonIndex].exercises[resume.exerciseIndex].title}
            </Text>
            <Text style={styles.resumeLesson} numberOfLines={1}>
              {lessonName(lessons[resume.lessonIndex])}
            </Text>
          </View>
          <Text style={styles.resumeArrow}>›</Text>
        </Pressable>
      )}

      {lessons.map((lesson, i) => {
        const { done, total, complete } = lessonProgress(lesson, progress);
        return (
          <Pressable
            key={lesson.id}
            style={styles.card}
            onPress={() => onOpenLesson(i, nextExerciseIndex(lesson, progress))}
            accessibilityRole="button"
          >
            <View style={[styles.badge, complete && styles.badgeDone]}>
              <Text style={[styles.badgeText, complete && styles.badgeTextDone]}>
                {complete ? '✓' : lesson.number ?? '♪'}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{lessonName(lesson)}</Text>
              <Text style={styles.cardSummary}>{lesson.summary}</Text>
              <View style={styles.progressRow}>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(done / total) * 100}%` }, complete && styles.fillDone]} />
                </View>
                <Text style={styles.count}>{done} of {total}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      })}

      <Text style={styles.section}>Repertoire</Text>
      {repertoire.map((piece, i) => {
        const { done, total, complete } = lessonProgress(piece, progress);
        return (
          <Pressable key={piece.id} style={styles.card} onPress={() => onOpenPiece(i, 0)} accessibilityRole="button">
            <View style={[styles.badge, complete && styles.badgeDone]}>
              <Text style={[styles.badgeText, complete && styles.badgeTextDone]}>{complete ? '✓' : '♪'}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{piece.title}</Text>
              <Text style={styles.cardSummary}>{piece.summary}</Text>
              <Text style={styles.count}>{done} of {total} sung</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        );
      })}

      <Text style={styles.section}>Tools</Text>
      <Pressable style={styles.card} onPress={onOpenTuner} accessibilityRole="button">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>♩</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>Tuner</Text>
          <Text style={styles.cardSummary}>See the pitch of any note you sing.</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

/** "Lesson 3: Do, Re, Mi, and so on", or just the title for a lesson without a number. */
function lessonName(lesson: Lesson): string {
  return lesson.number === undefined ? lesson.title : `Lesson ${lesson.number}: ${lesson.title}`;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  heading: { fontSize: 32, fontWeight: '800', color: colors.ink },
  lead: { fontSize: 15, color: colors.muted, marginBottom: 6 },
  resume: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 6 },
  resumeText: { flex: 1 },
  resumeLabel: { color: '#c7d2fe', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  resumeTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  resumeLesson: { color: '#e0e7ff', fontSize: 14, marginTop: 2 },
  resumeArrow: { color: '#fff', fontSize: 34, lineHeight: 36, marginLeft: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 16 },
  badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  badgeDone: { backgroundColor: colors.successTint },
  badgeText: { fontSize: 20, fontWeight: '800', color: colors.primaryInk },
  badgeTextDone: { color: colors.success },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  cardSummary: { fontSize: 14, color: colors.muted, lineHeight: 19 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  fillDone: { backgroundColor: colors.success },
  count: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  chevron: { fontSize: 30, lineHeight: 32, color: colors.faint },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 14 },
});
