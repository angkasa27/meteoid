<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		hourly: ProcessedWeatherData[];
	}

	let { hourly }: Props = $props();

	// Show max 48 hours
	const items = $derived(hourly.slice(0, 16));

	const now = new Date();
	const isCurrentHour = (item: ProcessedWeatherData) => {
		return (
			item.datetime.getFullYear() === now.getFullYear() &&
			item.datetime.getMonth() === now.getMonth() &&
			item.datetime.getDate() === now.getDate() &&
			item.datetime.getHours() === now.getHours()
		);
	};
</script>

<GlassCard padding="none">
	<div class="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
		<h2 class="text-sm font-semibold text-text-secondary">Prakiraan Per-Jam</h2>
	</div>

	<div class="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-4 sm:px-5 sm:pb-5">
		{#each items as item (item.datetime.toISOString())}
			{@const isCurrent = isCurrentHour(item)}
			<div
				class="flex min-w-[68px] flex-col items-center gap-2 rounded-xl px-2.5 py-3 transition-all duration-150
					{isCurrent
					? 'border border-accent/40 bg-accent/10 ring-1 ring-accent/20'
					: 'border border-white/5 bg-white/3 hover:bg-white/6'}"
			>
				<span class="text-xs font-medium {isCurrent ? 'text-accent' : 'text-text-muted'}">
					{isCurrent ? 'Kini' : item.timeStr}
				</span>
				<WeatherIcon category={item.category} size={24} />
				<span class="text-sm font-semibold text-text-primary">{item.temperature}°</span>
				<span class="text-xs text-text-muted">{item.humidity}%</span>
			</div>
		{/each}
	</div>
</GlassCard>
