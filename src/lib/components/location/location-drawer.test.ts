import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocationDrawer from './location-drawer.svelte';
import { resetRegionsStoreForTests } from '$lib/stores/regions.svelte.js';

const CSV_WITH_HTML = [
	'31,Dki Jakarta',
	'31.71,Jakarta Pusat',
	'31.71.01,Gambir',
	'31.71.01.1001,<img src="x" onerror="window.__xss = true">Kebon',
	'31.73,Jakarta Barat',
	'31.73.01,Palmerah',
	'31.73.01.1001,Kota Bambu Selatan',
	'32,Jawa Barat',
	'32.75,Kota Bekasi',
	'32.75.01,Bekasi Timur',
	'32.75.01.1001,Margahayu'
].join('\n');

const createProps = () => ({
	currentCode: '31.71.01.1001',
	onSelect: vi.fn(),
	open: true,
	onClose: vi.fn()
});

const SEARCH_PLACEHOLDER = 'Kelurahan, kota/kabupaten, atau provinsi…';

describe('location drawer', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.useFakeTimers();
		localStorage.clear();
		resetRegionsStoreForTests();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('shows a loading state while region data is being fetched', async () => {
		let resolveFetch: ((value: { ok: true; text: () => Promise<string> }) => void) | undefined;
		const fetchPromise = new Promise<{ ok: true; text: () => Promise<string> }>((resolve) => {
			resolveFetch = resolve;
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(() => fetchPromise)
		);

		render(LocationDrawer, createProps());

		expect(screen.getByText('Memuat data 91.000+ wilayah…')).toBeInTheDocument();

		resolveFetch?.({
			ok: true,
			text: async () => CSV_WITH_HTML
		});
		await vi.runAllTimersAsync();
	});

	it('renders highlighted search results without injecting html', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: async () => CSV_WITH_HTML
			})
		);

		const { container } = render(LocationDrawer, createProps());

		await waitFor(() =>
			expect(screen.queryByText('Memuat data 91.000+ wilayah…')).not.toBeInTheDocument()
		);

		const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
		await fireEvent.input(input, { target: { value: 'keb' } });
		await vi.runAllTimersAsync();
		await waitFor(() => expect(container.textContent).toContain('Kebon'));

		expect(container.querySelector('p img')).toBeNull();
	});

	it('shows an error state when region loading fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: async () => 'boom'
			})
		);

		render(LocationDrawer, createProps());

		expect(await screen.findByText('Gagal memuat data wilayah. Coba lagi.')).toBeInTheDocument();
	});

	it('returns village rows for city and province queries', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: async () => CSV_WITH_HTML
			})
		);

		render(LocationDrawer, createProps());

		await waitFor(() =>
			expect(screen.queryByText('Memuat data 91.000+ wilayah…')).not.toBeInTheDocument()
		);

		const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);

		await fireEvent.input(input, { target: { value: 'jakarta barat' } });
		await vi.runAllTimersAsync();
		expect(await screen.findByText('Kota Bambu Selatan')).toBeInTheDocument();

		await fireEvent.input(input, { target: { value: 'jawa barat' } });
		await vi.runAllTimersAsync();
		expect(await screen.findByText('Margahayu')).toBeInTheDocument();
	});

	it('supports combined address queries across regency and province', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: async () => CSV_WITH_HTML
			})
		);

		render(LocationDrawer, createProps());

		await waitFor(() =>
			expect(screen.queryByText('Memuat data 91.000+ wilayah…')).not.toBeInTheDocument()
		);

		const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
		await fireEvent.input(input, { target: { value: 'bekasi jawa barat' } });
		await vi.runAllTimersAsync();

		expect(await screen.findByText('Margahayu')).toBeInTheDocument();
	});
});
