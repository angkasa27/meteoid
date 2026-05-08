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
		onSelect: (code: string, name: string, subName: string) => void;
		open: boolean;
		onClose: () => void;
	}

	let { onSelect, open, onClose }: Props = $props();

	let query = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let isSearching = $state(false);
	let searchTimer: ReturnType<typeof setTimeout>;
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let focusedIndex = $state(-1);

	type GeoState = 'idle' | 'loading' | 'matching' | 'error';
	let geoState = $state<GeoState>('idle');
	let geoError = $state('');
	let geoMatches = $state<SearchResult[]>([]);

	$effect(() => {
		if (open) {
			void regionsStore.load();
			const focusTimer = setTimeout(() => inputEl?.focus(), 300);
			return () => clearTimeout(focusTimer);
		} else {
			query = '';
			searchResults = [];
			geoState = 'idle';
			geoError = '';
			geoMatches = [];
			focusedIndex = -1;
		}
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	const doSearch = (q: string) => {
		focusedIndex = -1;
		if (!q.trim() || q.trim().length < 2) {
			searchResults = [];
			isSearching = false;
			return;
		}

		if (regionsStore.loading || !regionsStore.hierarchy) {
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

			await regionsStore.load();
			const h = regionsStore.hierarchy;
			if (!h) throw new Error('Data wilayah belum tersedia');

			const searchTerms = [geo.village, geo.district, geo.regency]
				.filter(Boolean)
				.map((s) => s!.toLowerCase());

			let matches: SearchResult[] = [];
			for (const term of searchTerms) {
				if (!term) continue;
				const found = regionsStore.search(term, 10);
				if (found.length > 0) {
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

	const highlight = (text: string, q: string): Array<{ text: string; match: boolean }> => {
		const trimmed = q.trim();
		if (!trimmed) return [{ text, match: false }];

		const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const pattern = new RegExp(escaped, 'gi');
		const parts: Array<{ text: string; match: boolean }> = [];
		let lastIndex = 0;

		for (const match of text.matchAll(pattern)) {
			const index = match.index ?? 0;
			if (index > lastIndex) {
				parts.push({ text: text.slice(lastIndex, index), match: false });
			}

			parts.push({ text: match[0], match: true });
			lastIndex = index + match[0].length;
		}

		if (lastIndex < text.length) {
			parts.push({ text: text.slice(lastIndex), match: false });
		}

		return parts.length ? parts : [{ text, match: false }];
	};

	const showSearch = $derived(query.trim().length >= 2);
	const showRecent = $derived(!showSearch && geoMatches.length === 0);
</script>

{#if open}
	<div
		transition:fade={{ duration: 180 }}
		class="fixed inset-0 z-40 bg-black/65 backdrop-blur-md"
		onclick={onClose}
		role="presentation"
		aria-hidden="true"
	></div>

	<div
		transition:fly={{ y: 48, duration: 320, opacity: 0 }}
		class="glass-strong fixed right-0 bottom-0 left-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[var(--radius-card)]
			lg:top-0 lg:right-0 lg:bottom-auto lg:left-auto lg:h-full lg:max-h-full lg:w-[420px] lg:rounded-none lg:rounded-l-[var(--radius-card)]"
		role="dialog"
		aria-modal="true"
		aria-label="Pilih Lokasi"
		style="background: oklch(0.14 0.04 270 / 92%);"
	>
		<!-- Drag handle (mobile) -->
		<div class="flex shrink-0 justify-center pt-2.5 pb-1 lg:hidden" aria-hidden="true">
			<div class="h-1 w-10 rounded-full bg-[var(--glass-line)]"></div>
		</div>

		<!-- Header -->
		<div
			class="flex shrink-0 items-center justify-between border-b border-[var(--glass-line-soft)] px-6 py-4"
		>
			<div>
				<p class="font-mono text-[10px] tracking-[0.22em] text-ink-mute uppercase">Cari</p>
				<h2 class="font-display text-2xl text-ink">Pilih lokasi</h2>
			</div>
			<button
				onclick={onClose}
				class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--glass)] text-ink-mute transition-colors hover:bg-[var(--glass-strong)] hover:text-ink"
				aria-label="Tutup"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Geolocate -->
		<div class="shrink-0 px-5 pt-4 pb-3">
			<button
				onclick={useCurrentLocation}
				disabled={geoState === 'loading' || geoState === 'matching'}
				class="group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-all
					{geoState === 'error'
					? 'bg-[oklch(0.4_0.15_25_/_18%)] text-[oklch(0.85_0.12_30)]'
					: 'bg-[var(--glass)] text-ink hover:bg-[var(--glass-strong)]'}
					disabled:cursor-wait disabled:opacity-60"
			>
				{#if geoState === 'loading' || geoState === 'matching'}
					<svg class="h-5 w-5 shrink-0 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
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
					<span class="text-sm">
						{geoState === 'loading' ? 'Mendeteksi lokasi…' : 'Mencocokkan wilayah…'}
					</span>
				{:else if geoState === 'error'}
					<svg
						class="h-5 w-5 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
						/>
					</svg>
					<div class="flex-1">
						<p class="text-sm">Gagal mendeteksi</p>
						<p class="mt-0.5 text-xs opacity-70">{geoError}</p>
					</div>
				{:else}
					<svg
						class="h-5 w-5 shrink-0 text-accent"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 21s-7-7.58-7-12a7 7 0 1114 0c0 4.42-7 12-7 12z"
						/>
						<circle cx="12" cy="9" r="2.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<div class="flex-1">
						<p class="text-sm text-ink">Gunakan lokasi saat ini</p>
						<p class="mt-0.5 text-xs text-ink-mute">Deteksi via GPS</p>
					</div>
					<svg
						class="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
			</button>
		</div>

		<!-- Search input -->
		<div class="shrink-0 px-5 pb-3">
			<div class="my-3 flex items-center gap-3">
				<div class="h-px flex-1 bg-[var(--glass-line-soft)]"></div>
				<span class="font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase">atau cari</span
				>
				<div class="h-px flex-1 bg-[var(--glass-line-soft)]"></div>
			</div>

			<div class="relative">
				<svg
					class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-mute"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="search"
					placeholder="Kelurahan, kota/kabupaten, atau provinsi…"
					oninput={handleInput}
					onkeydown={handleKeydown}
					autocomplete="off"
					spellcheck="false"
					class="w-full rounded-2xl border border-[var(--glass-line-soft)] bg-[var(--glass)] py-3 pr-10 pl-10 text-sm text-ink placeholder:text-ink-mute focus:border-[var(--accent)] focus:bg-[var(--glass-strong)] focus:outline-none"
				/>
				{#if query}
					<button
						onclick={clearSearch}
						class="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--glass-strong)] text-ink-mute hover:text-ink"
						aria-label="Hapus pencarian"
					>
						<svg
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2.5"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			{#if regionsStore.loading}
				<p class="mt-2 flex items-center gap-1.5 text-xs text-ink-mute">
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
				<p class="mt-2 text-xs text-[oklch(0.78_0.16_30)]">{regionsStore.error}</p>
			{/if}
		</div>

		<!-- Results -->
		<div class="scrollbar-thin flex-1 overflow-y-auto px-5 pb-7">
			{#if geoMatches.length > 0}
				<p class="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase">
					Wilayah terdekat
				</p>
				<div class="flex flex-col gap-1.5">
					{#each geoMatches as r (r.villageCode)}
						<button
							onclick={() => selectResult(r)}
							class="flex w-full items-start gap-3 rounded-2xl bg-[var(--glass)] px-3.5 py-3 text-left transition-all hover:bg-[var(--glass-strong)]"
						>
							<svg
								class="mt-0.5 h-4 w-4 shrink-0 text-accent"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="1.8"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 21s-7-7.58-7-12a7 7 0 1114 0c0 4.42-7 12-7 12z"
								/>
								<circle cx="12" cy="9" r="2.5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<div class="min-w-0 flex-1">
								<p class="font-display truncate text-base leading-tight text-ink">
									{r.villageName}
								</p>
								<p class="mt-0.5 truncate text-xs text-ink-mute">
									{[r.districtName, r.regencyName, r.provinceName].filter(Boolean).join(' · ')}
								</p>
							</div>
						</button>
					{/each}
				</div>
			{/if}

			{#if showSearch}
				{#if searchResults.length > 0}
					<p class="mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase">
						{searchResults.length} hasil
					</p>
					<ul role="listbox" class="flex flex-col gap-1">
						{#each searchResults as r, i (r.villageCode)}
							<li>
								<button
									onclick={() => selectResult(r)}
									class="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all
										{focusedIndex === i
										? 'bg-[var(--glass-strong)] ring-1 ring-[var(--accent)]/40'
										: 'hover:bg-[var(--glass)]'}"
									role="option"
									aria-selected={focusedIndex === i}
								>
									<span
										class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full {focusedIndex === i
											? 'bg-accent'
											: 'bg-ink-faint'}"
									></span>
									<div class="min-w-0 flex-1">
										<p class="font-display truncate text-base leading-tight text-ink">
											{#each highlight(r.villageName, query) as part, partIndex (partIndex)}
												{#if part.match}
													<mark
														class="rounded-[2px] px-[2px] text-ink"
														style="background: color-mix(in oklch, var(--accent) 30%, transparent);"
													>
														{part.text}
													</mark>
												{:else}
													{part.text}
												{/if}
											{/each}
										</p>
										<p class="mt-0.5 truncate text-xs text-ink-mute">
											{r.districtName}{r.regencyName ? ` · ${r.regencyName}` : ''}{r.provinceName
												? ` · ${r.provinceName}`
												: ''}
										</p>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{:else if !regionsStore.loading && !isSearching}
					<div class="py-12 text-center">
						<p class="font-display text-5xl text-ink/30">—</p>
						<p class="mt-4 text-sm text-ink-soft">
							Tidak ada hasil untuk <span class="text-ink">"{query}"</span>
						</p>
						<p class="mt-1 text-xs text-ink-mute">Coba ejaan lain</p>
					</div>
				{/if}
			{:else if showRecent}
				{#if regionsStore.recentLocations.length > 0}
					<div class="mb-5">
						<div class="mb-2 flex items-center justify-between">
							<p class="font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase">Riwayat</p>
							<button
								onclick={() => regionsStore.clearRecent()}
								class="text-xs text-ink-mute transition-colors hover:text-ink"
							>
								Hapus semua
							</button>
						</div>
						<div class="flex flex-col gap-1">
							{#each regionsStore.recentLocations as r (r.code)}
								<div
									class="group flex items-center gap-2 rounded-2xl bg-[var(--glass)] px-3.5 py-3 transition-all hover:bg-[var(--glass-strong)]"
								>
									<button
										onclick={() => selectRecent(r)}
										class="flex min-w-0 flex-1 items-center gap-3 text-left"
									>
										<svg
											class="h-4 w-4 shrink-0 text-ink-mute"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="1.8"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										<div class="min-w-0 flex-1">
											<p class="font-display truncate text-base leading-tight text-ink">{r.name}</p>
											<p class="truncate text-xs text-ink-mute">{r.subName}</p>
										</div>
									</button>
									<button
										onclick={() => regionsStore.removeRecent(r.code)}
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-mute opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--glass-strong)] hover:text-ink"
										aria-label="Hapus {r.name}"
									>
										<svg
											class="h-3.5 w-3.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="rounded-2xl border border-[var(--glass-line-soft)] px-4 py-4">
					<p class="font-mono text-[10px] tracking-[0.2em] text-ink-mute uppercase">Tip</p>
					<p class="mt-2 text-sm leading-relaxed text-ink-soft">
						91.000+ wilayah Indonesia. Cari dengan nama kelurahan, kota/kabupaten, atau provinsi.
						Gunakan
						<span class="font-mono text-xs text-ink">↑↓</span> untuk navigasi.
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
