<script>
	import { onMount } from 'svelte';

	// `gabc` is the notation body (e.g. "(c4) AL(dc~)le(...) ..."), as stored.
	// `colors` (optional) is a per-note array aligned 1:1 with Exsurge's note
	// glyphs: each entry is a CSS colour string (or null to leave default).
	let { gabc = '', annotation = '', colors = null } = $props();

	function applyColors() {
		if (!container || !colors) return;
		const glyphs = container.querySelectorAll('use[id^="note-"]');
		glyphs.forEach((el, i) => {
			const c = colors[i];
			if (c) el.setAttribute('fill', c);
		});
	}

	let container = $state(null);
	let error = $state('');
	let exsurge = null;

	async function render() {
		if (!container || !gabc) return;
		error = '';
		try {
			// exsurge touches `document`, so load it only in the browser.
			// Vendored build of bbloomf/exsurge (see lib/vendor/README.md).
			if (!exsurge) {
				// The vendored UMD bundle assigns `globalThis.exsurge` as a side
				// effect (see lib/vendor/README.md); the module namespace is empty.
				await import('$lib/vendor/exsurge.js');
				exsurge = globalThis.exsurge;
			}
			const ctxt = new exsurge.ChantContext();
			const mappings = exsurge.Gabc.createMappingsFromSource(ctxt, gabc);
			const score = new exsurge.ChantScore(ctxt, mappings, true);
			if (annotation && exsurge.Annotation) {
				score.annotation = new exsurge.Annotation(ctxt, annotation);
			}
			const width = container.clientWidth || 800;
			// This build performs layout synchronously; the optional callbacks are
			// not reliably invoked, so call createSvg directly afterward.
			score.performLayout(ctxt, () => {});
			score.layoutChantLines(ctxt, width, () => {});
			container.innerHTML = score.createSvg(ctxt);
			applyColors();
		} catch (e) {
			error = String(e?.message ?? e);
			container.innerHTML = '';
		}
	}

	onMount(render);

	// Re-render whenever the gabc source changes.
	$effect(() => {
		gabc;
		render();
	});

	// Re-apply colours when they change (no full re-render needed).
	$effect(() => {
		colors;
		applyColors();
	});
</script>

<div class="notation" bind:this={container}></div>
{#if error}
	<p class="notation-error">Could not render notation: {error}</p>
{/if}

<style>
	.notation {
		width: 100%;
		overflow-x: auto;
		min-height: 60px;
	}
	.notation :global(svg) {
		max-width: 100%;
		height: auto;
	}
	.notation-error {
		color: #b23;
		font-size: 0.85rem;
	}
</style>
