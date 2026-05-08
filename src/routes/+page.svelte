<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { regionsStore } from '$lib/stores/regions.svelte.js';
	import { getSkyKey } from '$lib/sky.js';

	import CurrentWeather from '$lib/components/weather/current-weather.svelte';
	import HourlyForecast from '$lib/components/weather/hourly-forecast.svelte';
	import DailyForecast from '$lib/components/weather/daily-forecast.svelte';
	import WeatherDetails from '$lib/components/weather/weather-details.svelte';
	import WeatherAlerts from '$lib/components/weather/weather-alerts.svelte';
	import LocationDrawer from '$lib/components/location/location-drawer.svelte';
	import Skeleton from '$lib/components/ui/skeleton.svelte';
	import Footer from '$lib/components/layout/footer.svelte';

	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	let drawerOpen = $state(false);
	let isNavigating = $state(false);

	onMount(() => regionsStore.load());

	const locationLabel = $derived(() => {
		const recent = regionsStore.recentLocations.find((r) => r.code === data.selectedCode);
		if (recent) return recent.name;
		return 'Pilih Lokasi';
	});

	const locationSubLabel = $derived(() => {
		const recent = regionsStore.recentLocations.find((r) => r.code === data.selectedCode);
		if (recent) return recent.subName;
		return data.selectedCode;
	});

	const currentWeather = $derived(data.hourlyData[0] ?? null);
	const hasData = $derived(data.hourlyData.length > 0);

	// Drive the cinematic background: set data-sky on <html> from current conditions.
	$effect(() => {
		if (typeof document === 'undefined') return;
		const w = currentWeather;
		const key = w ? getSkyKey(w.category, w.datetime) : 'day-clear';
		document.documentElement.dataset.sky = key;
	});

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
	<title>Meteoid — {locationLabel()}</title>
	<meta
		name="description"
		content="Prakiraan cuaca akurat untuk {locationLabel()} dari BMKG Indonesia. Pantau kondisi cuaca terkini, suhu, dan peringatan cuaca."
	/>
</svelte:head>

<!-- ── Top bar: minimal, floats over the cinematic background ────────────── -->
<header class="relative z-30">
	<div class="mx-auto flex max-w-6xl items-center gap-3 px-5 pt-5 sm:px-8 sm:pt-7">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a
			href="/"
			class="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
			aria-label="Meteoid home"
		>
			<img src="/logo.svg" alt="Meteoid" class="h-5 w-5" />
			<span class="font-display text-xl tracking-tight text-ink">Meteoid</span>
		</a>

		<div class="ml-auto flex items-center gap-2">
			<button
				onclick={() => (drawerOpen = true)}
				class="glass-soft flex items-center gap-2 rounded-full px-3.5 py-2 text-xs text-ink-soft transition-all hover:bg-[var(--glass)] hover:text-ink sm:text-sm"
				aria-label="Pilih lokasi: {locationLabel()}"
			>
				<svg
					class="h-3.5 w-3.5 text-accent"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 21s-7-7.58-7-12a7 7 0 1114 0c0 4.42-7 12-7 12z"
					/>
					<circle cx="12" cy="9" r="2.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
				<span class="max-w-[10rem] truncate sm:max-w-[18rem]">{locationLabel()}</span>
				<svg class="h-3 w-3 text-ink-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			<button
				onclick={refresh}
				class="glass-soft flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-all hover:bg-[var(--glass)] hover:text-ink"
				title="Segarkan"
				aria-label="Segarkan data cuaca"
			>
				<svg
					class="h-4 w-4 {isNavigating ? 'animate-spin' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			</button>
		</div>
	</div>
</header>

<!-- ── Main ─────────────────────────────────────────────────────────────── -->
<main class="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8">
	{#if data.weatherError}
		<div class="mt-20 flex flex-col items-center text-center">
			<p class="font-display text-7xl leading-none text-ink/40">—</p>
			<h2 class="font-display mt-6 text-3xl text-ink">Tidak ada langit untuk dilihat.</h2>
			<p class="mt-2 max-w-sm text-sm text-ink-mute">{data.weatherError}</p>
			<button
				onclick={refresh}
				class="glass mt-6 rounded-full px-5 py-2.5 text-sm font-medium text-ink transition-all hover:bg-[var(--glass-strong)]"
			>
				Coba lagi
			</button>
		</div>
	{:else if isNavigating || !hasData}
		<div class="mt-20 flex flex-col gap-10">
			<div>
				<Skeleton height="h-3" width="w-40" class="mb-4" />
				<Skeleton height="h-12" width="w-72" class="mb-3" />
				<Skeleton height="h-[10rem]" width="w-72" />
			</div>
			<Skeleton height="h-32" />
			<div class="grid gap-4 md:grid-cols-2">
				<Skeleton height="h-64" />
				<Skeleton height="h-64" />
			</div>
		</div>
	{:else}
		<CurrentWeather
			current={currentWeather}
			locationName={locationLabel()}
			locationSubName={locationSubLabel()}
		/>

		<div class="mt-2 flex flex-col gap-6">
			{#if data.alerts.length > 0}
				<WeatherAlerts alerts={data.alerts} />
			{/if}

			{#if data.hourlyData.length > 1}
				<HourlyForecast hourly={data.hourlyData} />
			{/if}

			<div class="grid grid-cols-1 gap-6 md:grid-cols-5">
				{#if data.dailyData.length > 0}
					<div class="md:col-span-3">
						<DailyForecast daily={data.dailyData} />
					</div>
				{/if}
				{#if data.hourlyData.length > 0}
					<div class="md:col-span-2">
						<WeatherDetails hourly={data.hourlyData} />
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>

<Footer />

<LocationDrawer
	currentCode={data.selectedCode}
	onSelect={handleLocationSelect}
	open={drawerOpen}
	onClose={() => (drawerOpen = false)}
/>
