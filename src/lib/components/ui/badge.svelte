<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { AlertSeverity } from '$lib/types.js';

	interface Props {
		severity: AlertSeverity;
		class?: string;
		children?: import('svelte').Snippet;
		label?: string;
	}

	let { severity, class: cls = '', children, label }: Props = $props();

	const styles: Record<AlertSeverity, string> = {
		info: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
		warning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
		danger: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
		critical: 'bg-red-500/15 text-red-300 border-red-500/25'
	};

	const icons: Record<AlertSeverity, string> = {
		info: '🔵',
		warning: '⚠️',
		danger: '🟠',
		critical: '🔴'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
		styles[severity],
		cls
	)}
>
	<span aria-hidden="true">{icons[severity]}</span>
	{#if children}
		{@render children()}
	{:else if label}
		{label}
	{/if}
</span>
