<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import { getWindDirectionFull } from '$lib/weather.js';
	import GlassCard from '$lib/components/ui/glass-card.svelte';

	interface Props {
		hourly: ProcessedWeatherData[];
	}

	let { hourly }: Props = $props();

	const latest = $derived(hourly[0]);
	const next24 = $derived(hourly.slice(0, 8));

	const avgHumidity = $derived(
		next24.length
			? Math.round(next24.reduce((s, h) => s + h.humidity, 0) / next24.length)
			: 0
	);
	const maxWind = $derived(next24.reduce((max, h) => Math.max(max, h.windSpeedKmh), 0));
	const avgTemp = $derived(
		next24.length
			? Math.round(next24.reduce((s, h) => s + h.temperature, 0) / next24.length)
			: 0
	);

	// SVG sparkline for temperature over next 24h
	const sparklinePoints = $derived(() => {
		if (!next24.length) return '';
		const temps = next24.map((h) => h.temperature);
		const min = Math.min(...temps);
		const max = Math.max(...temps);
		const range = max - min || 1;
		const W = 120;
		const H = 32;
		return temps
			.map((t, i) => {
				const x = (i / (temps.length - 1)) * W;
				const y = H - ((t - min) / range) * H;
				return `${x},${y}`;
			})
			.join(' ');
	});

	interface Metric {
		label: string;
		value: string;
		unit: string;
		icon: string;
		barPct?: number;
	}

	const metrics = $derived<Metric[]>(
		!latest
			? []
			: [
					{
						label: 'Angin',
						value: `${latest.windSpeedKmh}`,
						unit: 'km/j',
						icon: '💨',
						barPct: Math.min(100, (latest.windSpeedKmh / 60) * 100)
					},
					{
						label: 'Kelembapan',
						value: `${latest.humidity}`,
						unit: '%',
						icon: '💧',
						barPct: latest.humidity
					},
					{
						label: 'Arah Angin',
						value: getWindDirectionFull(latest.windDegrees),
						unit: `${latest.windDegrees}°`,
						icon: '🧭',
						barPct: (latest.windDegrees / 360) * 100
					},
					{
						label: 'Titik Embun',
						value: `${Math.round(latest.temperature - (100 - latest.humidity) / 5)}`,
						unit: '°C',
						icon: '🌡️',
						barPct: Math.min(100, Math.max(0, latest.humidity - 20))
					}
				]
	);
</script>

<GlassCard padding="md">
	<h2 class="mb-4 text-sm font-semibold text-text-secondary">Detail Cuaca</h2>

	{#if latest}
		<!-- Sparkline chart -->
		<div class="mb-4 rounded-xl bg-white/4 px-4 py-3">
			<div class="mb-1.5 flex items-center justify-between">
				<span class="text-xs text-text-muted">Suhu 24 jam ke depan</span>
				<span class="text-xs font-medium text-accent">⌀ {avgTemp}°C</span>
			</div>
			<svg viewBox="0 -4 120 40" class="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
				<defs>
					<linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0%" stop-color="#60a5fa" />
						<stop offset="100%" stop-color="#f97316" />
					</linearGradient>
				</defs>
				<polyline
					points={sparklinePoints()}
					fill="none"
					stroke="url(#sparkGrad)"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</div>

		<!-- Metrics grid -->
		<div class="grid grid-cols-2 gap-3">
			{#each metrics as metric}
				<div class="rounded-xl bg-white/4 p-3">
					<div class="mb-1.5 flex items-center gap-1.5">
						<span class="text-base">{metric.icon}</span>
						<span class="text-xs text-text-muted">{metric.label}</span>
					</div>
					<div class="flex items-baseline gap-1">
						<span class="text-xl font-semibold text-text-primary">{metric.value}</span>
						<span class="text-xs text-text-muted">{metric.unit}</span>
					</div>
					{#if metric.barPct !== undefined}
						<div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
							<div
								class="h-full rounded-full bg-accent/60 transition-all duration-500"
								style="width: {metric.barPct}%"
							></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Summary row -->
		<div class="mt-3 flex justify-around rounded-xl bg-white/4 py-2 text-center text-xs">
			<div>
				<div class="font-medium text-text-primary">{avgHumidity}%</div>
				<div class="text-text-muted">Rata-rata kelembapan</div>
			</div>
			<div class="w-px bg-white/10"></div>
			<div>
				<div class="font-medium text-text-primary">{maxWind} km/j</div>
				<div class="text-text-muted">Angin maks</div>
			</div>
		</div>
	{:else}
		<p class="text-sm text-text-muted">Data tidak tersedia.</p>
	{/if}
</GlassCard>
