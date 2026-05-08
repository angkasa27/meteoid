<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import { getWindDirectionFull } from '$lib/weather.js';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import { base } from '$app/paths';

	interface Props {
		hourly: ProcessedWeatherData[];
	}

	let { hourly }: Props = $props();

	const latest = $derived(hourly[0]);
	const next24 = $derived(hourly.slice(0, 8));

	const avgHumidity = $derived(
		next24.length ? Math.round(next24.reduce((s, h) => s + h.humidity, 0) / next24.length) : 0
	);
	const maxWind = $derived(next24.reduce((max, h) => Math.max(max, h.windSpeedKmh), 0));
	const avgTemp = $derived(
		next24.length ? Math.round(next24.reduce((s, h) => s + h.temperature, 0) / next24.length) : 0
	);

	// Build smooth area chart for next 24h
	const chart = $derived.by(() => {
		if (!next24.length) return { line: '', area: '', dots: [] as { x: number; y: number; t: number }[] };
		const W = 280;
		const H = 80;
		const PAD = 8;
		const temps = next24.map((h) => h.temperature);
		const min = Math.min(...temps) - 1;
		const max = Math.max(...temps) + 1;
		const range = Math.max(1, max - min);
		const pts = temps.map((t, i) => {
			const x = PAD + (i / (temps.length - 1)) * (W - PAD * 2);
			const y = PAD + (1 - (t - min) / range) * (H - PAD * 2);
			return { x, y, t };
		});
		const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
		const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
		return { line, area, dots: pts };
	});
</script>

<GlassCard padding="md">
	<div class="flex items-center justify-between">
		<h2 class="font-display text-2xl text-ink">Detail</h2>
		<span class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">24 jam</span>
	</div>

	{#if latest}
		<!-- Temperature curve -->
		<div class="mt-4 rounded-2xl bg-[var(--glass)] p-4">
			<div class="mb-2 flex items-baseline justify-between">
				<span class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
					Kurva suhu
				</span>
				<span class="font-display text-xl text-ink">
					{avgTemp}<span class="text-xs text-ink-mute">° rata-rata</span>
				</span>
			</div>
			<svg viewBox="0 0 280 80" class="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
				<defs>
					<linearGradient id="tcurve" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.45" />
						<stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
					</linearGradient>
				</defs>
				<path d={chart.area} fill="url(#tcurve)" />
				<path
					d={chart.line}
					fill="none"
					stroke="var(--accent)"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
				{#each chart.dots as d, i (i)}
					{#if i === 0 || i === chart.dots.length - 1}
						<circle cx={d.x} cy={d.y} r="2.2" fill="var(--accent)" />
					{/if}
				{/each}
			</svg>
		</div>

		<!-- Two-column metric stack -->
		<dl class="mt-4 grid grid-cols-2 gap-3">
			<div class="rounded-2xl bg-[var(--glass)] p-3.5">
				<div class="flex items-center gap-2">
					<img src="{base}/icons/weather/humidity.svg" alt="" class="h-5 w-5" />
					<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
						Kelembapan
					</dt>
				</div>
				<dd class="mt-2 font-display text-3xl text-ink leading-none">
					{latest.humidity}<span class="text-sm text-ink-mute">%</span>
				</dd>
				<div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--glass-line-soft)]">
					<div class="h-full rounded-full bg-accent/70" style="width: {latest.humidity}%"></div>
				</div>
			</div>

			<div class="rounded-2xl bg-[var(--glass)] p-3.5">
				<div class="flex items-center gap-2">
					<img src="{base}/icons/weather/wind.svg" alt="" class="h-5 w-5" />
					<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
						Angin
					</dt>
				</div>
				<dd class="mt-2 font-display text-3xl text-ink leading-none">
					{latest.windSpeedKmh}<span class="text-sm text-ink-mute"> km/j</span>
				</dd>
				<p class="mt-2 text-xs text-ink-mute">
					{getWindDirectionFull(latest.windDegrees)}
				</p>
			</div>

			<div class="rounded-2xl bg-[var(--glass)] p-3.5">
				<div class="flex items-center gap-2">
					<img src="{base}/icons/weather/compass.svg" alt="" class="h-5 w-5" />
					<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
						Arah
					</dt>
				</div>
				<dd class="mt-2 flex items-center gap-2 font-display text-2xl text-ink leading-none">
					<svg viewBox="0 0 24 24" class="h-6 w-6 text-accent" style="transform: rotate({latest.windDegrees}deg);">
						<path d="M12 3 L15 14 L12 12 L9 14 Z" fill="currentColor" />
					</svg>
					{latest.windDegrees}°
				</dd>
				<p class="mt-2 text-xs text-ink-mute">{latest.windDirectionLabel}</p>
			</div>

			<div class="rounded-2xl bg-[var(--glass)] p-3.5">
				<div class="flex items-center gap-2">
					<img src="{base}/icons/weather/thermometer.svg" alt="" class="h-5 w-5" />
					<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
						Titik embun
					</dt>
				</div>
				<dd class="mt-2 font-display text-3xl text-ink leading-none">
					{Math.round(latest.temperature - (100 - latest.humidity) / 5)}<span class="text-sm text-ink-mute">°C</span>
				</dd>
				<p class="mt-2 text-xs text-ink-mute">Rasa kondensasi</p>
			</div>
		</dl>

		<div class="mt-4 flex items-center justify-between rounded-2xl bg-[var(--glass)] px-4 py-3 text-xs">
			<div>
				<p class="text-ink-mute">Rata-rata kelembapan</p>
				<p class="font-mono text-ink-soft">{avgHumidity}%</p>
			</div>
			<div class="h-6 w-px bg-[var(--glass-line)]"></div>
			<div class="text-right">
				<p class="text-ink-mute">Angin maks</p>
				<p class="font-mono text-ink-soft">{maxWind} km/j</p>
			</div>
		</div>
	{:else}
		<p class="mt-4 text-sm text-ink-mute">Data tidak tersedia.</p>
	{/if}
</GlassCard>
