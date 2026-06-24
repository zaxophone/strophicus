<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import { play, pause, resume, stop, subscribePlayback } from '$lib/player.js';

	let { chantId, label = 'Play' } = $props();

	// playback state for THIS button: idle unless it owns the active playback
	let pbState = $state('idle'); // idle | playing | paused
	let isActive = $state(false);
	let error = $state('');

	let events = null;
	let cachedFor = null;
	const myId = globalThis.crypto?.randomUUID?.() ?? `pb-${Math.random()}`;

	onMount(() =>
		subscribePlayback((a) => {
			isActive = a.id === myId;
			pbState = isActive ? a.state : 'idle';
		})
	);

	async function startOrResume() {
		error = '';
		if (isActive && pbState === 'paused') {
			resume();
			return;
		}
		try {
			if (events === null || cachedFor !== chantId) {
				events = (await api.chantAudio(chantId)).events;
				cachedFor = chantId;
			}
			if (!events.some((e) => e.type === 'note')) {
				error = 'No notes';
				return;
			}
			await play(myId, events);
		} catch (e) {
			error = String(e?.message ?? e);
		}
	}
</script>

<span class="play-controls">
	{#if isActive && pbState === 'playing'}
		<button class="play" onclick={pause} title="Pause">⏸ Pause</button>
		<button class="stop" onclick={stop} title="Stop">■ Stop</button>
	{:else if isActive && pbState === 'paused'}
		<button class="play" onclick={startOrResume} title="Resume">▶ Resume</button>
		<button class="stop" onclick={stop} title="Stop">■ Stop</button>
	{:else}
		<button class="play" onclick={startOrResume} title="Play the chant melody">▶ {label}</button>
	{/if}
	{#if error}<span class="play-error">{error}</span>{/if}
</span>

<style>
	.play-controls {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
	}
	.play {
		background: #3a6ea5;
		color: #fff;
		border: none;
		padding: 0.35rem 0.8rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.stop {
		background: #7a1f10;
		color: #fff;
		border: none;
		padding: 0.35rem 0.7rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.85rem;
	}
	.play-error {
		color: #b23;
		font-size: 0.8rem;
		margin-left: 0.4rem;
	}
</style>
