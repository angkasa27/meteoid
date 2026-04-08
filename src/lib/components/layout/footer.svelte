<script lang="ts">
	import { ExternalLink, Heart } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
	const currentYear = new Date().getFullYear();
</script>

<footer class={cn('mt-12 border-t border-white/5 bg-bg-base/40 px-4 py-10 sm:px-6', className)}>
	<div class="mx-auto max-w-4xl">
		<div class="grid grid-cols-1 gap-10 md:grid-cols-3">
			<!-- About -->
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold tracking-wide text-text-primary">Tentang Aplikasi</h3>
				<div class="flex flex-col gap-2 text-sm leading-relaxed text-text-muted">
					<p>
						Meteoid, Aplikasi prakiraan cuaca Indonesia dengan data resmi dari Badan Meteorologi,
						Klimatologi, dan Geofisika (BMKG).
					</p>
					<p>
						Menyediakan informasi cuaca terkini untuk seluruh wilayah Indonesia dengan antarmuka
						yang responsif dan mudah digunakan.
					</p>
				</div>
			</div>

			<!-- Data Source -->
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold tracking-wide text-text-primary">Data Source</h3>
				<div class="flex flex-col gap-3">
					<a
						href="https://data.bmkg.go.id/prakiraan-cuaca/"
						target="_blank"
						rel="noopener noreferrer"
						class="group flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
					>
						<ExternalLink
							class="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
						/>
						<span>API BMKG (api.bmkg.go.id)</span>
					</a>
					<p class="text-xs leading-loose text-text-muted">
						Data cuaca diperbarui setiap 5 menit dari server BMKG. Informasi yang disajikan adalah
						prakiraan resmi dari Badan Meteorologi, Klimatologi, dan Geofisika.
					</p>
				</div>
			</div>

			<!-- Links -->
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold tracking-wide text-text-primary">Tautan Cepat</h3>
				<div class="flex flex-col gap-2.5">
					<a
						href="https://bmkg.go.id"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
					>
						<ExternalLink class="h-4 w-4" />
						<span>Website Resmi BMKG</span>
					</a>

					<a
						href="https://github.com/angkasa27/meteoid"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
							/>
							<path d="M9 18c-4.51 2-5-2-7-2" />
						</svg>
						<span>Source Code</span>
					</a>
				</div>
			</div>
		</div>

		<!-- Disclaimer -->
		<div class="glass mt-8 rounded-2xl p-4 text-center">
			<p class="mb-1 text-[10px] font-bold tracking-wider text-text-secondary uppercase opacity-50">
				Disclaimer
			</p>
			<p class="mx-auto max-w-2xl text-xs leading-relaxed text-text-muted">
				Aplikasi ini menggunakan data dari API publik BMKG. Selalu rujuk ke website resmi BMKG untuk
				informasi cuaca yang lebih akurat dan terkini, terutama untuk peringatan cuaca ekstrem atau
				kondisi darurat.
			</p>
		</div>

		<!-- Divider -->
		<div class="my-10 h-px w-full bg-white/5" aria-hidden="true"></div>

		<!-- Copyright -->
		<div
			class="flex flex-col items-center justify-between gap-4 text-center text-xs text-text-muted sm:flex-row sm:text-left"
		>
			<div class="flex flex-col gap-1.5 sm:flex-row sm:items-center">
				<span class="font-medium text-text-secondary">© {currentYear} Meteoid.</span>
				<div class="flex items-center justify-center gap-1 sm:justify-start">
					<span>Created by</span>
					<span class="font-medium text-text-primary">Ferdy Indra</span>
					<span>&</span>
					<a
						href="https://asaa.dev"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-text-primary underline decoration-white/10 underline-offset-2 transition-colors hover:text-accent"
					>
						Dimas Angkasa
					</a>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<span>Not for commercial use</span>
				<!-- <span class="h-1 w-1 rounded-full bg-white/10" aria-hidden="true"></span>
				<span class="flex items-center gap-1">
					Created with <Heart class="h-3 w-3 text-red-500/80 fill-red-500/20" /> in Indonesia
				</span> -->
			</div>
		</div>
	</div>
</footer>
