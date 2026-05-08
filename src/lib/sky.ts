import type { WeatherCategory } from './types.js';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type SkyCondition = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog';
export type SkyKey = `${TimeOfDay}-${SkyCondition}`;

export const getTimeOfDay = (date: Date): TimeOfDay => {
	const h = date.getHours();
	if (h >= 5 && h < 8) return 'dawn';
	if (h >= 8 && h < 17) return 'day';
	if (h >= 17 && h < 19) return 'dusk';
	return 'night';
};

const CATEGORY_TO_CONDITION: Record<WeatherCategory, SkyCondition> = {
	clear: 'clear',
	'partly-cloudy': 'cloudy',
	cloudy: 'cloudy',
	rain: 'rain',
	storm: 'storm',
	fog: 'fog'
};

export const getSkyKey = (category: WeatherCategory, date: Date): SkyKey =>
	`${getTimeOfDay(date)}-${CATEGORY_TO_CONDITION[category]}`;

/* ─── Meteocons mapping ────────────────────────────────────────────────
   Maps category + time-of-day to an icon filename in /static/icons/weather/
   (copied from @bybas/weather-icons MIT).
   ──────────────────────────────────────────────────────────────────── */

export const getIconFile = (category: WeatherCategory, date: Date): string => {
	const isNight = getTimeOfDay(date) === 'night';
	switch (category) {
		case 'clear':
			return isNight ? 'clear-night.svg' : 'clear-day.svg';
		case 'partly-cloudy':
			return isNight ? 'partly-cloudy-night.svg' : 'partly-cloudy-day.svg';
		case 'cloudy':
			return 'cloudy.svg';
		case 'rain':
			return isNight ? 'partly-cloudy-night-rain.svg' : 'partly-cloudy-day-rain.svg';
		case 'storm':
			return isNight ? 'thunderstorms-night-rain.svg' : 'thunderstorms-day-rain.svg';
		case 'fog':
			return isNight ? 'haze.svg' : 'fog.svg';
		default:
			return 'cloudy.svg';
	}
};

export const iconUrl = (category: WeatherCategory, date: Date, base = ''): string =>
	`${base}/icons/weather/${getIconFile(category, date)}`;
