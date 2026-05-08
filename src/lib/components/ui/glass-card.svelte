<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children: Snippet;
		variant?: 'soft' | 'default' | 'strong';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hover?: boolean;
	}

	let {
		class: cls = '',
		children,
		variant = 'default',
		padding = 'md',
		hover = false
	}: Props = $props();

	const variantClass = $derived(
		{ soft: 'glass-soft', default: 'glass', strong: 'glass-strong' }[variant]
	);
	const padClass = $derived({ none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-5 sm:p-7' }[padding]);
</script>

<div
	class={cn(
		variantClass,
		padClass,
		'rounded-[var(--radius-card)] transition-all duration-300',
		hover && 'cursor-pointer hover:-translate-y-0.5 hover:bg-[var(--glass-strong)]',
		cls
	)}
>
	{@render children()}
</div>
