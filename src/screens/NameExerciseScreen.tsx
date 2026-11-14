import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useBookRecording } from '../audio/useBookRecording';
import { useReferencePlayback } from '../audio/useReferencePlayback';
import { ChantMark, ChantStaff } from '../chant/ChantStaff';
import { SOLFEGE, unitLabels } from '../chant/chant';
import { ExerciseBodyProps } from './exerciseProps';
import { GESTURES, Gesture } from '../exercise/gestures';
import { allNamed, nameNote, selectNote, startMarking, startNaming } from '../exercise/naming';
import { isPassed } from '../progress/progress';
import { useProgress } from '../progress/ProgressContext';
import { colors } from '../ui/theme';
import { ArrowButton, barStyles, RecordingButton, StaffArea } from './exerciseParts';

/**
 * An exercise where the student names the notes: tap a note on the staff (the
 * next unnamed one is picked for them) and choose its solfege syllable. A `mark`
 * exercise is the same screen with two choices, arsis or thesis, for each note.
 */
export function NameExerciseScreen({ lesson, index, tonic, onIndexChange, onExit, onBack }: ExerciseBodyProps) {
  const { width } = useWindowDimensions();
  const { progress, markPassed } = useProgress();
  const exercise = lesson.exercises[index];
  const last = index === lesson.exercises.length - 1;
  const marking = exercise.kind === 'mark';
  // What each note is to be called: its solfege syllable, or its gesture.
  const answers: (string | null)[] = marking ? (exercise.gestures ?? []) : exercise.labels;
  const answerKey = { labels: answers as string[], given: exercise.given };
  const [naming, setNaming] = useState(() => (marking ? startMarking(answers) : startNaming(answerKey)));
  const [nudge, setNudge] = useState(false);
  const { playing, playingNote, play, stop: stopPlayback } = useReferencePlayback(exercise, tonic);
  const book = useBookRecording(exercise);
  const hear = () => {
    book.stop();
    play();
  };
  const hearChoir = () => {
    stopPlayback();
    book.toggle();
  };

  const finished = allNamed(naming);
  const done = finished || isPassed(progress, exercise.id);

  useEffect(() => {
    if (finished) {
      markPassed(exercise.id);
      setNudge(false);
    }
  }, [finished, exercise.id, markPassed]);

  const go = (target: number) => {
    stopPlayback();
    onIndexChange(target, target < index);
  };
  const next = () => {
    if (!done) return setNudge(true);
    if (last) onExit();
    else go(index + 1);
  };

  const labels = marking
    ? (exercise.words ?? unitLabels(exercise.chant, exercise.labels))
    : unitLabels(
        exercise.chant,
        naming.named.map((n, i) => (naming.wrong?.index === i ? naming.wrong.guess : (n ?? '?'))),
      );
  // an answered ictus shows its gesture, an unanswered one waits, and the notes between have none
  const gestures = marking
    ? naming.named.map((n, i) => (n ? (n as Gesture) : answers[i] ? ('pending' as const) : null))
    : undefined;
  const marks: ChantMark[] = naming.named.map((n, i) => {
    if (playing && playingNote !== null) {
      return { color: colors.ink, hint: '', next: false, playing: i === playingNote };
    }
    if (naming.wrong?.index === i) return { color: '#dc2626', hint: '✗', next: true };
    if (n === '') return { color: colors.ink, hint: '', next: false };
    if (n !== null) {
      return { color: i < exercise.given ? colors.ink : colors.success, hint: i < exercise.given ? '' : '✓', next: false };
    }
    return { color: colors.faint, hint: '', next: i === naming.selected };
  });

  const message = nudge
    ? marking
      ? 'Mark every note to move on.'
      : 'Name every note to move on.'
    : finished
      ? last
        ? 'All named! That finishes the lesson.'
        : 'All named! Tap the arrow to go on.'
      : marking
        ? naming.wrong
          ? `This ictus is more of ${answers[naming.wrong.index] === 'arsis' ? 'an arsis' : 'a thesis'}: ${
              answers[naming.wrong.index] === 'arsis'
                ? 'a phrase begins, or the melody rises, so the hand lifts.'
                : 'the melody stays or falls, so the hand settles.'
            }`
          : 'Tap a marked note, then choose arsis (lifting) or thesis (settling).'
        : naming.wrong
          ? `That note isn't ${naming.wrong.guess}. Find do on the clef, then count the steps up or down to this note.`
          : 'Tap a note, then choose its name.';

  const buttonWidth = Math.min(52, (width - 32 - 6 * 6) / 7);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <StaffArea>
          {(maxHeight) => (
            <ChantStaff
              wave={marking}
              width={width - 32}
              chant={exercise.chant}
              labels={labels}
              captions={marking ? undefined : exercise.words}
              marks={marks}
              gestures={gestures}
              onPressNote={(i) => {
                setNudge(false);
                setNaming((s) => selectNote(s, i));
              }}
              maxHeight={maxHeight}
            />
          )}
        </StaffArea>

        <Text style={[styles.message, finished && styles.messageOk, nudge && styles.messageNudge]}>{message}</Text>

        {book.available && <RecordingButton playing={book.playing} onPress={hearChoir} />}

        <View style={styles.palette}>
          {(marking ? GESTURES : SOLFEGE).map((name) => (
            <Pressable
              key={name}
              disabled={finished}
              onPress={() => {
                setNudge(false);
                setNaming((s) => nameNote(s, answerKey, name));
              }}
              style={[styles.choice, { width: marking ? 120 : buttonWidth }, finished && styles.choiceOff]}
              accessibilityLabel={name}
            >
              <Text style={styles.choiceText}>{marking ? (name === 'arsis' ? 'Arsis ↗' : 'Thesis ↘') : name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={barStyles.bar}>
        <View style={barStyles.main}>
          <ArrowButton direction="back" onPress={onBack} />
          <Pressable style={styles.hear} onPress={playing ? stopPlayback : hear}>
            <Text style={styles.hearText}>{playing ? 'Stop' : 'Hear it'}</Text>
          </Pressable>
          <ArrowButton direction="next" ready={done} finish={last} onPress={next} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16, gap: 14, alignItems: 'center' },
  message: { color: colors.muted, textAlign: 'center', minHeight: 36, fontSize: 15 },
  messageOk: { color: colors.success, fontWeight: '700' },
  messageNudge: { color: colors.danger, fontWeight: '600' },
  palette: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  choice: { height: 52, borderRadius: 12, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  choiceOff: { opacity: 0.4 },
  choiceText: { color: colors.primaryInk, fontSize: 16, fontWeight: '700' },
  hear: { flex: 1, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hearText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
