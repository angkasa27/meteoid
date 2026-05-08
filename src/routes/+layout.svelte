<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<meta name="robots" content="index, follow" />
	<meta
		name="description"
		content="Pantau kondisi cuaca terkini dan prakiraan cuaca akurat untuk seluruh wilayah Indonesia. Data resmi dari Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)."
	/>
	<meta
		name="keywords"
		content="cuaca, prakiraan cuaca, BMKG, Indonesia, suhu, hujan, angin, kelembapan"
	/>
	<meta name="author" content="Ferdy Indra & Dimas Angkasa" />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Meteoid" />
	<meta property="og:title" content="Meteoid — Prakiraan Cuaca Indonesia" />
	<meta
		property="og:description"
		content="Pantau kondisi cuaca terkini dan prakiraan cuaca akurat untuk seluruh wilayah Indonesia."
	/>
	<meta property="og:image" content="/og-image.png" />
	<meta property="og:locale" content="id_ID" />

	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="Meteoid" />
	<meta name="application-name" content="Meteoid" />
	<meta name="msapplication-TileColor" content="#0b0d14" />
	<meta name="msapplication-config" content="/browserconfig.xml" />
</svelte:head>

<!-- Cinematic full-bleed atmospheric background.
     [data-sky] is set on <html> by the page based on current conditions. -->
<div class="sky-bg pointer-events-none fixed inset-0 -z-20"></div>
<div class="sky-grain pointer-events-none fixed inset-0 -z-10"></div>

<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
	<div
		class="animate-drift absolute -top-1/4 -left-1/4 h-[60vmin] w-[60vmin] rounded-full opacity-40 blur-3xl"
		style="background: radial-gradient(circle, var(--sky-1), transparent 65%);"
	></div>
	<div
		class="animate-drift absolute -right-1/4 -bottom-1/4 h-[70vmin] w-[70vmin] rounded-full opacity-30 blur-3xl"
		style="background: radial-gradient(circle, var(--accent), transparent 65%); animation-delay: -6s;"
	></div>
</div>

<div class="relative min-h-dvh">
	{@render children()}
</div>
