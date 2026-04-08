import { buildHierarchyFromCsv, searchVillages } from '$lib/regions.js';
import type { RegionHierarchy, SearchResult } from '$lib/regions.js';

// ─── Module-level reactive state (singleton, persists across navigations) ────
let hierarchy = $state<RegionHierarchy | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let loadPromise: Promise<void> | null = null;

// ─── Recent locations (localStorage-backed) ───────────────────────────────────
export interface RecentLocation {
	code: string;
	name: string;
	subName: string;
	timestamp: number;
}

const RECENT_KEY = 'meteoid:recent-locations';
const RECENT_MAX = 6;

const readRecent = (): RecentLocation[] => {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
	} catch {
		return [];
	}
};

const writeRecent = (items: RecentLocation[]) => {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(RECENT_KEY, JSON.stringify(items));
};

let recentLocations = $state<RecentLocation[]>([]);

// ─── Store API ────────────────────────────────────────────────────────────────

export const regionsStore = {
	get hierarchy(): RegionHierarchy | null {
		return hierarchy;
	},
	get loading(): boolean {
		return loading;
	},
	get error(): string | null {
		return error;
	},
	get recentLocations(): RecentLocation[] {
		return recentLocations;
	},

	/** Call once to kick off loading — safe to call multiple times */
	async load(): Promise<void> {
		if (hierarchy || loading) return loadPromise ?? Promise.resolve();

		loading = true;
		error = null;

		loadPromise = (async () => {
			try {
				const res = await fetch('/api/regions');
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const csv = await res.text();
				hierarchy = buildHierarchyFromCsv(csv);
				// Hydrate recent locations from localStorage on first load
				recentLocations = readRecent();
			} catch (e) {
				error = 'Gagal memuat data wilayah. Coba lagi.';
				console.error('[regionsStore] load error:', e);
			} finally {
				loading = false;
			}
		})();

		return loadPromise;
	},

	/** Fuzzy search across all 91K villages */
	search(query: string, limit = 20): SearchResult[] {
		if (!hierarchy || !query.trim()) return [];
		return searchVillages(hierarchy, query, limit);
	},

	/** Save a selected location to recent list */
	saveRecent(code: string, name: string, subName: string) {
		const entry: RecentLocation = { code, name, subName, timestamp: Date.now() };
		const filtered = readRecent().filter((r) => r.code !== code);
		const updated = [entry, ...filtered].slice(0, RECENT_MAX);
		writeRecent(updated);
		recentLocations = updated;
	},

	/** Remove one recent location */
	removeRecent(code: string) {
		const updated = readRecent().filter((r) => r.code !== code);
		writeRecent(updated);
		recentLocations = updated;
	},

	/** Clear all recent locations */
	clearRecent() {
		writeRecent([]);
		recentLocations = [];
	}
};

export type { SearchResult };
