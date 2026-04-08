<script lang="ts">
	import type { RegionPath } from '$lib/types.js';

	interface Props {
		path: RegionPath;
		class?: string;
	}

	let { path, class: cls = '' }: Props = $props();

	const parts = $derived(
		[path.province?.name, path.regency?.name, path.district?.name, path.village?.name].filter(
			Boolean
		) as string[]
	);
</script>

{#if parts.length > 0}
	<nav aria-label="Lokasi" class="flex flex-wrap items-center gap-1 text-xs {cls}">
		{#each parts as part, i}
			<span class={i === parts.length - 1 ? 'font-medium text-text-primary' : 'text-text-muted'}>
				{part}
			</span>
			{#if i < parts.length - 1}
				<svg class="h-3 w-3 text-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		{/each}
	</nav>
{/if}
