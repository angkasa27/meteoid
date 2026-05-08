<script lang="ts">
	import type { WeatherCategory } from '$lib/types.js';
	import { iconUrl } from '$lib/sky.js';
	import { base } from '$app/paths';

	interface Props {
		category: WeatherCategory;
		date?: Date;
		size?: number;
		alt?: string;
		class?: string;
	}

	let {
		category,
		date = new Date(),
		size = 48,
		alt = category,
		class: cls = ''
	}: Props = $props();

	const src = $derived(iconUrl(category, date, base));
</script>

<img
	{src}
	{alt}
	width={size}
	height={size}
	loading="lazy"
	decoding="async"
	class={cls}
	style="width: {size}px; height: {size}px; display: inline-block;"
/>
