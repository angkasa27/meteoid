<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import { getTempBg, formatDateId, getWindDirectionFull } from '$lib/weather.js';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		current: ProcessedWeatherData;
		locationName: string;
	}

	let { current, locationName }: Props = $props();

	const tempBg = $derived(getTempBg(current.temperature));
	const now = $derived(formatDateId(current.datetime));
	const windDir = $derived(getWindDirectionFull(current.windDegrees));

	const feelsDiff = $derived(current.heatIndex - current.temperature);
	const feelsLabel = $derived(
		feelsDiff > 2 ? 'terasa lebih panas' : feelsDiff < -2 ? 'terasa lebih sejuk' : 'terasa sesuai'
	);
</script>

<GlassCard class="relative overflow-hidden" padding="lg">
	<!-- Gradient blob background -->
	<div
		class="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br {tempBg} blur-3xl"
		aria-hidden="true"
	></div>

	<div class="relative z-10">
		<!-- Location + date -->
		<div class="mb-4 flex items-start justify-between gap-2">
			<div>
				<p class="text-sm font-medium text-text-secondary">📍 {locationName}</p>
				<p class="mt-0.5 text-xs text-text-muted">{now} · Data BMKG</p>
			</div>
			<div class="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Live</div>
		</div>

		<!-- Main temp + icon -->
		<div class="flex items-end justify-between gap-4">
			<div>
				<div class="flex items-start gap-1 leading-none">
					<span class="text-7xl font-light tracking-tighter text-text-primary sm:text-8xl">
						{current.temperature}
					</span>
					<span class="mt-3 text-3xl font-light text-text-secondary">°C</span>
				</div>
				<p class="mt-2 text-lg font-medium text-text-primary">{current.label}</p>
				<p class="mt-0.5 text-sm text-text-muted">
					Terasa seperti {current.heatIndex}°C · {feelsLabel}
				</p>
			</div>

			<div class="shrink-0 opacity-90">
				<WeatherIcon category={current.category} size={72} />
			</div>
		</div>

		<!-- Stats row -->
		<div class="mt-5 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
			<div class="text-center">
				<div class="text-lg font-semibold text-text-primary">{current.humidity}%</div>
				<div class="mt-0.5 text-xs text-text-muted">Kelembapan</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-semibold text-text-primary">{current.windSpeedKmh}</div>
				<div class="mt-0.5 text-xs text-text-muted">km/j · {current.windDirectionLabel}</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-semibold text-text-primary">{windDir}</div>
				<div class="mt-0.5 text-xs text-text-muted">Arah angin</div>
			</div>
		</div>
	</div>
</GlassCard>
