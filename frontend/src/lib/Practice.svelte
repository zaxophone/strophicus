<script>
	import { api } from '$lib/api.js';
	import { PitchRecorder, midiToName } from '$lib/pitch.js';
	import { scorePerformance } from '$lib/score.js';
	import Notation from '$lib/Notation.svelte';

	let { chantId, gabc = '' } = $props();

	const NOTE_COLORS = { good: '#2e8b57', bad: '#c0392b', missed: '#c9c0b0' };

	let phase = $state('idle'); // idle | recording | done | error
	let ref = null;
	let recorder = null;
	let live = $state(null);
	let result = $state(null);
	let noteColors = $state(null);
	let error = $state('');

	async function ensureRef() {
		if (!ref || ref._id !== chantId) {
			ref = await api.chantAudio(chantId);
			ref._id = chantId;
		}
	}

	async function start() {
		error = '';
		result = null;
		try {
			await ensureRef();
			if (!ref.notes || ref.notes.length < 2) {
				error = 'This chant has no playable melody to score against.';
				phase = 'error';
				return;
			}
			recorder = new PitchRecorder();
			recorder.onpitch = (m) => (live = m);
			await recorder.start();
			phase = 'recording';
		} catch (e) {
			error = 'Microphone unavailable: ' + (e?.message ?? e);
			phase = 'error';
		}
	}

	function stop() {
		const frames = recorder.stop();
		live = null;
		result = scorePerformance(frames, ref.notes, {
			finalisPitchClass: ref.finalis_pitch_class
		});
		result.frameCount = frames.length;
		noteColors = buildNoteColors(result);
		phase = 'done';
	}

	// One colour per reference note (1:1 with the rendered note glyphs): a note is
	// "good" if the step leading into it matched the chant's contour, "bad" if it
	// drifted, and "missed" (grey) if nothing was heard there.
	function buildNoteColors(r) {
		const sung = r.sungNotes ?? [];
		const intervals = r.intervals ?? [];
		return sung.map((s, i) => {
			if (s == null) return NOTE_COLORS.missed;
			if (i === 0) return NOTE_COLORS.good; // first note: no interval to judge
			const iv = intervals[i - 1];
			return iv && iv.match ? NOTE_COLORS.good : NOTE_COLORS.bad;
		});
	}

	const pct = (x) => Math.round(x * 100);

	function verdict(r) {
		if (r.frameCount < 8) return 'Not much was heard — sing a little longer and louder.';
		if (r.overall >= 0.85) return 'Excellent — the melody matched well!';
		if (r.overall >= 0.65) return 'Good — the shape is mostly right.';
		if (r.overall >= 0.4) return 'Getting there — watch the rises and falls.';
		return 'Keep practising — the contour drifted from the chant.';
	}

	const BARS = [
		{ key: 'contour', label: 'Contour (up/down)', hint: 'Did the melody rise and fall correctly' },
		{ key: 'interval', label: 'Intervals', hint: 'Were the leaps the right size' },
		{ key: 'final', label: 'Final note', hint: 'Did you land on the right final' }
	];
</script>

<div class="practice">
	{#if phase === 'idle' || phase === 'error'}
		<button class="rec" onclick={start}>🎤 Sing this chant</button>
		<p class="muted small">
			You'll be asked for microphone access. Sing the melody at any comfortable
			pitch — scoring is transposition-free.
		</p>
		{#if error}<p class="err">{error}</p>{/if}
	{:else if phase === 'recording'}
		<button class="rec recording" onclick={stop}>■ Stop &amp; score</button>
		<div class="live">
			<span class="dot"></span>
			Listening… {live != null ? midiToName(live) : '—'}
		</div>
	{:else if phase === 'done'}
		<div class="result">
			<div class="overall">
				<div class="score-num">{pct(result.overall)}<span>%</span></div>
				<p class="verdict">{verdict(result)}</p>
			</div>
			<div class="bars">
				{#each BARS as b}
					<div class="bar-row">
						<span class="bar-label" title={b.hint}>{b.label}</span>
						<div class="bar"><div class="fill" style="width:{pct(result[b.key])}%"></div></div>
						<span class="bar-pct">{pct(result[b.key])}%</span>
					</div>
				{/each}
			</div>
			{#if gabc && noteColors}
				<div class="scored-notation">
					{#key chantId}
						<Notation {gabc} colors={noteColors} annotation="Your performance" />
					{/key}
				</div>
				<p class="muted small legend">
					Notes are coloured by how you sang: <b class="ok">green</b> matched the chant,
					<b class="bad">red</b> drifted, <b class="grey">grey</b> wasn't heard.
				</p>
			{/if}
			<p class="muted small">
				{result.frameCount} voiced frames · sung ≈ {result.transposition >= 0 ? '+' : ''}{result.transposition.toFixed(
					1
				)} semitones from notated pitch
			</p>
			<button class="rec" onclick={start}>🎤 Sing again</button>
		</div>
	{/if}
</div>

<style>
	.practice {
		margin-top: 0.75rem;
		padding: 0.85rem;
		border: 1px solid #d8cfc0;
		border-radius: 10px;
		background: #fcfaf6;
	}
	.rec {
		background: #b2452a;
		color: #fff;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
	}
	.rec.recording {
		background: #7a1f10;
	}
	.small {
		font-size: 0.8rem;
	}
	.muted {
		color: #9a8f80;
	}
	.err {
		color: #b23;
		font-size: 0.85rem;
	}
	.live {
		margin-top: 0.6rem;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: #b2452a;
		animation: pulse 1s infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}
	.overall {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.8rem;
	}
	.score-num {
		font-size: 2.4rem;
		font-weight: 700;
		color: #6b2d10;
		line-height: 1;
	}
	.score-num span {
		font-size: 1.1rem;
	}
	.verdict {
		margin: 0;
		color: #4a4a4a;
	}
	.bar-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.4rem;
	}
	.bar-label {
		flex: 0 0 9.5rem;
		font-size: 0.85rem;
	}
	.bar {
		flex: 1;
		height: 0.7rem;
		background: #ece5d8;
		border-radius: 999px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: linear-gradient(90deg, #c98a3a, #6b2d10);
	}
	.bar-pct {
		flex: 0 0 2.6rem;
		text-align: right;
		font-size: 0.82rem;
		color: #8a7f70;
	}
	.scored-notation {
		margin-top: 0.7rem;
		background: #fff;
		border: 1px solid #ece5d8;
		border-radius: 8px;
		padding: 0.4rem 0.6rem;
	}
	.legend {
		margin-top: 0.3rem;
	}
	.legend .ok {
		color: #2e7d32;
	}
	.legend .bad {
		color: #b23;
	}
	.legend .grey {
		color: #9a8f80;
	}
</style>
