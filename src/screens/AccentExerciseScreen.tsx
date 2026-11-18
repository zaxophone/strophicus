import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useBookRecording } from '../audio/useBookRecording';
import { useReferencePlayback } from '../audio/useReferencePlayback';
import { ChantMark, ChantStaff } from '../chant/ChantStaff';
import { unitIndexOf, unitLabels, units } from '../chant/chant';
import { noteName } from '../exercise/exercise';
import { isPassed } from '../progress/progress';
import { useProgress } from '../progress/ProgressContext';
import { colors } from '../ui/theme';
import { useZoom, ZoomControl } from '../ui/zoom';
import { ArrowButton, barStyles, RecordingButton, StaffArea } from './exerciseParts';
import { ExerciseBodyProps } from './exerciseProps';

/**
 * An exercise on which word carries the accent. With a melody, the student
 * listens, then taps the word the melody rises on (there is one right answer).
 * With plain sentences, they read one aloud and mark the word they stressed
 * (any choice is right: it is their own).
 */
export function AccentExerciseScreen({ lesson, index, tonic, onIndexChange, onFinish, onBack }: ExerciseBodyProps) {
  const { zoom } = useZoom();
  const { width } = useWindowDimensions();
  const { progress, markPassed } = useProgress();
  const exercise = lesson.exercises[index];
  const last = index === lesson.exercises.length - 1;
  const melody = exercise.chant.notes.length > 0;
  const { playing, playingNote, play: playSynth, stop } = useReferencePlayback(exercise, tonic);
  const book = useBookRecording(exercise);
  const play = () => {
    book.stop();
    playSynth();
  };
  const hearChoir = () => {
    stop();
    book.toggle();
  };
  // The word chosen: a note on a melody, or a line and a word in it on sentences.
  const [note, setNote] = useState<number | null>(null);
  const [spot, setSpot] = useState<{ line: number; word: number } | null>(null);
  const [nudge, setNudge] = useState(false);

  // the answer is a syllable; tapping any note of a group chooses its syllable
  const right = melody ? note !== null && unitIndexOf(exercise.chant, note) === exercise.answer : spot !== null;
  const done = right || isPassed(progress, exercise.id);
  useEffect(() => {
    if (right) {
      markPassed(exercise.id);
      setNudge(false);
    }
  }, [right, exercise.id, markPassed]);

  const next = () => {
    if (!done) return setNudge(true);
    stop();
    if (last) onFinish();
    else onIndexChange(index + 1, false);
  };

  const marks: ChantMark[] = exercise.chant.notes.split('').map((_, i) => {
    if (playing && playingNote !== null) return { color: colors.ink, hint: '', next: false, playing: i === playingNote };
    if (note !== null && unitIndexOf(exercise.chant, i) === unitIndexOf(exercise.chant, note)) return right ? { color: colors.success, hint: '✓', next: false } : { color: '#dc2626', hint: '✗', next: false };
    return { color: colors.ink, hint: '', next: false };
  });

  const message = nudge
    ? melody
      ? 'Find the word the melody goes up on to move on.'
      : 'Tap a word to move on.'
    : melody
      ? right
        ? `Yes, "${noteName(exercise, units(exercise.chant)[exercise.answer ?? 0].start)}": the note goes up there, so that word is given wings. Tap the arrow to go on.`
        : note === null
          ? 'Tap Hear it, listen, then tap the word that sounds most important.'
          : `Not "${noteName(exercise, note)}". Listen again: where does the melody rise?`
      : spot === null
        ? 'Say a sentence out loud, then tap the word you gave the most weight.'
        : `You gave "${exercise.lines![spot.line].split(' ')[spot.word].replace(/[.,!?]+$/, '')}" the wings. Tap another word or sentence to try again, or tap the arrow to go on.`;

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={[styles.message, right && styles.messageOk, nudge && styles.messageNudge]}>{message}</Text>

        <ZoomControl />

        {melody ? (
          <StaffArea scroll={zoom > 1}>
            {(maxHeight) => (
              <ChantStaff
                width={width - 32}
                chant={exercise.chant}
                labels={exercise.words ?? unitLabels(exercise.chant, exercise.labels)}
                marks={marks}
                onPressNote={(i) => setNote(i)}
                maxHeight={maxHeight}
                scale={zoom}
              />
            )}
          </StaffArea>
        ) : (
          <View style={styles.lines}>
            {(exercise.lines ?? []).map((line, l) => (
              <View key={line} style={styles.line}>
                {line.split(' ').map((word, w) => {
                  const chosen = spot?.line === l && spot.word === w;
                  return (
                    <Pressable key={w} onPress={() => setSpot({ line: l, word: w })} style={styles.word} hitSlop={4}>
                      <View style={[styles.accent, !chosen && styles.accentOff]} />
                      <Text style={[styles.wordText, chosen && styles.wordChosen]}>{word}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {book.available && <RecordingButton playing={book.playing} onPress={hearChoir} />}
      </View>

      <View style={barStyles.bar}>
        <View style={barStyles.main}>
          <ArrowButton direction="back" onPress={() => { stop(); onBack(); }} />
          {melody ? (
            <Pressable style={styles.hear} onPress={playing ? stop : play}>
              <Text style={styles.hearText}>{playing ? 'Stop' : 'Hear it'}</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <ArrowButton direction="next" ready={done} finish={last} onPress={next} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16, gap: 14, alignItems: 'center' },
  message: { color: colors.body, textAlign: 'center', minHeight: 48, fontSize: 18, lineHeight: 25 },
  messageOk: { color: colors.success, fontWeight: '700' },
  messageNudge: { color: colors.danger, fontWeight: '600' },
  lines: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', gap: 14 },
  line: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' },
  word: { alignItems: 'center', paddingHorizontal: 4 },
  wordText: { fontSize: 18, color: colors.ink },
  wordChosen: { color: colors.primary, fontWeight: '800' },
  // the slash the child pencils over a word, leaning to the right
  accent: { width: 3, height: 13, borderRadius: 2, backgroundColor: colors.primary, marginBottom: 2, transform: [{ rotate: '30deg' }] },
  accentOff: { opacity: 0 },
  hear: { flex: 1, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hearText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
