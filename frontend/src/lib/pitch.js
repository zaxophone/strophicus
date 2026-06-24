// Microphone pitch tracking via Web Audio + pitchy (autocorrelation, client-side
// per the Phase 3 v1 plan). Collects voiced pitch frames as MIDI floats.
import { PitchDetector } from 'pitchy';

export function hzToMidi(hz) {
	return 69 + 12 * Math.log2(hz / 440);
}

export function midiToName(m) {
	const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const r = Math.round(m);
	return NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1);
}

export class PitchRecorder {
	constructor({ clarityThreshold = 0.85, minHz = 70, maxHz = 1200 } = {}) {
		this.clarityThreshold = clarityThreshold;
		this.minHz = minHz;
		this.maxHz = maxHz;
		this.running = false;
		this.frames = []; // voiced MIDI floats, in capture order
		this.onpitch = null; // (midiOrNull, clarity) => void  (live readout)
	}

	async start() {
		this.stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
		});
		this.ctx = new (window.AudioContext || window.webkitAudioContext)();
		const source = this.ctx.createMediaStreamSource(this.stream);
		this.analyser = this.ctx.createAnalyser();
		this.analyser.fftSize = 2048;
		source.connect(this.analyser);
		this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
		this.buf = new Float32Array(this.detector.inputLength);
		this.frames = [];
		this.running = true;
		this._tick();
	}

	_tick = () => {
		if (!this.running) return;
		this.analyser.getFloatTimeDomainData(this.buf);
		const [hz, clarity] = this.detector.findPitch(this.buf, this.ctx.sampleRate);
		if (clarity >= this.clarityThreshold && hz >= this.minHz && hz <= this.maxHz) {
			const midi = hzToMidi(hz);
			this.frames.push(midi);
			this.onpitch?.(midi, clarity);
		} else {
			this.onpitch?.(null, clarity);
		}
		this._raf = requestAnimationFrame(this._tick);
	};

	/** Stop capture and release the mic. Returns the collected MIDI frames. */
	stop() {
		this.running = false;
		if (this._raf) cancelAnimationFrame(this._raf);
		this.stream?.getTracks().forEach((t) => t.stop());
		this.ctx?.close();
		return this.frames;
	}
}
