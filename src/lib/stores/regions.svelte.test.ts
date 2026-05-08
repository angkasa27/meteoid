import { beforeEach, describe, expect, it, vi } from 'vitest';
import { regionsStore, resetRegionsStoreForTests } from './regions.svelte.js';

const CSV_FIXTURE = [
	'31,Dki Jakarta',
	'31.71,Jakarta Pusat',
	'31.71.01,Gambir',
	'31.71.01.1001,Petojo Selatan'
].join('\n');

describe('regionsStore', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
		resetRegionsStoreForTests();
	});

	it('loads region data from the static csv path and caches subsequent calls', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			text: async () => CSV_FIXTURE
		});
		vi.stubGlobal('fetch', fetchMock);

		await regionsStore.load();
		await regionsStore.load();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith('/regions.csv');
		expect(regionsStore.hierarchy?.villageMap.get('31.71.01.1001')?.name).toBe('Petojo Selatan');
	});

	it('retries after a failed fetch and enables search once data is available', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => 'boom'
			})
			.mockResolvedValueOnce({
				ok: true,
				text: async () => CSV_FIXTURE
			});
		vi.stubGlobal('fetch', fetchMock);

		expect(regionsStore.search('petojo')).toEqual([]);

		await regionsStore.load();
		expect(regionsStore.error).toBe('Gagal memuat data wilayah. Coba lagi.');
		expect(regionsStore.search('petojo')).toEqual([]);

		await regionsStore.load();

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(regionsStore.error).toBeNull();
		expect(regionsStore.search('petojo')[0]?.villageName).toBe('Petojo Selatan');
	});
});
