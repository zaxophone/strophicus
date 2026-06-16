<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api.js';
	import Notation from '$lib/Notation.svelte';

	let tab = $state('study');
	let stats = $state({ deck_size: 0, due_now: 0, reviewed_today: 0, chants_in_deck: 0 });

	// --- Study state ---
	let queue = $state([]);
	let current = $derived(queue[0] ?? null);
	let revealed = $state(false);
	let studyLoading = $state(true);

	const GRADES = [
		{ g: 1, label: 'Blackout', cls: 'g1' },
		{ g: 2, label: 'Wrong', cls: 'g2' },
		{ g: 3, label: 'Hard', cls: 'g3' },
		{ g: 4, label: 'Good', cls: 'g4' },
		{ g: 5, label: 'Perfect', cls: 'g5' }
	];

	async function refreshStats() {
		stats = await api.stats();
	}

	async function loadQueue() {
		studyLoading = true;
		queue = await api.dueCards(20);
		revealed = false;
		studyLoading = false;
	}

	async function submitGrade(g) {
		if (!current) return;
		await api.grade(current.chant.id, current.card_type, g);
		queue = queue.slice(1);
		revealed = false;
		refreshStats();
	}

	// Cloze text with the target word shown as a blank (front) or revealed (back).
	function clozeText(cloze, reveal) {
		return cloze.text_tokens.map((tok, i) => {
			if (i !== cloze.blank_index) return { tok, blank: false };
			return { tok: reveal ? tok : '_____', blank: true };
		});
	}

	// --- Browse state ---
	let search = $state('');
	let mode = $state('');
	let office = $state('');
	let results = $state([]);
	let total = $state(0);
	let browseLoading = $state(false);
	let previewId = $state(null);
	let previewGabc = $state('');

	const MODES = ['1', '2', '3', '4', '5', '6', '7', '8'];

	async function runSearch() {
		browseLoading = true;
		const data = await api.listChants({ search, mode, office, limit: 50 });
		results = data.items;
		total = data.total;
		browseLoading = false;
	}

	async function toggleDeck(item) {
		if (item.in_deck) {
			await api.removeFromDeck(item.id);
			item.in_deck = false;
		} else {
			await api.addToDeck(item.id);
			item.in_deck = true;
		}
		results = results;
		refreshStats();
	}

	async function togglePreview(item) {
		if (previewId === item.id) {
			previewId = null;
			return;
		}
		const full = await api.getChant(item.id);
		previewGabc = full.gabc;
		previewId = item.id;
	}

	onMount(async () => {
		await Promise.all([refreshStats(), loadQueue()]);
		await runSearch();
	});
</script>

