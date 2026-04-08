<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { regionsStore } from '$lib/stores/regions.svelte.js';

	import CurrentWeather from '$lib/components/weather/current-weather.svelte';
	import HourlyForecast from '$lib/components/weather/hourly-forecast.svelte';
	import DailyForecast from '$lib/components/weather/daily-forecast.svelte';
	import WeatherDetails from '$lib/components/weather/weather-details.svelte';
	import WeatherAlerts from '$lib/components/weather/weather-alerts.svelte';
	import LocationDrawer from '$lib/components/location/location-drawer.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let drawerOpen = $state(false);
	let isNavigating = $state(false);

	// Hydrate recent store from localStorage on mount
	onMount(() => regionsStore.load());

	// Derive location display name from recent store or fall back to a readable label
	const locationLabel = $derived(() => {
		const recent = regionsStore.recentLocations.find((r) => r.code === data.selectedCode);
		if (recent) return recent.name;
		// If no recent, show a clean placeholder — user hasn't named this location yet
		return 'Pilih Lokasi';
	});

	const locationSubLabel = $derived(() => {
		const recent = regionsStore.recentLocations.find((r) => r.code === data.selectedCode);
		if (recent) return recent.subName;
		// Show the raw code as the sub-label so it's still accessible
		return data.selectedCode;
	});

	const currentWeather = $derived(data.hourlyData[0] ?? null);
	const hasData = $derived(data.hourlyData.length > 0);

	const handleLocationSelect = async (code: string) => {
		isNavigating = true;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`?adm4=${code}`, { invalidateAll: true });
		isNavigating = false;
	};

	// eslint-disable-next-line svelte/no-navigation-without-resolve
	const refresh = () => goto(`?adm4=${data.selectedCode}`, { invalidateAll: true });
</script>

<svelte:head>
	<title>Meteoid — Prakiraan Cuaca {locationLabel()} | Indonesia</title>
	<meta
		name="description"
		content="Prakiraan cuaca akurat untuk {locationLabel()} dari BMKG Indonesia. Pantau kondisi cuaca terkini, suhu, and peringatan cuaca."
	/>
</svelte:head>

<!-- ── Header ──────────────────────────────────────────────────────────────── -->
<header class="sticky top-0 z-30 border-b border-white/5 bg-bg-base/80 backdrop-blur-xl">
	<div class="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:px-6">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href="/" class="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
			<img src="/logo.svg" alt="Meteoid Logo" class="h-6 w-6" />
			<span class="hidden text-base font-bold tracking-tight text-text-primary sm:block"
				>Meteoid</span
			>
		</a>

		<!-- Location display (clickable to open drawer) -->
		<button
			onclick={() => (drawerOpen = true)}
			class="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2
				   text-left transition-all hover:border-accent/30 hover:bg-accent/6 focus-visible:outline-accent"
			aria-label="Pilih lokasi: {locationLabel()}"
		>
			<svg
				class="h-3.5 w-3.5 shrink-0 text-accent"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			<div class="min-w-0 flex-1">
				<div class="truncate text-sm leading-tight font-medium text-text-primary">
					{locationLabel()}
				</div>
				{#if locationSubLabel()}
					<div class="truncate text-xs leading-tight text-text-muted">{locationSubLabel()}</div>
				{/if}
			</div>
			<svg
				class="h-3.5 w-3.5 shrink-0 text-text-muted"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Refresh -->
		<button
			onclick={refresh}
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5
				   text-text-muted transition-all hover:bg-white/8 hover:text-text-primary focus-visible:outline-accent"
			title="Segarkan"
			aria-label="Segarkan data cuaca"
		>
			<svg
				class="h-4 w-4 {isNavigating ? 'animate-spin' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
		</button>
	</div>
</header>

<!-- ── Main content ─────────────────────────────────────────────────────────── -->
<main class="mx-auto max-w-4xl px-4 py-5 sm:px-6">
	{#if data.weatherError}
		<GlassCard class="py-12 text-center">
			<p class="mb-3 text-4xl" aria-hidden="true">⚠️</p>
			<h2 class="mb-2 text-lg font-semibold text-text-primary">Gagal Memuat Data</h2>
			<p class="mb-5 text-sm text-text-muted">{data.weatherError}</p>
			<button
				onclick={refresh}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-text-secondary
					   transition-all hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
			>
				Coba Lagi
			</button>
		</GlassCard>
	{:else if isNavigating || !hasData}
		<div class="animate-fade-up flex flex-col gap-4">
			<div class="glass rounded-2xl p-5">
				<Skeleton height="h-5" width="w-32" class="mb-4" />
				<Skeleton height="h-20" width="w-48" class="mb-2" />
				<Skeleton height="h-4" width="w-40" class="mb-5" />
				<div class="grid grid-cols-3 gap-3">
					<Skeleton height="h-10" />
					<Skeleton height="h-10" />
					<Skeleton height="h-10" />
				</div>
			</div>
			<div class="glass rounded-2xl p-4">
				<Skeleton height="h-4" width="w-36" class="mb-3" />
				<div class="flex gap-2 overflow-hidden">
					{#each Array(6) as _, i (i)}
						<Skeleton height="h-20" width="w-16" class="shrink-0" />
					{/each}
				</div>
			</div>
			<Skeleton height="h-64" />
		</div>
	{:else}
		<div class="animate-fade-up flex flex-col gap-4">
			{#if data.alerts.length > 0}
				<WeatherAlerts alerts={data.alerts} />
			{/if}

			{#if currentWeather}
				<CurrentWeather current={currentWeather} locationName={locationLabel()} />
			{/if}

			{#if data.hourlyData.length > 1}
				<HourlyForecast hourly={data.hourlyData} />
			{/if}

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#if data.dailyData.length > 0}
					<DailyForecast daily={data.dailyData} />
				{/if}
				{#if data.hourlyData.length > 0}
					<WeatherDetails hourly={data.hourlyData} />
				{/if}
			</div>
		</div>
	{/if}
</main>

<Footer />

<!-- Location drawer -->
<LocationDrawer
	currentCode={data.selectedCode}
	onSelect={handleLocationSelect}
	open={drawerOpen}
	onClose={() => (drawerOpen = false)}
/>
