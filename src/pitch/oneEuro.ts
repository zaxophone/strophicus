function smoothingFactor(cutoffHz: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
}

/**
 * One Euro filter (Casiez et al., 2012): heavy smoothing while the signal is
 * steady, less as it moves faster, so jitter is hidden without lagging behind
 * real changes.
 */
export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;

  constructor(
    /** Smoothing at rest in Hz; lower is smoother. */
    private readonly minCutoff = 1.2,
    /** How quickly smoothing relaxes with speed; higher tracks changes faster. */
    private readonly beta = 0.4,
    private readonly derivativeCutoff = 1,
  ) {}

  filter(value: number, dt: number): number {
    if (this.x === null) {
      this.x = value;
      return value;
    }
    const rawDx = (value - this.x) / dt;
    const aD = smoothingFactor(this.derivativeCutoff, dt);
    this.dx += aD * (rawDx - this.dx);

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = smoothingFactor(cutoff, dt);
    this.x += a * (value - this.x);
    return this.x;
  }

  reset(): void {
    this.x = null;
    this.dx = 0;
  }
}
