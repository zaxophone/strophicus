import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useBookRecording } from '../audio/useBookRecording';
import { ClefGlyph } from '../chant/ClefGlyph';
import { ChantStaff } from '../chant/ChantStaff';
import { parseBlock } from '../exercise/blocks';
import type { Exercise } from '../exercise/exercise';
import { colors } from '../ui/theme';
import { ArrowButton, barStyles, FitToHeight, RecordingButton, ReferencePitch } from './exerciseParts';

interface Props {
  exercise: Exercise;
  /** The paragraphs on this page. */
  paragraphs: string[];
  page: number;
  /** Whether this is the last exercise of the lesson, so the last arrow says Finish. */
  finish?: boolean;
  pages: number;
  /** Where Back leads from the very first page; null if there is nowhere to go. */
  tonic: number;
  onTonicChange: (tonic: number) => void;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
}

/**
 * One page of an exercise's written instructions. The reference pitch is on the
 * last page, just before the exercise itself. The arrows are never locked.
 */
export function InstructionPage({ exercise, paragraphs, page, pages, finish, tonic, onTonicChange, canGoBack, onBack, onNext }: Props) {
  const last = page === pages - 1;
  // A reading has no exercise page, so its recording is played from here.
  const book = useBookRecording(exercise);
  // The exercise itself is one more page after the instructions, unless there is none.
  const total = exercise.kind === 'read' ? pages : pages + 1;
  const hasReference = exercise.kind === 'sing' || exercise.kind === 'name' || (exercise.kind === 'accent' && !!exercise.chant.notes);
  // Smaller type on short screens, so a page of text still fits without scrolling.
  const { height } = useWindowDimensions();
  const { width } = useWindowDimensions();
  const size = height >= 760 ? 18 : height >= 680 ? 16 : 15;
  // The card is the screen less the page's padding and its own padding and border.
  const figureWidth = width - 32 - 32 - 2;
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <FitToHeight>
        <View style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>{exercise.title}</Text>
          {paragraphs.map((paragraph, i) => {
            const block = parseBlock(paragraph);
            return block.kind === 'staff' ? (
              <View key={i} style={styles.figure}>
                <ChantStaff width={figureWidth} chant={block.chant} labels={block.words ?? []} marks={[]} gestures={block.gestures} />
              </View>
            ) : (
              <Text key={i} style={[styles.text, { fontSize: size, lineHeight: size * 1.5 }]}>
                {inline(block.text)}
              </Text>
            );
          })}
        </View>

        {last && exercise.kind === 'read' && book.available && (
          <View style={styles.figure}>
            <RecordingButton playing={book.playing} onPress={book.toggle} />
          </View>
        )}

        {last && hasReference && (
          <ReferencePitch
            tonic={tonic}
            onTonicChange={onTonicChange}
            exercise={exercise}
            hint={
              exercise.kind === 'sing'
                ? 'On the next page, "Hear it" plays the exercise from this note. You can sing at any pitch you like.'
                : exercise.kind === 'accent'
                  ? 'On the next page, "Hear it" plays the melody from this note, so you can listen for the word that goes up.'
                  : 'On the next page, "Hear it" plays the melody from this note, so you can check the names by ear.'
            }
          />
        )}
        </View>
        </FitToHeight>
      </View>

      <View style={barStyles.bar}>
        <View style={barStyles.main}>
          <ArrowButton direction="back" off={!canGoBack} onPress={onBack} />
          <View style={styles.pips} accessibilityLabel={`Page ${page + 1} of ${total}`}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.pip, i === page && styles.pipHere]} />
            ))}
          </View>
          <ArrowButton direction="next" ready finish={finish && last && exercise.kind === 'read'} onPress={onNext} />
        </View>
      </View>
    </View>
  );
}

/** A paragraph's text with `**bold**` made bold, `__italic__` italic and `{{clef}}` drawn as the do clef. */
function inline(text: string) {
  const withClefs = (part: string, key: string) =>
    part.split('{{clef}}').flatMap((chunk, n) => (n === 0 ? [chunk] : [<InlineClef key={`${key}-c${n}`} />, chunk]));
  return text.split('**').flatMap((part, b) => {
    const pieces = part.split('__').flatMap((piece, i) =>
      i % 2 ? [<Text key={`i${b}-${i}`} style={{ fontStyle: 'italic' }}>{withClefs(piece, `${b}-${i}`)}</Text>] : withClefs(piece, `${b}-${i}`),
    );
    return b % 2 ? [<Text key={`b${b}`} style={{ fontWeight: '700' }}>{pieces}</Text>] : pieces;
  });
}

/** The do clef drawn in the middle of a sentence. */
function InlineClef() {
  return (
    <View style={{ width: 12.8, height: 14.4 }}>
      <ClefGlyph />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 16 },
  page: { alignSelf: 'stretch', width: '100%', gap: 18 },
  figure: { alignItems: 'center', paddingVertical: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  text: { fontSize: 18, lineHeight: 27, color: colors.body },
  pips: { flex: 1, height: 64, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  pip: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  pipHere: { backgroundColor: colors.primary, width: 14, height: 14, borderRadius: 7 },
});
