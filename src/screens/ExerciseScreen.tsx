import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { playMelody, Playback } from '../audio/playMelody';
import { useBookRecording } from '../audio/useBookRecording';
import { useReplay } from '../audio/useReplay';
import { usePitchTracker } from '../audio/usePitchTracker';
import { ChantMark, ChantStaff } from '../chant/ChantStaff';
import { unitLabels } from '../chant/chant';
import { noteName, noteTimings, timingSpec } from '../exercise/exercise';
import { describeError, isComplete, judgeMelody, NoteStatus } from '../exercise/judge';
import { NoteSegmenter } from '../pitch/noteSegmenter';
import { isPassed } from '../progress/progress';
import { useProgress } from '../progress/ProgressContext';
import { ExerciseBodyProps } from './exerciseProps';
import { ArrowButton, barStyles, RecordingButton, StaffArea } from './exerciseParts';
import { colors } from '../ui/theme';

const NOTE_COLORS: Record<NoteStatus, string> = {
  pending: colors.ink,
  ok: colors.success,
  off: '#dc2626',
};
/** A note sung at the right pitch but for the wrong length. */
const TIMING_COLOR = '#d97706';

/**
 * One exercise. The parent gives it a new `key` for each exercise, so every
 * exercise starts with a clean attempt.
 */
/** What to tell the student about a note of the wrong length, or one that ignored a half bar. */
function timingMessage(
  label: string,
  timing: 'short' | 'long' | 'rest' | 'cut' | 'ok' | undefined,
  beats: number,
  dotted: boolean,
): string {
  if (timing === 'rest') return `${label} runs into the bar line. Stop there and rest for one beat.`;
  if (timing === 'cut') {
    return dotted
      ? `${label} has a dot, but the bar line cuts it short: sing one beat, then rest.`
      : `${label} ran on past the beat. Sing one beat, then rest.`;
  }
  if (beats > 1) {
    return timing === 'short'
      ? `${label} has a dot, so hold it twice as long.`
      : `${label} was held too long. A dot makes it twice as long, no more.`;
  }
  return `${label} was too ${timing}. Give each note the same length.`;
}

