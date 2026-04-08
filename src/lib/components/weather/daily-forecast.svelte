<script lang="ts">
	import type { DailyForecast } from '$lib/types.js';
	import { slide } from 'svelte/transition';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		daily: DailyForecast[];
	}

	let { daily }: Props = $props();

	// Show max 7 days
	const days = $derived(daily.slice(0, 7));

	let expandedDate = $state<string | null>(null);

	const toggle = (dateStr: string) => {
		expandedDate = expandedDate === dateStr ? null : dateStr;
	};
</script>

<GlassCard padding="none">
	<div class="px-4 pt-4 sm:px-5 sm:pt-5">
		<h2 class="text-sm font-semibold text-text-secondary">Prakiraan 7 Hari</h2>
	</div>

	<div class="mt-2 divide-y divide-white/5">
		{#each days as day (day.dateStr)}
			{@const isToday = day.dateStr === new Date().toISOString().slice(0, 10)}
			{@const isExpanded = expandedDate === day.dateStr}

			<button
				class="w-full px-4 py-3 text-left transition-colors hover:bg-white/4 sm:px-5"
				onclick={() => toggle(day.dateStr)}
				aria-expanded={isExpanded}
			>
				<div class="flex items-center gap-3">
					<WeatherIcon category={day.category} size={22} />

					<div class="min-w-0 flex-1">
						<span class="text-sm font-medium {isToday ? 'text-accent' : 'text-text-primary'}">
							{isToday ? 'Hari ini' : day.label}
						</span>
						<span class="ml-2 text-xs text-text-muted">{day.dominantWeather}</span>
					</div>

					<div class="flex shrink-0 items-center gap-3 text-sm">
						<span class="text-text-muted">{day.minTemp}°</span>
						<div class="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
							<div
								class="h-full rounded-full bg-gradient-to-r from-blue-400 to-orange-400"
								style="width: {Math.min(100, ((day.maxTemp - day.minTemp) / 20) * 100)}%"
							></div>
						</div>
						<span class="font-medium text-text-primary">{day.maxTemp}°</span>
						<svg
							class="h-4 w-4 text-text-muted transition-transform duration-200 {isExpanded
								? 'rotate-180'
								: ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>
			</button>

			{#if isExpanded}
				<div transition:slide={{ duration: 250 }} class="bg-white/2 px-4 pb-3 sm:px-5">
					<div class="no-scrollbar flex gap-2 overflow-x-auto pt-2">
						{#each day.hourly as h (h.timeStr)}
							<div
								class="flex min-w-[56px] flex-col items-center gap-1.5 rounded-lg bg-white/4 p-2"
							>
								<span class="text-xs text-text-muted">{h.timeStr}</span>
								<WeatherIcon category={h.category} size={18} />
								<span class="text-xs font-semibold text-text-primary">{h.temperature}°</span>
							</div>
						{/each}
					</div>
					<div class="mt-2 grid grid-cols-3 gap-2 text-xs text-text-muted">
						<span>💧 {day.avgHumidity}% kelembapan</span>
					</div>
				</div>
			{/if}
		{/each}
	</div>
</GlassCard>
