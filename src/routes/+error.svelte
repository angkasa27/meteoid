<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>Error {page.status} — Meteoid</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center px-4">
	<div class="max-w-sm text-center">
		<p class="mb-4 text-6xl" aria-hidden="true">
			{page.status === 404 ? '🌧️' : '⛈️'}
		</p>
		<h1 class="mb-2 text-2xl font-bold text-text-primary">
			{page.status === 404 ? 'Halaman tidak ditemukan' : 'Ups, terjadi kesalahan'}
		</h1>
		<p class="mb-6 text-sm text-text-muted">
			{page.error?.message ?? 'Terjadi kesalahan yang tidak diketahui.'}
		</p>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a
			href="{base}/"
			class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5
				   text-sm font-medium text-text-secondary transition-all hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
				/>
			</svg>
			Kembali ke beranda
		</a>
	</div>
</div>
