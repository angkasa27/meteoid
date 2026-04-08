import type { PageLoad } from './$types';
import { processWeatherData, groupByDate, generateAlerts, DEFAULT_REGION_CODE } from '$lib';
import type { WeatherResponse, ProcessedWeatherData, DailyForecast, WeatherAlert } from '$lib';

export const load: PageLoad = async ({ fetch, url }) => {
	const selectedCode = url.searchParams.get('adm4') ?? DEFAULT_REGION_CODE;

	// Only fetch weather — regions are lazy-loaded by the location drawer
	let hourlyData: ProcessedWeatherData[] = [];
	let dailyData: DailyForecast[] = [];
	let alerts: WeatherAlert[] = [];
	let weatherError: string | null = null;

	try {
		const res = await fetch(`/api/weather?adm4=${selectedCode}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const raw: WeatherResponse = await res.json();
		hourlyData = processWeatherData(raw);
		dailyData = groupByDate(hourlyData);
		alerts = generateAlerts(hourlyData);
	} catch {
		weatherError = 'Gagal memuat data cuaca. Silakan coba lagi.';
	}

	return {
		selectedCode,
		hourlyData,
		dailyData,
		alerts,
		weatherError
	};
};
