<script>
	let { children } = $props();
</script>

<svelte:head>
	<title>Gregorian Chant SRS Trainer</title>
</svelte:head>

<div class="app">
	<header>
		<h1>♮ Gregorian Chant Trainer</h1>
		<p class="tagline">Spaced-repetition practice for chant repertoire</p>
	</header>
	{@render children()}
	<footer>
		Phase 0 MVP · Chant data from
		<a href="https://gregobase.selapa.net" target="_blank" rel="noreferrer">GregoBase</a> (CC0)
		· Notation by Exsurge.js
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
		background: #f6f4ef;
		color: #2a2a2a;
	}
	.app {
		max-width: 880px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 3rem;
	}
	header h1 {
		margin: 0;
		font-size: 1.6rem;
		color: #6b2d10;
	}
	.tagline {
		margin: 0.15rem 0 1.25rem;
		color: #8a7f70;
		font-size: 0.95rem;
	}
	footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid #e2dcd0;
		font-size: 0.8rem;
		color: #9a8f80;
	}
	footer a {
		color: #6b2d10;
	}
</style>
