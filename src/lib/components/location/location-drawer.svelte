<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { regionsStore, type RecentLocation } from '$lib/stores/regions.svelte.js';
	import type { SearchResult } from '$lib/regions.js';

	interface GeocodedResult {
		province: string | null;
		regency: string | null;
		district: string | null;
		village: string | null;
	}

	interface Props {
		currentCode: string;
		onSelect: (code: string, name: string, subName: string) => void;
		open: boolean;
		onClose: () => void;
	}

	let { currentCode, onSelect, open, onClose }: Props = $props();

	// ─── State ────────────────────────────────────────────────────────────────
	let query = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let searchTimer: ReturnType<typeof setTimeout>;
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let focusedIndex = $state(-1);

	// Geolocation state
	type GeoState = 'idle' | 'loading' | 'matching' | 'error';
	let geoState = $state<GeoState>('idle');
	let geoError = $state('');
	let geoMatches = $state<SearchResult[]>([]);

	// ─── Lifecycle ────────────────────────────────────────────────────────────
	$effect(() => {
		if (open) {
			// Kick off region loading when drawer first opens
			regionsStore.load();
			// Focus search input after transition
			setTimeout(() => inputEl?.focus(), 300);
		} else {
			// Reset state on close
			query = '';
			searchResults = [];
			geoState = 'idle';
			geoError = '';
			geoMatches = [];
			focusedIndex = -1;
		}
	});

	// Trap scroll when open
	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	// ─── Search ───────────────────────────────────────────────────────────────
	const doSearch = (q: string) => {
		focusedIndex = -1;
		if (!q.trim() || q.trim().length < 2) {
			searchResults = [];
			isSearching = false;
			return;
		}
		isSearching = true;
		searchResults = regionsStore.search(q, 25);
		isSearching = false;
	};

	const handleInput = () => {
		clearTimeout(searchTimer);
		geoState = 'idle';
		geoMatches = [];
		searchTimer = setTimeout(() => doSearch(query), 200);
	};

	const clearSearch = () => {
		query = '';
		searchResults = [];
		focusedIndex = -1;
		inputEl?.focus();
	};

	// Keyboard navigation
	const handleKeydown = (e: KeyboardEvent) => {
		const list = searchResults.length ? searchResults : [];
		if (!list.length) return;

		if (e.key === 'ArrowDown') {
			e.preventDefault();
			focusedIndex = Math.min(focusedIndex + 1, list.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
		} else if (e.key === 'Enter' && focusedIndex >= 0) {
			e.preventDefault();
			selectResult(list[focusedIndex]);
		} else if (e.key === 'Escape') {
			onClose();
		}
	};

	// ─── Selection ────────────────────────────────────────────────────────────
	const selectResult = (r: SearchResult) => {
		const subName = [r.districtName, r.regencyName].filter(Boolean).join(', ');
		regionsStore.saveRecent(r.villageCode, r.villageName, subName);
		onSelect(r.villageCode, r.villageName, subName);
		onClose();
	};

	const selectRecent = (r: RecentLocation) => {
		onSelect(r.code, r.name, r.subName);
		onClose();
	};

	// ─── Geolocation ─────────────────────────────────────────────────────────
	const useCurrentLocation = async () => {
		if (!navigator.geolocation) {
			geoError = 'Browser Anda tidak mendukung geolokasi.';
			geoState = 'error';
			return;
		}

		geoState = 'loading';
		geoError = '';
		geoMatches = [];
		query = '';
		searchResults = [];

		try {
			const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 8000,
					maximumAge: 60000
				});
			});

			const { latitude: lat, longitude: lon } = pos.coords;
			geoState = 'matching';

			const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
			if (!res.ok) {
				const err = await res.text();
				throw new Error(err || `HTTP ${res.status}`);
			}

			const geo: GeocodedResult = await res.json();

			// Ensure hierarchy is loaded before matching
			await regionsStore.load();
			const h = regionsStore.hierarchy;
			if (!h) throw new Error('Data wilayah belum tersedia');

			// Build a composite query from the geocoded names (most specific first)
			const searchTerms = [geo.village, geo.district, geo.regency]
				.filter(Boolean)
				.map((s) => s!.toLowerCase());

			// Try to find best match: exact village name then district then regency
			let matches: SearchResult[] = [];
			for (const term of searchTerms) {
				if (!term) continue;
				const found = regionsStore.search(term, 10);
				if (found.length > 0) {
					// Filter by province match if we have one
					if (geo.province) {
						const provFiltered = found.filter((f) =>
							f.provinceName.toLowerCase().includes(geo.province!.toLowerCase().slice(0, 5))
						);
						matches = provFiltered.length > 0 ? provFiltered : found;
					} else {
						matches = found;
					}
					if (matches.length > 0) break;
				}
			}

			if (matches.length === 0) {
				geoError = 'Lokasi tidak ditemukan dalam data wilayah. Coba cari manual.';
				geoState = 'error';
			} else if (matches.length === 1) {
				// Single match — auto-select
				selectResult(matches[0]);
			} else {
				geoMatches = matches.slice(0, 5);
				geoState = 'idle';
			}
		} catch (e) {
			if (e instanceof GeolocationPositionError) {
				geoError =
					e.code === e.PERMISSION_DENIED
						? 'Izin lokasi ditolak. Aktifkan di pengaturan browser.'
						: e.code === e.POSITION_UNAVAILABLE
							? 'Sinyal GPS tidak tersedia.'
							: 'Waktu habis saat mengambil lokasi.';
			} else {
				geoError = e instanceof Error ? e.message : 'Gagal mendeteksi lokasi.';
			}
			geoState = 'error';
		}
	};

	// ─── Highlight helper ─────────────────────────────────────────────────────
	const highlight = (text: string, q: string): string => {
		if (!q.trim()) return text;
		const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return text.replace(
			new RegExp(`(${escaped})`, 'gi'),
			'<mark class="bg-accent/25 text-accent rounded-sm px-0.5">$1</mark>'
		);
	};

	const showSearch = $derived(query.trim().length >= 2);
	const showRecent = $derived(!showSearch && geoMatches.length === 0);
