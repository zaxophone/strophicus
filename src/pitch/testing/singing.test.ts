import { judgeMelody } from '../../exercise/judge';
import {
  makeRandom,
  NoteSpec,
  randomStyle,
  renderSinger,
  sing,
  vowelHarmonics,
} from './singer';

const OFFSETS = [0, 2, 4]; // do re mi
const SINGERS = 30;

/**
 * Simulated singers who all intend a correct do-re-mi but sing like people do:
 * scooping into notes, overshooting, drifting toward the next note, vibrato,
 * breathy onsets and consonant gaps, from an arbitrary starting pitch.
 */
function failures(
  tweak: (style: ReturnType<typeof randomStyle>, random: ReturnType<typeof makeRandom>) => void,
  foldOctaves: boolean,
): string[] {
  const failed: string[] = [];
  for (let seed = 1; seed <= SINGERS; seed++) {
    const random = makeRandom(seed * 7919);
    const style = randomStyle(random);
    tweak(style, random);
    const notes: NoteSpec[] = OFFSETS.map((semitones, i) => ({
      semitones,
      seconds: random.between(0.45, 0.75),
      gapAfter: i < OFFSETS.length - 1 ? random.between(0, 0.15) : 0,
    }));
    const base = Math.round(random.between(48, 70));
    const sung = sing(renderSinger(notes, base, style, random), 44100, { foldOctaves });
    if (!judgeMelody(sung, OFFSETS).passed) failed.push(`seed ${seed}`);
  }
  return failed;
}

describe('simulated singers on do re mi', () => {
  it('are scored correctly with ordinary voices', () => {
    expect(failures(() => {}, false)).toEqual([]);
  });

  it('are scored correctly on vowels with a weak fundamental', () => {
    const failed = failures((style, random) => {
      style.harmonics = vowelHarmonics(random.between(0.05, 0.5), random.between(1.5, 3));
    }, false);
    expect(failed).toEqual([]);
  });

  it('are scored correctly when some notes read an octave off', () => {
    const failed = failures((style, random) => {
      // Nearly all energy in the 2nd harmonic, so the detector hears an octave up.
      style.noteHarmonics = OFFSETS.map(() =>
        random.uniform() < 0.35 ? [0.02, 0.3, 0.03, 0.01] : undefined,
      );
    }, true);
    expect(failed).toEqual([]);
  });
});
