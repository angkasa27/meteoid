<script lang="ts">
	import type { ProcessedWeatherData } from '$lib/types.js';
	import { formatDateId, formatTimeShort, getWindDirectionFull } from '$lib/weather.js';
	import WeatherIcon from './weather-icon.svelte';

	interface Props {
		current: ProcessedWeatherData;
		locationName: string;
		locationSubName?: string;
	}

	let { current, locationName, locationSubName }: Props = $props();

	const dateLine = $derived(formatDateId(current.datetime));
	const timeLine = $derived(formatTimeShort(current.datetime));
	const windDir = $derived(getWindDirectionFull(current.windDegrees));
	const feelsDiff = $derived(current.heatIndex - current.temperature);
	const feelsLabel = $derived(
		feelsDiff > 2 ? 'terasa lebih panas' : feelsDiff < -2 ? 'terasa lebih sejuk' : 'terasa sesuai'
	);
</script>

<section
	class="relative min-h-[78vh] pt-6 pb-10 sm:min-h-[82vh] sm:pt-8"
	aria-labelledby="hero-temp"
>
	<!-- Eyebrow line: place + time -->
	<div class="stagger flex flex-col">
		<div class="flex items-center gap-3 text-xs tracking-[0.2em] text-ink-mute uppercase">
			<span class="font-mono">{timeLine}</span>
			<span class="h-px w-6 bg-ink-faint"></span>
			<span class="font-mono">{dateLine}</span>
			<span class="h-px w-6 bg-ink-faint"></span>
			<span class="font-mono">BMKG</span>
		</div>

		<!-- Location, big serif italic -->
		<h1 class="font-display mt-3 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
			<span class="text-balance text-ink">{locationName}</span>
			{#if locationSubName}
				<span class="mt-1 block font-sans text-base tracking-tight text-ink-mute not-italic">
					{locationSubName}
				</span>
			{/if}
		</h1>

		<!-- Hero composition: temp on left, condition + icon on right -->
		<div class="mt-8 grid grid-cols-1 items-end gap-6 md:mt-12 md:grid-cols-[1fr_auto] md:gap-12">
			<!-- Temperature -->
			<div class="flex items-start gap-1">
				<span
					id="hero-temp"
					class="font-display text-[28vw] leading-[0.82] tracking-[-0.04em] text-ink sm:text-[20vw] md:text-[14rem] lg:text-[18rem]"
				>
					{current.temperature}
				</span>
				<span
					class="font-display mt-3 text-4xl leading-none text-ink-soft sm:mt-4 sm:text-5xl md:mt-6 md:text-6xl"
				>
					°
				</span>
			</div>

			<!-- Condition + icon -->
			<div class="flex items-center gap-4 md:flex-col md:items-end md:text-right">
				<div class="animate-pulse-soft shrink-0">
					<WeatherIcon
						category={current.category}
						date={current.datetime}
						size={120}
						alt={current.label}
					/>
				</div>
				<div class="md:text-right">
					<p class="font-display text-2xl leading-tight text-ink sm:text-3xl">
						{current.label}
					</p>
					<p class="mt-1 text-sm text-ink-mute">
						Terasa <span class="font-mono text-ink-soft">{current.heatIndex}°</span> · {feelsLabel}
					</p>
				</div>
			</div>
		</div>

		<!-- Hairline + at-a-glance row -->
		<div class="divider mt-10"></div>
		<dl class="mt-5 grid grid-cols-3 gap-4 sm:grid-cols-3 md:max-w-2xl md:gap-10">
			<div>
				<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">Kelembapan</dt>
				<dd class="font-display mt-2 text-3xl text-ink sm:text-4xl">
					{current.humidity}<span class="text-base text-ink-mute">%</span>
				</dd>
			</div>
			<div>
				<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">Angin</dt>
				<dd class="font-display mt-2 text-3xl text-ink sm:text-4xl">
					{current.windSpeedKmh}<span class="text-base text-ink-mute">&nbsp;km/j</span>
				</dd>
				<p class="mt-0.5 text-xs text-ink-mute">{windDir}</p>
			</div>
			<div>
				<dt class="font-mono text-[10px] tracking-[0.18em] text-ink-mute uppercase">Knots</dt>
				<dd class="font-display mt-2 text-3xl text-ink sm:text-4xl">
					{current.windSpeedKnots}<span class="text-base text-ink-mute">&nbsp;kn</span>
				</dd>
			</div>
		</dl>
	</div>
</section>
