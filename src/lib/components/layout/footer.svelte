<script lang="ts">
	import { ExternalLink } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
	const currentYear = new Date().getFullYear();
</script>

<footer class={cn('relative z-10 mt-16 px-5 pb-10 sm:px-8', className)}>
	<div class="mx-auto max-w-6xl">
		<div class="divider"></div>

		<div class="mt-10 grid grid-cols-1 gap-10 md:grid-cols-12">
			<!-- Mark + tagline -->
			<div class="md:col-span-5">
				<div class="flex items-center gap-2.5">
					<img src="/logo.svg" alt="Meteoid" class="h-5 w-5" />
					<span class="font-display text-2xl tracking-tight text-ink">Meteoid</span>
				</div>
				<p class="font-display mt-3 max-w-md text-2xl leading-snug text-ink-soft italic">
					Langit Indonesia, dirangkai dalam satu layar.
				</p>
				<p class="mt-3 max-w-md text-sm text-ink-mute">
					Prakiraan cuaca akurat dari data resmi Badan Meteorologi, Klimatologi, dan Geofisika
					(BMKG) untuk lebih dari 91.000 wilayah administratif.
				</p>
			</div>

			<div class="md:col-span-3">
				<p class="font-mono text-[10px] tracking-[0.22em] text-ink-mute uppercase">Sumber</p>
				<ul class="mt-3 flex flex-col gap-2.5 text-sm">
					<li>
						<a
							href="https://data.bmkg.go.id/prakiraan-cuaca/"
							target="_blank"
							rel="noopener noreferrer"
							class="group inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-ink"
						>
							<ExternalLink
								class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/>
							API BMKG
						</a>
					</li>
					<li>
						<a
							href="https://bmkg.go.id"
							target="_blank"
							rel="noopener noreferrer"
							class="group inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-ink"
						>
							<ExternalLink
								class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/>
							Website BMKG
						</a>
					</li>
				</ul>
			</div>

			<div class="md:col-span-4">
				<p class="font-mono text-[10px] tracking-[0.22em] text-ink-mute uppercase">Kredit</p>
				<ul class="mt-3 flex flex-col gap-2.5 text-sm">
					<li class="text-ink-soft">
						Dirancang oleh
						<span class="text-ink">Ferdy Indra</span>
						&
						<a
							href="https://asaa.dev"
							target="_blank"
							rel="noopener noreferrer"
							class="text-ink underline decoration-[var(--glass-line)] underline-offset-4 transition-colors hover:text-accent"
						>
							Dimas Angkasa
						</a>
					</li>
					<li>
						<a
							href="https://github.com/angkasa27/meteoid"
							target="_blank"
							rel="noopener noreferrer"
							class="group inline-flex items-center gap-2 text-ink-soft transition-colors hover:text-ink"
						>
							<svg
								class="h-3.5 w-3.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
							>
								<path
									d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
								/>
								<path d="M9 18c-4.51 2-5-2-7-2" />
							</svg>
							Source code
						</a>
					</li>
					<li class="text-xs text-ink-mute">
						Ikon cuaca:
						<a
							href="https://github.com/basmilius/weather-icons"
							target="_blank"
							rel="noopener noreferrer"
							class="text-ink-soft underline decoration-[var(--glass-line)] underline-offset-4 hover:text-accent"
						>
							Meteocons
						</a>
						(MIT)
					</li>
				</ul>
			</div>
		</div>

		<div
			class="mt-10 flex flex-col gap-4 border-t border-[var(--glass-line-soft)] pt-6 text-xs text-ink-mute sm:flex-row sm:items-center sm:justify-between"
		>
			<p>© {currentYear} Meteoid. Tidak untuk penggunaan komersial.</p>
			<p class="font-mono text-[10px] tracking-[0.2em] uppercase">Made for Indonesia</p>
		</div>
	</div>
</footer>
