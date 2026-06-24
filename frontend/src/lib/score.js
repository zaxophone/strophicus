// Sung-audio scoring against a reference chant pitch sequence (Phase 3 v1).
//
// Chant has no fixed concert pitch and no fixed tempo, so we:
//   1. estimate the singer's transposition (median offset) and remove it,
//   2. align the sung pitch frames to the reference notes with DTW (handles the
//      free, un-metered timing — a sustained note maps many frames to one note),
//   3. score on transposition-invariant signals: contour (up/same/down) first,
//      as the most forgiving signal, then interval accuracy, then whether the
//      final note resolves correctly.
//
// All inputs/outputs are plain numbers (MIDI, fractional ok) so this is pure and
// unit-testable without any audio.

const SAME_THRESHOLD = 0.5; // semitones: |Δ| below this counts as "same pitch"

function median(xs) {
	if (xs.length === 0) return 0;
	const s = [...xs].sort((a, b) => a - b);
	const m = Math.floor(s.length / 2);
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function direction(delta) {
	if (delta > SAME_THRESHOLD) return 1;
	if (delta < -SAME_THRESHOLD) return -1;
	return 0;
}

/**
 * DTW align sung frames (already transposition-adjusted) to reference notes.
 * Standard step set {(1,1),(1,0),(0,1)}. Returns { path, cost } where path is
 * index pairs [frameIndex, refIndex] and cost is the total alignment distance.
 */
export function dtwAlign(frames, ref) {
	const n = frames.length;
	const m = ref.length;
	const INF = Infinity;
	// cost matrix (n+1)x(m+1)
	const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
	D[0][0] = 0;
	for (let i = 1; i <= n; i++) {
		for (let j = 1; j <= m; j++) {
			const cost = Math.abs(frames[i - 1] - ref[j - 1]);
			const best = Math.min(D[i - 1][j - 1], D[i - 1][j], D[i][j - 1]);
			D[i][j] = cost + best;
		}
	}
	// backtrack
	const path = [];
	let i = n;
	let j = m;
	while (i > 0 && j > 0) {
		path.push([i - 1, j - 1]);
		const diag = D[i - 1][j - 1];
		const up = D[i - 1][j];
		const left = D[i][j - 1];
		if (diag <= up && diag <= left) {
			i--;
			j--;
		} else if (up <= left) {
			i--;
		} else {
			j--;
		}
	}
	path.reverse();
	return { path, cost: D[n][m] };
}

/**
 * Collapse the DTW alignment to one sung pitch per reference note (the median of
 * all frames aligned to that note). Returns an array of length ref.length;
 * entries with no aligned frames are null.
 */
export function perNoteSungPitch(frames, ref, path) {
	const buckets = Array.from({ length: ref.length }, () => []);
	for (const [fi, ri] of path) buckets[ri].push(frames[fi]);
	return buckets.map((b) => (b.length ? median(b) : null));
}

function contour(seq) {
	// seq may contain nulls; treat a null as no movement vs previous known.
	const dirs = [];
	for (let i = 1; i < seq.length; i++) {
		if (seq[i] == null || seq[i - 1] == null) {
			dirs.push(null);
		} else {
			dirs.push(direction(seq[i] - seq[i - 1]));
		}
	}
	return dirs;
}

/**
 * Score a sung pitch trace (array of MIDI floats, voiced frames only) against a
 * reference note sequence (array of MIDI ints).
 *
 * Returns { overall, contour, interval, final, transposition, sungNotes, detail }.
 * Each score is 0..1.
 */
export function scorePerformance(sungFrames, ref, opts = {}) {
	const intervalTolerance = opts.intervalTolerance ?? 1.0; // semitones
	if (ref.length < 2 || sungFrames.length < 2) {
		return {
			overall: 0,
			contour: 0,
			interval: 0,
			final: 0,
			transposition: 0,
			sungNotes: [],
			refNotes: ref,
			intervals: [],
			detail: { reason: 'not enough data' }
		};
	}

	// 1. transposition: chant is relative-pitch, so find the global offset that
	// best aligns the singer to the reference. The median difference is a good
	// starting guess but is skewed when notes differ; a small grid search around
	// it picks the offset with the lowest DTW cost (contour/interval are
	// offset-invariant, but a clean alignment needs the right offset).
	const base = median(ref) - median(sungFrames);
	let transposition = base;
	let path = null;
	let adjusted = null;
	let bestCost = Infinity;
	for (let d = -3; d <= 3.0001; d += 0.25) {
		const off = base + d;
		const adj = sungFrames.map((p) => p + off);
		const { path: p, cost } = dtwAlign(adj, ref);
		if (cost < bestCost) {
			bestCost = cost;
			transposition = off;
			path = p;
			adjusted = adj;
		}
	}

	// 2. collapse to one sung note per reference note.
	const sungNotes = perNoteSungPitch(adjusted, ref, path);

	// 3a. contour accuracy
	const refContour = contour(ref);
	const sungContour = contour(sungNotes);
	let cMatch = 0;
	let cTotal = 0;
	for (let i = 0; i < refContour.length; i++) {
		if (sungContour[i] == null) continue;
		cTotal++;
		if (sungContour[i] === refContour[i]) cMatch++;
	}
	const contourScore = cTotal ? cMatch / cTotal : 0;

	// per-interval feedback: direction the chant moves vs what was sung
	const intervals = refContour.map((rd, i) => ({
		refDir: rd,
		sungDir: sungContour[i],
		match: sungContour[i] != null && sungContour[i] === rd
	}));

	// 3b. interval accuracy (semitone-level direction+size)
	let iMatch = 0;
	let iTotal = 0;
	for (let i = 1; i < ref.length; i++) {
		if (sungNotes[i] == null || sungNotes[i - 1] == null) continue;
		iTotal++;
		const refInt = ref[i] - ref[i - 1];
		const sungInt = sungNotes[i] - sungNotes[i - 1];
		if (Math.abs(refInt - sungInt) <= intervalTolerance) iMatch++;
	}
	const intervalScore = iTotal ? iMatch / iTotal : 0;

	// 3c. final resolution. If the chant's modal finalis is known, score the sung
	// final against that pitch class (the spec's "land on the correct final for
	// its mode"); otherwise fall back to matching the reference's last note.
	const lastSung = [...sungNotes].reverse().find((x) => x != null);
	const finalisPitchClass = opts.finalisPitchClass ?? null;
	let finalScore;
	let finalErr;
	if (lastSung == null) {
		finalScore = 0;
		finalErr = null;
	} else if (finalisPitchClass != null) {
		const pc = ((Math.round(lastSung) % 12) + 12) % 12;
		const diff = Math.abs(pc - finalisPitchClass);
		finalErr = Math.min(diff, 12 - diff); // circular pitch-class distance
		finalScore = Math.max(0, 1 - finalErr / 2);
	} else {
		finalErr = Math.abs(lastSung - ref[ref.length - 1]);
		finalScore = Math.max(0, 1 - finalErr / 2);
	}

	// weighted overall — contour dominates (most forgiving, per the spec).
	const overall = 0.5 * contourScore + 0.3 * intervalScore + 0.2 * finalScore;

	return {
		overall,
		contour: contourScore,
		interval: intervalScore,
		final: finalScore,
		transposition,
		sungNotes,
		refNotes: ref,
		intervals,
		detail: {
			notesCovered: cTotal,
			refIntervals: refContour.length,
			finalError: finalErr
		}
	};
}

export const _internal = { median, direction, contour };
