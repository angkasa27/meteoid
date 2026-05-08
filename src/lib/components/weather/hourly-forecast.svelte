<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import GlassCard from '$lib/components/ui/glass-card.svelte';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		hourly: ProcessedWeatherData[];
	}

	let { hourly }: Props = $props();

	const items = $derived(hourly.slice(0, 24));

	const now = new Date();
	const isCurrentHour = (item: ProcessedWeatherData) =>
		item.datetime.getFullYear() === now.getFullYear() &&
		item.datetime.getMonth() === now.getMonth() &&
		item.datetime.getDate() === now.getDate() &&
		item.datetime.getHours() === now.getHours();

	// Temperature curve (sparkline) overlaid behind the chips
	const minMax = $derived.by(() => {
		const t = items.map((i) => i.temperature);
		return { min: Math.min(...t), max: Math.max(...t) };
	});
</script>

<GlassCard padding="none" variant="default">
	<div class="flex items-center justify-between px-5 pt-5 sm:px-7 sm:pt-6">
		<h2 class="font-display text-2xl text-ink">Per jam</h2>
		<span class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">
			24 jam ke depan
		</span>
	</div>

	<div class="relative">
		<div
			class="no-scrollbar relative flex gap-1 overflow-x-auto px-5 pt-5 pb-6 sm:px-7 sm:pt-6 sm:pb-7"
		>
			{#each items as item, i (item.datetime.toISOString())}
				{@const isCurrent = isCurrentHour(item)}
				{@const range = Math.max(1, minMax.max - minMax.min)}
				{@const norm = (item.temperature - minMax.min) / range}
				<div
					class="relative flex min-w-[68px] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3 transition-all duration-200 sm:min-w-[76px]
						{isCurrent
						? 'bg-[var(--glass-strong)] ring-1 ring-[var(--accent)]/40'
						: 'hover:bg-[var(--glass)]'}"
				>
					<span
						class="font-mono text-[10px] tracking-wider {isCurrent
							? 'text-accent'
							: 'text-ink-mute'}"
					>
						{isCurrent ? 'KINI' : item.timeStr}
					</span>
					<WeatherIcon
						category={item.category}
						date={item.datetime}
						size={36}
						alt={item.label}
					/>
					<span class="font-display text-xl text-ink leading-none">
						{item.temperature}<span class="text-xs text-ink-mute">°</span>
					</span>
					<!-- Mini bar showing relative warmth in this window -->
					<div
						class="mt-0.5 h-0.5 w-7 rounded-full"
						style="background: linear-gradient(to right, var(--accent) {norm * 100}%, var(--glass-line) {norm * 100}%);"
					></div>
				</div>
			{/each}
		</div>
	</div>
</GlassCard>
