<script lang="ts">
	import type { WeatherAlert } from '$lib/types.js';
	import { slide } from 'svelte/transition';

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

	const accent: Record<string, string> = {
		info: 'var(--alert-info)',
		warning: 'var(--alert-warn)',
		danger: 'var(--alert-danger)',
		critical: 'var(--alert-critical)'
	};

	const label: Record<string, string> = {
		info: 'INFO',
		warning: 'PERINGATAN',
		danger: 'BAHAYA',
		critical: 'KRITIS'
	};
</script>

{#if visible.length > 0}
	<div class="flex flex-col gap-2.5" role="alert" aria-live="polite">
		{#each visible as alert (alert.id)}
			<div
				transition:slide={{ duration: 240 }}
				class="glass relative overflow-hidden rounded-[var(--radius-card)]"
				style="border-left: 3px solid {accent[alert.severity]};"
			>
				<div class="flex items-center gap-3 px-4 py-3.5">
					<span
						class="font-mono text-[10px] tracking-[0.2em]"
						style="color: {accent[alert.severity]};"
					>
						{label[alert.severity]}
					</span>
					<button
						class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
						aria-expanded={expanded.has(alert.id)}
						onclick={() => toggleExpand(alert.id)}
					>
						<span class="truncate font-display text-lg text-ink">{alert.title}</span>
						<svg
							class="ml-auto h-4 w-4 shrink-0 text-ink-mute transition-transform duration-200 {expanded.has(
								alert.id
							)
								? 'rotate-180'
								: ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					<button
						class="shrink-0 rounded-md p-1 text-ink-mute transition-colors hover:text-ink"
						onclick={() => dismiss(alert.id)}
						aria-label="Tutup peringatan {alert.title}"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if expanded.has(alert.id)}
					<div transition:slide={{ duration: 220 }} class="px-4 pb-4">
						<p class="text-sm text-ink-soft">{alert.description}</p>
						<div
							class="mt-3 rounded-xl bg-[var(--glass)] p-3 text-xs text-ink-mute"
						>
							<span
								class="font-mono text-[10px] tracking-[0.18em] uppercase"
								style="color: {accent[alert.severity]};"
							>
								Saran
							</span>
							<p class="mt-1 text-ink-soft">{alert.advice}</p>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
