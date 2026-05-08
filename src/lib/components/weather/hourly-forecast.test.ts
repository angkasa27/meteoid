import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HourlyForecast from './hourly-forecast.svelte';
import type { ProcessedWeatherData } from '$lib/types.js';

const makeItem = (iso: string, temperature: number): ProcessedWeatherData => ({
	datetime: new Date(iso),
	dateStr: iso.slice(0, 10),
	timeStr: iso.slice(11, 16),
	label: 'Cerah',
	category: 'clear',
	temperature,
	humidity: 70,
	windSpeedKmh: 10,
	windSpeedKnots: 5.4,
	windDegrees: 0,
	windDirectionLabel: 'U',
	iconUrl: '',
	heatIndex: temperature
});

describe('hourly forecast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-05-08T10:05:00'));
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('moves the KINI marker when the current hour changes', async () => {
		render(HourlyForecast, {
			hourly: [makeItem('2026-05-08T10:00:00', 30), makeItem('2026-05-08T11:00:00', 31)]
		});

		expect(screen.getByText('KINI')).toBeInTheDocument();
		expect(screen.queryByText('10:00')).not.toBeInTheDocument();

		await vi.advanceTimersByTimeAsync(60 * 60 * 1000);

		expect(screen.getByText('10:00')).toBeInTheDocument();
		expect(screen.getByText('KINI')).toBeInTheDocument();
	});
});
