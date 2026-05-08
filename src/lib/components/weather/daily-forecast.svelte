<script lang="ts">
	import type { DailyForecast } from '$lib/types.js';
	import { slide } from 'svelte/transition';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		daily: DailyForecast[];
	}

	let { daily }: Props = $props();

	const days = $derived(daily.slice(0, 7));
	let expandedDate = $state<string | null>(null);

	// Global min/max so each row's range bar reads on the same scale
	const range = $derived.by(() => {
		const mins = days.map((d) => d.minTemp);
		const maxs = days.map((d) => d.maxTemp);
		return { lo: Math.min(...mins), hi: Math.max(...maxs) };
	});

	const toggle = (dateStr: string) => {
		expandedDate = expandedDate === dateStr ? null : dateStr;
	};
</script>

<GlassCard padding="none">
	<div class="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-6">
		<h2 class="font-display text-2xl text-ink">Tujuh hari</h2>
		<span class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">7d</span>
	</div>

	<ul class="px-2 pt-2 pb-3 sm:px-3 sm:pb-4">
		{#each days as day, i (day.dateStr)}
			{@const isToday = day.dateStr === new Date().toISOString().slice(0, 10)}
			{@const isExpanded = expandedDate === day.dateStr}
			{@const span = Math.max(1, range.hi - range.lo)}
			{@const left = ((day.minTemp - range.lo) / span) * 100}
			{@const width = ((day.maxTemp - day.minTemp) / span) * 100}

			<li class="border-b border-[var(--glass-line-soft)] last:border-b-0">
				<button
					class="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl px-3 py-3.5 text-left transition-colors hover:bg-[var(--glass)] sm:px-4"
					onclick={() => toggle(day.dateStr)}
					aria-expanded={isExpanded}
				>
					<WeatherIcon
						category={day.category}
						date={new Date(`${day.dateStr}T12:00:00`)}
						size={36}
					/>

					<div class="min-w-0">
						<p
							class="font-display text-lg leading-tight {isToday ? 'text-accent' : 'text-ink'}"
						>
							{isToday ? 'Hari ini' : day.label}
						</p>
						<p class="truncate text-xs text-ink-mute">{day.dominantWeather}</p>
					</div>

					<div class="flex items-center gap-3 font-mono text-sm">
						<span class="w-8 text-right text-ink-mute">{day.minTemp}°</span>
						<div
							class="relative h-1 w-20 overflow-hidden rounded-full bg-[var(--glass-line-soft)] sm:w-28"
						>
							<div
								class="absolute top-0 h-full rounded-full"
								style="left: {left}%; width: {width}%;
								background: linear-gradient(90deg, oklch(0.7 0.15 230), var(--accent));"
							></div>
						</div>
						<span class="w-8 text-ink">{day.maxTemp}°</span>
					</div>
				</button>

				{#if isExpanded}
					<div transition:slide={{ duration: 220 }} class="px-3 pb-3 sm:px-4">
						<div class="no-scrollbar flex gap-1.5 overflow-x-auto pt-1">
							{#each day.hourly as h (h.timeStr)}
								<div
									class="flex min-w-[58px] flex-col items-center gap-1 rounded-xl bg-[var(--glass)] px-2 py-2"
								>
									<span class="font-mono text-[10px] text-ink-mute">{h.timeStr}</span>
									<WeatherIcon category={h.category} date={h.datetime} size={24} />
									<span class="font-display text-sm text-ink leading-none">
										{h.temperature}°
									</span>
								</div>
							{/each}
						</div>
						<p class="mt-3 text-xs text-ink-mute">
							Rata-rata kelembapan
							<span class="font-mono text-ink-soft">{day.avgHumidity}%</span>
						</p>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</GlassCard>
