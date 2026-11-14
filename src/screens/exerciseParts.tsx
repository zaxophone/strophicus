import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Exercise, Lesson } from '../exercise/exercise';
import { describeKey, keyTonic } from '../exercise/key';
import { midiToNoteName } from '../pitch/music';
import { canMoveTo, isPassed, isUnlocked, Progress } from '../progress/progress';
import { colors } from '../ui/theme';

/** One dot per exercise in the lesson; open ones can be tapped to jump to them. */
export function LessonDots({
  lesson,
  index,
  cleared,
  progress,
  onGo,
}: {
  lesson: Lesson;
  index: number;
  cleared: boolean;
  progress: Progress;
  onGo: (index: number) => void;
}) {
  return (
    <View style={styles.dots}>
      {lesson.exercises.map((e, i) => {
        const open = isUnlocked(lesson, i, progress);
        return (
          <Pressable
            key={e.id}
            disabled={i === index || !canMoveTo(lesson, index, i, cleared, progress)}
            onPress={() => onGo(i)}
            hitSlop={8}
            accessibilityLabel={`${e.title}${isPassed(progress, e.id) ? ', done' : open ? '' : ', locked'}`}
            style={[
              styles.dot,
              isPassed(progress, e.id) && styles.dotDone,
              open && !isPassed(progress, e.id) && styles.dotOpen,
              i === index && styles.dotCurrent,
            ]}
          />
        );
      })}
    </View>
  );
}

/**
 * Fills the room left on the screen and centres its content in it, shrinking
 * the content if it is taller than that room, so a long exercise never needs
 * scrolling on a short phone.
 */
export function FitToHeight({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState(0);
  const [natural, setNatural] = useState(0);
  const scale = room > 0 && natural > room ? room / natural : 1;
  return (
    <View
      style={styles.fit}
      onLayout={(e) => setRoom(e.nativeEvent.layout.height)}
    >
      <View onLayout={(e) => setNatural(e.nativeEvent.layout.height)} style={{ alignSelf: 'stretch', alignItems: 'center', transform: [{ scale }] }}>
        {children}
      </View>
    </View>
  );
}

/**
 * Fills the room left on the screen and centres a staff in it, telling it how
 * tall it may be. The staff redraws itself smaller if it would not fit.
 */
export function StaffArea({ children }: { children: (maxHeight: number) => ReactNode }) {
  const [room, setRoom] = useState(0);
  return (
    <View style={styles.fit} onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
      {room > 0 && children(room)}
    </View>
  );
}

/** Plays the book's recording of the exercise, sung by a children's choir. */
export function RecordingButton({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.recording} onPress={onPress} accessibilityLabel={playing ? 'Stop the recording' : 'Hear the recording'}>
      <Text style={styles.recordingGlyph}>{playing ? '■' : '▶'}</Text>
      <Text style={styles.recordingText}>{playing ? 'Stop' : 'Hear the choir'}</Text>
    </Pressable>
  );
}

/** The big round Back and Next arrows. */
export function ArrowButton({
  direction,
  ready = false,
  off = false,
  finish = false,
  onPress,
}: {
  direction: 'back' | 'next';
  /** Next only: the exercise is done, so the arrow invites a tap. */
  ready?: boolean;
  /** Dimmed and not tappable (Back on the first exercise). */
  off?: boolean;
  /** Next on the last exercise says Finish. */
  finish?: boolean;
  onPress: () => void;
}) {
  const back = direction === 'back';
  const dim = back ? off : !ready;
  return (
    <View style={styles.arrowSlot}>
      <Pressable
        style={[styles.arrow, back ? off && styles.arrowOff : ready ? styles.arrowReady : styles.arrowOff]}
        disabled={back && off}
        onPress={onPress}
        accessibilityLabel={back ? 'Previous exercise' : finish ? 'Finish the lesson' : 'Next exercise'}
        accessibilityState={{ disabled: dim }}
      >
        <Text style={[styles.arrowGlyph, !back && ready && styles.arrowGlyphReady]}>
          {back ? '‹' : finish ? '✓' : '›'}
        </Text>
      </Pressable>
      <Text style={[styles.arrowCaption, !back && ready && styles.arrowCaptionReady]}>
        {back ? 'Back' : finish ? 'Finish' : 'Next'}
      </Text>
    </View>
  );
}

/** The reference pitch (do) the exercise is played from, with the book's own key if it gives one. */
export function ReferencePitch({
  tonic,
  onTonicChange,
  exercise,
  hint,
}: {
  tonic: number;
  onTonicChange: (tonic: number) => void;
  exercise: Exercise;
  hint: string;
}) {
  const suggested = exercise.key ? keyTonic(exercise.key) : null;
  return (
    <View style={styles.reference}>
      <Text style={styles.referenceLabel}>Reference pitch</Text>
      <View style={styles.row}>
        <Pressable style={styles.step} onPress={() => onTonicChange(tonic - 1)} accessibilityLabel="Lower the reference">
          <Text style={styles.stepText}>‹</Text>
        </Pressable>
        <Text style={styles.referenceNote}>{midiToNoteName(tonic)}</Text>
        <Pressable style={styles.step} onPress={() => onTonicChange(tonic + 1)} accessibilityLabel="Raise the reference">
          <Text style={styles.stepText}>›</Text>
        </Pressable>
      </View>
      <Text style={styles.referenceHint}>{hint}</Text>
      {exercise.key && suggested !== null && (
        <View style={styles.row}>
          <Text style={styles.referenceHint}>
            The book suggests {describeKey(exercise.key)} (do on {midiToNoteName(suggested)}).
          </Text>
          {suggested !== tonic && (
            <Pressable style={styles.use} onPress={() => onTonicChange(suggested)}>
              <Text style={styles.useText}>Use it</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export const barStyles = StyleSheet.create({
  bar: { gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff' },
  main: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
});

const styles = StyleSheet.create({
  fit: { flex: 1, alignSelf: 'stretch', minHeight: 0, justifyContent: 'center', alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.line },
  dotOpen: { backgroundColor: colors.primaryTint },
  dotDone: { backgroundColor: colors.success },
  dotCurrent: { width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  step: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.body, fontSize: 24, lineHeight: 26 },
  reference: { alignSelf: 'stretch', alignItems: 'center', gap: 8, paddingTop: 6 },
  referenceLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, letterSpacing: 0.8, textTransform: 'uppercase' },
  referenceNote: { fontSize: 20, fontWeight: '800', color: colors.ink, minWidth: 48, textAlign: 'center' },
  referenceHint: { fontSize: 13, color: colors.faint, textAlign: 'center', lineHeight: 18 },
  use: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primaryTint },
  useText: { color: colors.primaryInk, fontWeight: '600', fontSize: 13 },
  recording: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5, borderColor: colors.primary },
  recordingGlyph: { color: colors.primary, fontSize: 13 },
  recordingText: { color: colors.primaryInk, fontWeight: '600', fontSize: 14 },
  arrowSlot: { alignItems: 'center', gap: 4, width: 72 },
  arrow: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  arrowReady: { backgroundColor: colors.success },
  arrowOff: { opacity: 0.3 },
  arrowGlyph: { fontSize: 44, lineHeight: 48, color: colors.primaryInk, marginTop: -4 },
  arrowGlyphReady: { color: '#fff' },
  arrowCaption: { fontSize: 12, fontWeight: '600', color: colors.muted },
  arrowCaptionReady: { color: colors.success },
});