export function SingExercise({ lesson, index, tonic, onIndexChange, onFinish, onBack }: ExerciseBodyProps) {
  const { width } = useWindowDimensions();
  const { progress, markPassed } = useProgress();
  const [playing, setPlaying] = useState(false);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  // Set once the exercise has been sung right during this visit; it stays set
  // through "Try again".
  const [cleared, setCleared] = useState(false);
  // Set when the student taps the locked arrow, to say why it won't go.
  const [nudge, setNudge] = useState(false);
  const playback = useRef<Playback | null>(null);
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const segmenter = useRef(new NoteSegmenter());

  // Exercises care about intervals, not register, so octave errors are folded away.
  const tracker = usePitchTracker((midi, _clarity, level) => segmenter.current.push(midi, level), {
    foldOctaves: true,
  });
  const { status, start, stop: stopTracker, reset, getRecording } = tracker;
  const running = status === 'running';
  // Stopping also ends the note being sung: no more audio will arrive to show
  // that it has ended, and it would otherwise stay unfinished.
  const stop = useCallback(() => {
    segmenter.current.finish();
    stopTracker();
  }, [stopTracker]);
  const replay = useReplay();
  const replaying = replay.view !== null;

  const exercise = lesson.exercises[index];
  const book = useBookRecording(exercise);
  const last = index === lesson.exercises.length - 1;
  // While an attempt is being replayed the screen shows the replay, not the live state.
  const sung = replay.view?.notes ?? segmenter.current.notes;
  const judgement = judgeMelody(sung, exercise.offsets, 50, timingSpec(exercise));
  // Passed as soon as every note is right and the last one has held a moment;
  // it doesn't wait for the voice to stop.
  const finished = isComplete(judgement);

  useEffect(() => {
    if (finished && !replaying) {
      markPassed(exercise.id);
      setCleared(true);
      setNudge(false);
    }
  }, [finished, replaying, exercise.id, markPassed]);
  useEffect(() => {
    if (finished && running) stop();
  }, [finished, running, stop]);

  // Free to go on once it has been sung right, this visit or on an earlier one.
  const done = cleared || isPassed(progress, exercise.id);

  const stopPlayback = useCallback(() => {
    playback.current?.stop();
    playback.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => stopPlayback, [stopPlayback]);

  const { stop: stopReplay, play: startReplay } = replay;
  const tryAgain = useCallback(() => {
    setNudge(false);
    stopReplay();
    segmenter.current.reset();
    reset();
  }, [reset, stopReplay]);

  const go = (target: number) => {
    stop();
    stopPlayback();
    stopReplay();
    onIndexChange(target, target < index);
  };
  const next = () => {
    if (!done) {
      setNudge(true);
      return;
    }
    if (last) onFinish();
    else go(index + 1);
  };

  const listen = () => {
    setNudge(false);
    book.stop();
    stopPlayback();
    stopReplay();
    start();
  };

  const playReference = () => {
    stop();
    book.stop();
    stopPlayback();
    stopReplay();
    const timings = noteTimings(exercise);
    const next = playMelody(tonic, exercise.offsets, {
      beats: timings.map((t) => t.advance),
      held: timings.map((t) => t.held),
      bpm: exercise.bpm,
      onNote: setPlayingNote,
    });
    playback.current = next;
    setPlaying(true);
    next.done.then(() => {
      if (playback.current === next) {
        playback.current = null;
        setPlaying(false);
      }
    });
  };

  const nextNote = judgement.results.findIndex((r) => r.status === 'pending');
  // While the reference plays the staff shows only which note is sounding.
  const hearing = playing && playingNote !== null;
  const marks: ChantMark[] = judgement.results.map((r, i) =>
    hearing
      ? { color: NOTE_COLORS.pending, hint: '', next: false, playing: i === playingNote }
      : {
          color: r.status === 'ok' && r.timing && r.timing !== 'ok' ? TIMING_COLOR : NOTE_COLORS[r.status],
          hint:
            r.status === 'ok'
              ? r.timing && r.timing !== 'ok'
                ? r.timing
                : '✓'
              : r.skipped
                ? '–'
                : r.status === 'off'
                  ? (r.errorCents ?? 0) > 0
                    ? '↑'
                    : '↓'
                  : '',
          next: i === nextNote && !replaying,
        },
  );
  const wrong = judgement.results.findIndex((r) => r.status === 'off');
  const uneven = judgement.results.findIndex((r) => r.timing !== undefined && r.timing !== 'ok');

  const canReplay = !running && !playing && segmenter.current.notes.length > 0;
  const playBack = () => {
    book.stop();
    const recording = getRecording();
    if (recording) startReplay(recording);
  };

  // The microphone must not hear the choir, so listening stops first.
  const hearChoir = () => {
    stop();
    stopPlayback();
    stopReplay();
    book.toggle();
  };

  const message = nudge
    ? 'Sing the exercise right to move on.'
    : finished
    ? last
      ? 'Well sung! That finishes the lesson.'
      : 'Well sung! Tap the arrow to go on.'
    : sung.length === 0
      ? running
        ? 'Sing the first note on any comfortable pitch.'
        : 'Tap Start listening, then sing the first note.'
      : wrong >= 0
        ? judgement.results[wrong].skipped
          ? `${noteName(exercise, wrong)} was skipped.`
          : `${noteName(exercise, wrong)} was ${describeError(judgement.results[wrong])}. The key is fixed by your first note.`
        : uneven >= 0 && (!running || judgement.results.every((r) => r.status !== 'pending'))
          ? timingMessage(
              noteName(exercise, uneven),
              judgement.results[uneven].timing,
              exercise.beats[uneven],
              exercise.chant.moras.includes(uneven),
            )
          : 'Keep going, following the notes.';

  // A piece of repertoire is one long score: shown whole at full size, scrolling to follow the singer.
  const score = lesson.free || lesson.score;
  const focus = hearing ? playingNote ?? undefined : nextNote >= 0 ? nextNote : undefined;
  const follow = useCallback((top: number) => scroller.current?.scrollTo({ y: Math.max(0, top - 12), animated: true }), []);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {score ? (
          <ScrollView ref={scroller} style={styles.score} contentContainerStyle={styles.scoreContent}>
            <ChantStaff
              flow
              width={width - 32}
              chant={exercise.chant}
              labels={exercise.words ?? unitLabels(exercise.chant, exercise.labels)}
              marks={marks}
              focus={focus}
              onFocus={follow}
            />
          </ScrollView>
        ) : (
        <StaffArea>
          {(maxHeight) => (
            <ChantStaff
              width={width - 32}
              chant={exercise.chant}
              labels={exercise.words ?? unitLabels(exercise.chant, exercise.labels)}
              marks={marks}
              gestures={exercise.gestures}
              maxHeight={maxHeight}
            />
          )}
        </StaffArea>
        )}

        <Text style={[styles.message, finished && styles.messageOk, nudge && styles.messageNudge]}>{message}</Text>

        {book.available && <RecordingButton playing={book.playing} onPress={hearChoir} />}

        {status === 'denied' && <Text style={styles.error}>Microphone access is needed to hear your voice.</Text>}
        {status === 'error' && <Text style={styles.error}>Couldn't start the microphone.</Text>}
      </View>

      <View style={barStyles.bar}>
        <View style={styles.tools}>
          <Pressable style={styles.tool} onPress={playing ? stopPlayback : playReference}>
            <Text style={styles.toolText}>{playing ? 'Stop' : 'Hear it'}</Text>
          </Pressable>
          <Pressable style={styles.tool} onPress={tryAgain}>
            <Text style={styles.toolText}>Try again</Text>
          </Pressable>
          <Pressable
            style={[styles.tool, !canReplay && !replaying && styles.disabled]}
            disabled={!canReplay && !replaying}
            onPress={replaying ? replay.stop : playBack}
          >
            <Text style={styles.toolText}>{replaying ? 'Stop' : 'Play back'}</Text>
          </Pressable>
        </View>
        <View style={barStyles.main}>
          <ArrowButton direction="back" onPress={onBack} />

          <Pressable style={[styles.listen, running && styles.listenStop]} onPress={running ? stop : listen}>
            <Text style={styles.listenText}>{running ? 'Stop' : 'Start listening'}</Text>
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
  score: { flex: 1, alignSelf: 'stretch' },
  scoreContent: { alignItems: 'center', paddingBottom: 24 },
  message: { color: colors.muted, textAlign: 'center', minHeight: 36, fontSize: 15 },
  messageOk: { color: colors.success, fontWeight: '700' },
  messageNudge: { color: colors.danger, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  error: { color: colors.danger },
  tools: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tool: { flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.primaryTint, alignItems: 'center' },
  toolText: { color: colors.primaryInk, fontWeight: '600', fontSize: 14 },
  listen: { flex: 1, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  listenStop: { backgroundColor: '#374151' },
  listenText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
