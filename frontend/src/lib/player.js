// Chant playback with transport controls (play / pause / resume / stop).
//
// Built on Tone's Transport so playback can be paused and stopped. Only one
// chant plays at a time, so this is a module-level singleton: starting a new
// playback stops any previous one. Components subscribe to state changes and
// compare the active id to decide what controls to show.
//
// Each note carries a Solesmes `duration` multiplier of the basic beat (dots
// double, episemata broaden, the note before a quilisma lengthens, liquescents
// lighten); ictus notes get a subtle accent. Bars are breath pauses.
import * as Tone from 'tone';

let synth = null;
let part = null;

let active = { id: null, state: 'idle' }; // state: idle | playing | paused
const listeners = new Set();

function getSynth() {
	if (!synth) {
		synth = new Tone.Synth({
			oscillator: { type: 'triangle' },
			envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.12 }
		}).toDestination();
		synth.volume.value = -6;
	}
	return synth;
}

function emit() {
	for (const fn of listeners) fn(active);
}

/** Subscribe to playback state. Returns an unsubscribe function. */
export function subscribePlayback(fn) {
	listeners.add(fn);
	fn(active);
	return () => listeners.delete(fn);
}

function teardown() {
	const tr = Tone.getTransport();
	tr.stop();
	tr.cancel(0);
	tr.position = 0;
	if (part) {
		part.dispose();
		part = null;
	}
	if (synth) synth.triggerRelease();
}

/** Build the schedule and start playing `events` under the given owner `id`. */
export async function play(id, events, { beat = 0.333 } = {}) {
	await Tone.start();
	teardown();

	const scheduled = [];
	let t = 0;
	for (const e of events) {
		if (e.type === 'note') {
			const dur = beat * (e.duration ?? 1);
			// velocity follows the dynamic line (crescendo up / decrescendo down);
			// fall back to a stress-based value for older payloads.
			const vel = e.velocity ?? (e.stress ? 0.95 : 0.8);
			scheduled.push({
				time: t,
				freq: Tone.Frequency(e.midi, 'midi').toFrequency(),
				// fused notes (held bi/tristropha, pressus) sustain fully (no repercussion)
				dur: dur * (e.fused ? 0.99 : 0.92),
				vel
			});
			t += dur;
		} else if (e.type === 'bar') {
			t += beat * 0.6 * (e.strength || 1);
		}
	}

	part = new Tone.Part((time, ev) => {
		getSynth().triggerAttackRelease(ev.freq, ev.dur, time, ev.vel);
	}, scheduled);
	part.start(0);

	const tr = Tone.getTransport();
	// reset to idle shortly after the last note ends
	tr.scheduleOnce(() => {
		teardown();
		active = { id: null, state: 'idle' };
		emit();
	}, t + 0.2);
	tr.start();

	active = { id, state: 'playing' };
	emit();
	return t; // total scheduled duration in seconds
}

export function pause() {
	if (active.state !== 'playing') return;
	Tone.getTransport().pause();
	if (synth) synth.triggerRelease(); // avoid a hanging note
	active = { ...active, state: 'paused' };
	emit();
}

export function resume() {
	if (active.state !== 'paused') return;
	Tone.getTransport().start();
	active = { ...active, state: 'playing' };
	emit();
}

export function stop() {
	teardown();
	active = { id: null, state: 'idle' };
	emit();
}