</script>

{#if open}
	<!-- Backdrop -->
	<div
		transition:fade={{ duration: 180 }}
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		onclick={onClose}
		role="presentation"
		aria-hidden="true"
	></div>

	<!-- Panel -->
	<div
		transition:fly={{ y: 48, duration: 300, opacity: 0 }}
		class="fixed right-0 bottom-0 left-0 z-50 flex max-h-[92dvh] flex-col
			   rounded-t-2xl border-t border-white/10 bg-[oklch(0.15_0.025_260)]
			   lg:top-0 lg:right-0 lg:bottom-auto lg:left-auto lg:h-full lg:max-h-full
			   lg:w-[400px] lg:rounded-none lg:rounded-l-2xl lg:border-t-0 lg:border-l"
		role="dialog"
		aria-modal="true"
		aria-label="Pilih Lokasi"
	>
		<!-- Drag handle (mobile) -->
		<div class="flex shrink-0 justify-center pt-2.5 pb-1 lg:hidden" aria-hidden="true">
			<div class="h-1 w-10 rounded-full bg-white/20"></div>
		</div>

		<!-- Header -->
		<div class="flex shrink-0 items-center justify-between border-b border-white/8 px-5 py-3">
			<h2 class="text-base font-semibold text-text-primary">Pilih Lokasi</h2>
			<button
				onclick={onClose}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted
					   transition-colors hover:bg-white/8 hover:text-text-primary"
				aria-label="Tutup"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- ── Current location button ───────────────────────────────────────── -->
		<div class="shrink-0 px-4 pt-4 pb-3">
			<button
				onclick={useCurrentLocation}
				disabled={geoState === 'loading' || geoState === 'matching'}
				class="group flex w-full items-center gap-3 rounded-xl border px-4 py-3
					   transition-all duration-200
					   {geoState === 'error'
					? 'border-red-500/30 bg-red-500/8 text-red-300'
					: 'border-accent/30 bg-accent/8 text-accent hover:border-accent/50 hover:bg-accent/12'}
					   disabled:cursor-wait disabled:opacity-60"
			>
				{#if geoState === 'loading' || geoState === 'matching'}
					<svg class="h-5 w-5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					<span class="text-sm font-medium">
						{geoState === 'loading' ? 'Mendeteksi lokasi…' : 'Mencocokkan wilayah…'}
					</span>
				{:else if geoState === 'error'}
					<svg
						class="h-5 w-5 shrink-0 text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
						/>
					</svg>
					<div class="flex-1 text-left">
						<div class="text-sm font-medium text-red-300">Gagal mendeteksi</div>
						<div class="mt-0.5 text-xs text-red-400/70">{geoError}</div>
					</div>
					<svg
						class="h-4 w-4 shrink-0 opacity-60"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<div class="flex-1 text-left">
						<div class="text-sm font-medium">Gunakan Lokasi Saat Ini</div>
						<div class="mt-0.5 text-xs opacity-60">Deteksi otomatis via GPS</div>
					</div>
					<svg
						class="h-4 w-4 shrink-0 opacity-40 transition-transform group-hover:translate-x-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				{/if}
			</button>
		</div>

		<!-- ── Search bar ─────────────────────────────────────────────────────── -->
		<div class="shrink-0 px-4 pb-3">
			<!-- Divider with label -->
			<div class="mb-3 flex items-center gap-2">
				<div class="h-px flex-1 bg-white/8"></div>
				<span class="text-xs text-text-muted">atau cari manual</span>
				<div class="h-px flex-1 bg-white/8"></div>
			</div>

			<div class="relative">
				<svg
					class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="search"
					placeholder="Nama kelurahan atau desa…"
					oninput={handleInput}
					onkeydown={handleKeydown}
					autocomplete="off"
					spellcheck="false"
					class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pr-9 pl-9 text-sm
						   text-text-primary transition-all
						   duration-150 placeholder:text-text-muted focus:border-accent/50 focus:bg-white/8 focus:ring-1
						   focus:ring-accent/20 focus:outline-none"
				/>
				{#if query}
					<button
						onclick={clearSearch}
						class="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center
							   rounded-full bg-white/10 text-text-muted hover:bg-white/15 hover:text-text-secondary"
						aria-label="Hapus pencarian"
					>
						<svg
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				{/if}
			</div>

			<!-- Loading indicator -->
			{#if regionsStore.loading}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
					<svg class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
						/>
					</svg>
					Memuat data 91.000+ wilayah…
				</p>
			{:else if regionsStore.error}
				<p class="mt-2 text-xs text-red-400">{regionsStore.error}</p>
			{/if}
		</div>

		<!-- ── Scrollable results area ────────────────────────────────────────── -->
		<div class="flex-1 overflow-y-auto px-4 pb-6">
			<!-- GPS match candidates -->
			{#if geoMatches.length > 0}
				<div class="mb-1">
					<p class="mb-2 text-xs font-medium tracking-wide text-text-muted uppercase">
						📍 Wilayah Terdekat
					</p>
					<div class="flex flex-col gap-1">
						{#each geoMatches as r (r.villageCode)}
							<button
								onclick={() => selectResult(r)}
								class="flex w-full items-start gap-3 rounded-xl border border-white/6 bg-accent/5 px-3 py-2.5 text-left
									   transition-all duration-150 hover:border-accent/25 hover:bg-accent/10"
							>
								<svg
									class="mt-0.5 h-4 w-4 shrink-0 text-accent"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<div class="min-w-0 flex-1">
									<div class="truncate text-sm font-medium text-text-primary">{r.villageName}</div>
									<div class="mt-0.5 truncate text-xs text-text-muted">
										{[r.districtName, r.regencyName, r.provinceName].filter(Boolean).join(' · ')}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Search results -->
			{#if showSearch}
				{#if searchResults.length > 0}
					<p class="mb-2 text-xs text-text-muted">
						{searchResults.length} kelurahan/desa ditemukan
					</p>
					<ul role="listbox" class="flex flex-col gap-1">
						{#each searchResults as r, i (r.villageCode)}
							<li>
								<button
									onclick={() => selectResult(r)}
									class="flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left
										   transition-all duration-100
										   {focusedIndex === i
										? 'border-accent/40 bg-accent/10'
										: 'border-white/5 bg-white/3 hover:border-white/10 hover:bg-white/6'}"
									role="option"
									aria-selected={focusedIndex === i}
								>
									<!-- Location pin icon -->
									<svg
										class="mt-0.5 h-4 w-4 shrink-0 text-text-muted"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									<div class="min-w-0 flex-1">
										<!-- Village name with highlight -->
										<div class="truncate text-sm font-medium text-text-primary">
											{@html highlight(r.villageName, query)}
										</div>
										<!-- Breadcrumb path -->
										<div class="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
											<span class="truncate">{r.districtName}</span>
											{#if r.regencyName}
												<svg
													class="h-2.5 w-2.5 shrink-0 opacity-40"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 5l7 7-7 7"
													/>
												</svg>
												<span class="truncate">{r.regencyName}</span>
											{/if}
											{#if r.provinceName}
												<svg
													class="h-2.5 w-2.5 shrink-0 opacity-40"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 5l7 7-7 7"
													/>
												</svg>
												<span class="truncate opacity-70">{r.provinceName}</span>
											{/if}
										</div>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{:else if !regionsStore.loading && !isSearching}
					<div class="py-8 text-center">
						<p class="mb-2 text-2xl">🔍</p>
						<p class="text-sm text-text-muted">
							Tidak ada hasil untuk <strong class="text-text-secondary">"{query}"</strong>
						</p>
						<p class="mt-1 text-xs text-text-muted">Coba nama lain atau ejaan yang berbeda</p>
					</div>
				{/if}

				<!-- Recent locations -->
			{:else if showRecent}
				{#if regionsStore.recentLocations.length > 0}
					<div class="mb-4">
						<div class="mb-2 flex items-center justify-between">
							<p class="text-xs font-medium tracking-wide text-text-muted uppercase">Riwayat</p>
							<button
								onclick={() => regionsStore.clearRecent()}
								class="text-xs text-text-muted transition-colors hover:text-text-secondary"
							>
								Hapus semua
							</button>
						</div>
						<div class="flex flex-col gap-1">
							{#each regionsStore.recentLocations as r (r.code)}
								<div
									class="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5
									        transition-all duration-100 hover:border-white/10 hover:bg-white/6"
								>
									<button
										onclick={() => selectRecent(r)}
										class="flex min-w-0 flex-1 items-center gap-3 text-left"
									>
										<svg
											class="h-4 w-4 shrink-0 text-text-muted"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm font-medium text-text-primary">{r.name}</div>
											<div class="truncate text-xs text-text-muted">{r.subName}</div>
										</div>
									</button>
									<button
										onclick={() => regionsStore.removeRecent(r.code)}
										class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-text-muted opacity-0
											   transition-all group-hover:opacity-100 hover:text-text-secondary"
										aria-label="Hapus {r.name}"
									>
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Tips -->
				<div class="rounded-xl bg-white/3 px-4 py-3.5">
					<p class="mb-2 text-xs font-medium text-text-secondary">💡 Tips</p>
					<ul class="space-y-1.5 text-xs text-text-muted">
						<li class="flex gap-2">
							<span>•</span><span>Ketik nama kelurahan / desa di atas</span>
						</li>
						<li class="flex gap-2">
							<span>•</span><span>Minimal 2 karakter untuk mulai pencarian</span>
						</li>
						<li class="flex gap-2">
							<span>•</span><span>Gunakan ↑↓ untuk navigasi keyboard</span>
						</li>
						<li class="flex gap-2">
							<span>•</span><span>Mencakup 91.000+ wilayah seluruh Indonesia</span>
						</li>
					</ul>
				</div>
			{/if}
		</div>
	</div>
{/if}
