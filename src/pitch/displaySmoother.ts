/**
 * Heavy smoothing for a numeric or needle display. Within a note it averages
 * over about `slowSeconds`, so vibrato and drift barely register, and it speeds
 * up toward `fastSeconds` as the error grows, so a real note change still
 * lands quickly. Input and output are fractional MIDI.
 */
export class DisplaySmoother {
  private value: number | null = null;

  constructor(
    private readonly slowSeconds = 0.3,
    private readonly fastSeconds = 0.08,
    /** Error in semitones at which smoothing is about halfway to fast. */
    private readonly kneeSemitones = 0.6,
  ) {}

  push(midi: number | null, dt: number): number | null {
    if (midi === null) {
      this.value = null;
      return null;
    }
    if (this.value === null) {
      this.value = midi;
      return midi;
    }
    const err = midi - this.value;
    const ratio = err / this.kneeSemitones;
    const tau =
      this.fastSeconds +
      (this.slowSeconds - this.fastSeconds) / (1 + ratio * ratio);
    this.value += err * (1 - Math.exp(-dt / tau));
    return this.value;
  }
}
