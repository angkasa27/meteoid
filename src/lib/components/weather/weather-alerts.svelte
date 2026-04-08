<script lang="ts">
	import type { WeatherAlert } from '$lib/types.js';
	import { slide } from 'svelte/transition';
	import Badge from '$lib/components/ui/badge.svelte';

	interface Props {
		alerts: WeatherAlert[];
	}

	let { alerts }: Props = $props();

	let dismissed = $state(new Set<string>());
	let expanded = $state(new Set<string>());

	const visible = $derived(alerts.filter((a) => !dismissed.has(a.id)));

	const dismiss = (id: string) => {
		dismissed = new Set([...dismissed, id]);
	};

	const toggleExpand = (id: string) => {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
	};

	const borderColor: Record<string, string> = {
		info: 'border-l-blue-400/60',
		warning: 'border-l-amber-400/60',
		danger: 'border-l-orange-400/60',
		critical: 'border-l-red-400/60'
	};

	const bgColor: Record<string, string> = {
		info: 'bg-blue-500/8',
		warning: 'bg-amber-500/8',
		danger: 'bg-orange-500/8',
		critical: 'bg-red-500/8'
	};
</script>

{#if visible.length > 0}
	<div class="flex flex-col gap-2" role="alert" aria-live="polite">
		{#each visible as alert (alert.id)}
			<div
				transition:slide={{ duration: 200 }}
				class="rounded-xl border border-white/8 border-l-4 {borderColor[alert.severity]} {bgColor[alert.severity]} overflow-hidden"
			>
				<!-- Header row: clickable area + dismiss button -->
				<div class="flex items-center justify-between gap-2 px-4 py-3">
					<!-- Left: expand toggle (not a button to avoid nesting) -->
					<div
						class="flex flex-1 cursor-pointer items-center gap-2 min-w-0"
						role="button"
						tabindex="0"
						aria-expanded={expanded.has(alert.id)}
						onclick={() => toggleExpand(alert.id)}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleExpand(alert.id)}
					>
						<Badge severity={alert.severity} label={alert.severity.toUpperCase()} />
						<span class="truncate text-sm font-medium text-text-primary">{alert.title}</span>
						<svg
							class="ml-auto h-4 w-4 shrink-0 text-text-muted transition-transform duration-200 {expanded.has(alert.id) ? 'rotate-180' : ''}"
							fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</div>

					<!-- Dismiss button -->
					<button
						class="ml-1 shrink-0 rounded-md p-1 text-text-muted transition-colors hover:text-text-primary"
						onclick={() => dismiss(alert.id)}
						aria-label="Tutup peringatan {alert.title}"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if expanded.has(alert.id)}
					<div transition:slide={{ duration: 200 }} class="px-4 pb-3">
						<p class="text-sm text-text-secondary">{alert.description}</p>
						<div class="mt-2 rounded-lg bg-white/5 p-2.5 text-xs text-text-muted">
							<span class="font-medium text-text-secondary">Saran: </span>{alert.advice}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