<nav class="tabs">
	<button class:active={tab === 'study'} onclick={() => (tab = 'study')}>
		Study {#if stats.due_now}<span class="badge">{stats.due_now}</span>{/if}
	</button>
	<button class:active={tab === 'browse'} onclick={() => (tab = 'browse')}>Browse</button>
	<div class="stats">
		<span>{stats.deck_size} cards · {stats.chants_in_deck} chants</span>
		<span>Due: {stats.due_now}</span>
		<span>Today: {stats.reviewed_today}</span>
	</div>
</nav>

{#if tab === 'study'}
	<section class="study">
		{#if studyLoading}
			<p class="muted">Loading…</p>
		{:else if !current}
			<div class="empty">
				<h2>All caught up 🎉</h2>
				<p class="muted">No chants are due right now.</p>
				<button onclick={() => (tab = 'browse')}>Browse chants to add</button>
				<button class="ghost" onclick={loadQueue}>Refresh</button>
			</div>
		{:else}
			<article class="card">
				<div class="meta">
					<span class="tag card-type">{current.card_type_label}</span>
					{#if current.chant.office_label}<span class="tag">{current.chant.office_label}</span>{/if}
					{#if current.chant.mode}<span class="tag">Mode {current.chant.mode}</span>{/if}
				</div>
				<h2 class="incipit">{current.chant.incipit ?? 'Untitled chant'}</h2>

				{#if current.card_type === 'recall'}
					{#if !revealed}
						<p class="prompt muted">Recall the melody, then reveal the notation.</p>
						<button class="reveal" onclick={() => (revealed = true)}>Reveal notation</button>
					{:else}
						{#key current.chant.id + ':recall'}
							<Notation gabc={current.chant.gabc} annotation={current.chant.office_label ?? ''} />
						{/key}
					{/if}
				{:else if current.card_type === 'cloze' && current.cloze}
					<p class="cloze-text">
						{#each clozeText(current.cloze, revealed) as { tok, blank }}<span
								class:blank
								class:revealed={blank && revealed}>{tok}</span
							>{' '}{/each}
					</p>
					{#if !revealed}
						<p class="prompt muted">Recall the missing word, then reveal.</p>
						<button class="reveal" onclick={() => (revealed = true)}>Reveal word</button>
					{/if}
				{:else if current.card_type === 'continuation' && current.continuation}
					{#if !revealed}
						{#key current.chant.id + ':open'}
							<Notation gabc={current.continuation.opening_gabc} annotation="Opening" />
						{/key}
						<p class="prompt muted">Sing the continuation from here, then reveal the full chant.</p>
						<button class="reveal" onclick={() => (revealed = true)}>Reveal full notation</button>
					{:else}
						{#key current.chant.id + ':full'}
							<Notation gabc={current.chant.gabc} annotation={current.chant.office_label ?? ''} />
						{/key}
					{/if}
				{/if}

				{#if revealed}
					<p class="prompt muted">How well did you recall it?</p>
					<div class="grades">
						{#each GRADES as { g, label, cls }}
							<button class={'grade ' + cls} onclick={() => submitGrade(g)}>
								<strong>{g}</strong><span>{label}</span>
							</button>
						{/each}
					</div>
				{/if}
			</article>
			<p class="muted queue-count">{queue.length} due in this session</p>
		{/if}
	</section>
{:else}
	<section class="browse">
		<form
			class="filters"
			onsubmit={(e) => {
				e.preventDefault();
				runSearch();
			}}
		>
			<input placeholder="Search incipit…" bind:value={search} />
			<select bind:value={mode}>
				<option value="">Any mode</option>
				{#each MODES as m}<option value={m}>Mode {m}</option>{/each}
			</select>
			<button type="submit">Search</button>
		</form>

		{#if browseLoading}
			<p class="muted">Searching…</p>
		{:else}
			<p class="muted">{total} matching chants</p>
			<ul class="results">
				{#each results as item (item.id)}
					<li>
						<div class="row">
							<div class="info">
								<span class="title">{item.incipit ?? 'Untitled'}</span>
								<span class="sub">
									{#if item.office_label}{item.office_label}{/if}
									{#if item.mode}· Mode {item.mode}{/if}
								</span>
							</div>
							<div class="actions">
								<button class="ghost" onclick={() => togglePreview(item)}>
									{previewId === item.id ? 'Hide' : 'Preview'}
								</button>
								<button class:added={item.in_deck} onclick={() => toggleDeck(item)}>
									{item.in_deck ? '✓ In deck' : '+ Add'}
								</button>
							</div>
						</div>
						{#if previewId === item.id}
							<Notation gabc={previewGabc} annotation={item.office_label ?? ''} />
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.tabs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-bottom: 2px solid #e2dcd0;
		margin-bottom: 1.25rem;
	}
	.tabs button {
		background: none;
		border: none;
		padding: 0.6rem 0.9rem;
		font-size: 1rem;
		cursor: pointer;
		color: #8a7f70;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
	}
	.tabs button.active {
		color: #6b2d10;
		border-bottom-color: #6b2d10;
		font-weight: 600;
	}
	.badge {
		background: #6b2d10;
		color: #fff;
		border-radius: 999px;
		padding: 0 0.4rem;
		font-size: 0.75rem;
	}
	.stats {
		margin-left: auto;
		display: flex;
		gap: 0.85rem;
		font-size: 0.8rem;
		color: #9a8f80;
	}
	.card {
		background: #fff;
		border: 1px solid #e2dcd0;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}
	.meta {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	.tag {
		background: #f0e9dd;
		color: #6b2d10;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.78rem;
	}
	.tag.card-type {
		background: #6b2d10;
		color: #fff;
	}
	.cloze-text {
		font-size: 1.1rem;
		line-height: 1.9;
		margin: 1rem 0;
	}
	.cloze-text .blank {
		font-weight: 700;
		color: #6b2d10;
		border-bottom: 2px solid #6b2d10;
		padding: 0 0.2rem;
	}
	.cloze-text .blank.revealed {
		background: #fbeecf;
	}
	.incipit {
		margin: 0.2rem 0 0.8rem;
		font-size: 1.5rem;
	}
	.prompt {
		margin: 1rem 0 0.6rem;
	}
	.muted {
		color: #9a8f80;
	}
	button.reveal {
		background: #6b2d10;
		color: #fff;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
	}
	.grades {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.grade {
		flex: 1;
		min-width: 90px;
		border: 1px solid #d8cfc0;
		background: #fff;
		border-radius: 8px;
		padding: 0.55rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}
	.grade strong {
		font-size: 1.1rem;
	}
	.grade span {
		font-size: 0.75rem;
		color: #8a7f70;
	}
	.grade.g1:hover, .grade.g2:hover { border-color: #c0392b; }
	.grade.g3:hover { border-color: #e0a000; }
	.grade.g4:hover, .grade.g5:hover { border-color: #2e8b57; }
	.queue-count {
		margin-top: 0.75rem;
		font-size: 0.8rem;
	}
	.empty {
		text-align: center;
		padding: 2rem 0;
	}
	.empty button {
		margin: 0.25rem;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid #d8cfc0;
		background: #fff;
		cursor: pointer;
	}
	.filters {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.filters input {
		flex: 1;
		padding: 0.5rem 0.7rem;
		border: 1px solid #d8cfc0;
		border-radius: 8px;
		font-size: 0.95rem;
	}
	.filters select,
	.filters button {
		padding: 0.5rem 0.7rem;
		border: 1px solid #d8cfc0;
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.results li {
		border: 1px solid #e2dcd0;
		border-radius: 10px;
		padding: 0.7rem 0.9rem;
		margin-bottom: 0.5rem;
		background: #fff;
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.info {
		display: flex;
		flex-direction: column;
	}
	.title {
		font-weight: 600;
	}
	.sub {
		font-size: 0.8rem;
		color: #9a8f80;
	}
	.actions {
		display: flex;
		gap: 0.4rem;
	}
	.actions button {
		padding: 0.35rem 0.7rem;
		border: 1px solid #d8cfc0;
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
		white-space: nowrap;
	}
	.actions button.added {
		background: #e8f3ec;
		border-color: #2e8b57;
		color: #2e8b57;
	}
	.ghost {
		color: #8a7f70;
	}
</style>
