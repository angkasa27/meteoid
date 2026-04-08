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

	<!-- OpenGraph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Meteoid" />
	<meta property="og:title" content="Meteoid — Prakiraan Cuaca Indonesia" />
	<meta
		property="og:description"
		content="Pantau kondisi cuaca terkini dan prakiraan cuaca akurat untuk seluruh wilayah Indonesia."
	/>
	<meta property="og:image" content="/og-image.png" />
	<meta property="og:locale" content="id_ID" />

	<!-- PWA & Mobile -->
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<meta name="apple-mobile-web-app-title" content="Meteoid" />
	<meta name="application-name" content="Meteoid" />
	<meta name="msapplication-TileColor" content="#2563eb" />
	<meta name="msapplication-config" content="/browserconfig.xml" />
</svelte:head>

<!-- Gradient background -->
<div
	class="relative min-h-dvh overflow-x-hidden bg-bg-base"
	style="background: radial-gradient(ellipse at 20% 0%, oklch(0.18 0.06 260) 0%, transparent 60%),
		   radial-gradient(ellipse at 80% 100%, oklch(0.16 0.05 230) 0%, transparent 60%),
		   var(--bg-base);"
>
	{@render children()}
</div>
