<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		hover?: boolean;
		glow?: boolean;
		padding?: 'sm' | 'md' | 'lg' | 'none';
	}

	let { class: cls = '', children, hover = false, glow = false, padding = 'md' }: Props = $props();

	const padClass = $derived({
		none: '',
		sm: 'p-3',
		md: 'p-4 sm:p-5',
		lg: 'p-5 sm:p-7'
	}[padding]);
</script>

<div
	class={cn(
		'glass rounded-2xl transition-all duration-200',
		padClass,
		hover && 'glass-hover cursor-pointer hover:-translate-y-0.5',
		glow && 'glow-accent',
		cls
	)}
>
	{@render children()}
</div>
