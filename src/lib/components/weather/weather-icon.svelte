<script lang="ts">
	import type { WeatherCategory } from '$lib/types.js';

	interface Props {
		category: WeatherCategory;
		size?: number;
		class?: string;
	}

	let { category, size = 40, class: cls = '' }: Props = $props();

	// Pure SVG icons for each weather category — no external deps
	const icons: Record<WeatherCategory, { emoji: string; color: string }> = {
		clear: { emoji: '☀️', color: '#fbbf24' },
		'partly-cloudy': { emoji: '⛅', color: '#93c5fd' },
		cloudy: { emoji: '☁️', color: '#94a3b8' },
		rain: { emoji: '🌧️', color: '#60a5fa' },
		storm: { emoji: '⛈️', color: '#a78bfa' },
		fog: { emoji: '🌫️', color: '#cbd5e1' }
	};

	const icon = $derived(icons[category] ?? icons['partly-cloudy']);
</script>

<span
	class={cls}
	style="font-size: {size}px; line-height: 1; display: inline-block;"
	role="img"
	aria-label={category}
>
	{icon.emoji}
</span>
