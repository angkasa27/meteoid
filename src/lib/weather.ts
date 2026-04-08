import type {
	WeatherResponse,
	ProcessedWeatherData,
	DailyForecast,
	WeatherCategory,
	WeatherAlert,
	AlertSeverity
} from './types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_REGION_CODE = '36.71.01.1003'; // Tangerang Selatan

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'Mei',
	'Jun',
	'Jul',
	'Agu',
	'Sep',
	'Okt',
	'Nov',
	'Des'
];

// ─── Unit helpers ─────────────────────────────────────────────────────────────

export const kmhToKnots = (kmh: number): number => +(kmh * 0.539957).toFixed(1);

export const getWindDirectionLabel = (deg: number): string => {
	const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
	return dirs[Math.round(deg / 45) % 8];
};

export const getWindDirectionFull = (deg: number): string => {
	const dirs = [
		'Utara',
		'Timur Laut',
		'Timur',
		'Tenggara',
		'Selatan',
		'Barat Daya',
		'Barat',
		'Barat Laut'
	];
	return dirs[Math.round(deg / 45) % 8];
};

// ─── Weather category mapping ──────────────────────────────────────────────────

const WEATHER_CATEGORY_MAP: [RegExp, WeatherCategory][] = [
	[/cerah berawan|partly/i, 'partly-cloudy'],
	[/berawan|cloudy/i, 'cloudy'],
	[/kabut|fog|asap/i, 'fog'],
	[/badai|storm|petir|thunderstorm/i, 'storm'],
	[/hujan|rain/i, 'rain'],
	[/cerah|clear|sunny/i, 'clear']
];

export const getWeatherCategory = (label: string): WeatherCategory => {
	for (const [pattern, category] of WEATHER_CATEGORY_MAP) {
		if (pattern.test(label)) return category;
	}
	return 'partly-cloudy';
};

// ─── Heat index (simplified) ──────────────────────────────────────────────────

export const calcHeatIndex = (tempC: number, humidity: number): number => {
	if (tempC < 27) return tempC;
	const T = tempC;
	const R = humidity;
	const hi =
		-8.78469475556 +
		1.61139411 * T +
		2.33854883889 * R -
		0.14611605 * T * R -
		0.012308094 * T * T -
		0.0164248277778 * R * R +
		0.002211732 * T * T * R +
		0.00072546 * T * R * R -
		0.000003582 * T * T * R * R;
	return Math.round(hi);
};

// ─── Date formatting ──────────────────────────────────────────────────────────

export const formatDateId = (date: Date): string =>
	`${DAYS_ID[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]}`;

export const formatTimeShort = (date: Date): string =>
	`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

// ─── Data processing ──────────────────────────────────────────────────────────

export const processWeatherData = (data: WeatherResponse): ProcessedWeatherData[] => {
	const processed: ProcessedWeatherData[] = [];

	if (!data?.data?.[0]?.cuaca) return processed;

	for (const group of data.data[0].cuaca) {
		for (const item of group) {
			const dt = item.local_datetime || '';
			const datetime = new Date(dt);
			const dateStr = dt.slice(0, 10);
			const timeStr = dt.slice(11, 16);
			const temperature = item.t ?? 0;
			const humidity = item.hu ?? 0;

			processed.push({
				datetime,
				dateStr,
				timeStr,
				label: item.weather_desc || 'Tidak diketahui',
				category: getWeatherCategory(item.weather_desc || ''),
				temperature,
				humidity,
				windSpeedKmh: item.ws ?? 0,
				windSpeedKnots: kmhToKnots(item.ws ?? 0),
				windDegrees: item.wd_deg ?? 0,
				windDirectionLabel: getWindDirectionLabel(item.wd_deg ?? 0),
				iconUrl: item.image || '',
				heatIndex: calcHeatIndex(temperature, humidity)
			});
		}
	}

	// Sort by datetime ascending
	processed.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
	return processed;
};

// ─── Group by day ─────────────────────────────────────────────────────────────

export const groupByDate = (data: ProcessedWeatherData[]): DailyForecast[] => {
	const map = new Map<string, ProcessedWeatherData[]>();
	for (const item of data) {
		const group = map.get(item.dateStr) ?? [];
		group.push(item);
		map.set(item.dateStr, group);
	}

	return Array.from(map.entries()).map(([dateStr, hourly]) => {
		const temps = hourly.map((h) => h.temperature);
		const humidities = hourly.map((h) => h.humidity);
		const weatherCounts = new Map<string, number>();
		for (const h of hourly) {
			weatherCounts.set(h.label, (weatherCounts.get(h.label) ?? 0) + 1);
		}
		const dominantWeather = [...weatherCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
		const dominantCategory = getWeatherCategory(dominantWeather);

		const date = new Date(`${dateStr}T00:00:00`);

		return {
			dateStr,
			label: formatDateId(date),
			category: dominantCategory,
			minTemp: Math.min(...temps),
			maxTemp: Math.max(...temps),
			avgHumidity: Math.round(humidities.reduce((s, v) => s + v, 0) / humidities.length),
			dominantWeather,
			hourly
		} satisfies DailyForecast;
	});
};

// ─── Weather alerts ───────────────────────────────────────────────────────────

interface AlertDef {
	id: string;
	severity: AlertSeverity;
	title: string;
	description: string;
	advice: string;
	check: (data: ProcessedWeatherData[]) => boolean;
}

const ALERT_DEFS: AlertDef[] = [
	{
		id: 'extreme-heat',
		severity: 'critical',
		title: 'Suhu Ekstrem',
		description: 'Suhu diperkirakan mencapai 35°C atau lebih dalam beberapa jam ke depan.',
		advice:
			'Hindari aktivitas luar ruangan di siang hari. Minum air yang cukup dan gunakan pelindung matahari.',
		check: (d) => d.some((h) => h.temperature >= 35)
	},
	{
		id: 'heavy-rain',
		severity: 'danger',
		title: 'Potensi Hujan Lebat',
		description: 'Kelembapan tinggi dan kondisi cuaca menunjukkan potensi hujan lebat.',
		advice: 'Siapkan jas hujan atau payung. Waspadai genangan air dan banjir di daerah rendah.',
		check: (d) => d.some((h) => h.humidity > 90 && h.category === 'rain')
	},
	{
		id: 'strong-wind',
		severity: 'warning',
		title: 'Angin Kencang',
		description: 'Kecepatan angin diprakirakan mencapai 25 km/jam atau lebih.',
		advice:
			'Hindari berada di luar ruangan dekat pohon atau benda mudah terbang. Amankan benda-benda ringan.',
		check: (d) => d.some((h) => h.windSpeedKmh >= 25)
	},
	{
		id: 'thunderstorm',
		severity: 'critical',
		title: 'Potensi Badai Petir',
		description: 'Terdapat prakiraan badai petir di wilayah ini.',
		advice:
			'Segera cari tempat berlindung di dalam ruangan. Hindari berada di lapangan terbuka atau dekat pohon tinggi.',
		check: (d) => d.some((h) => h.category === 'storm')
	},
	{
		id: 'low-visibility',
		severity: 'warning',
		title: 'Visibilitas Rendah',
		description: 'Kabut atau kondisi berasap dapat mengurangi jarak pandang.',
		advice: 'Nyalakan lampu kabut saat berkendara. Kurangi kecepatan dan tingkatkan jarak aman.',
		check: (d) => d.some((h) => h.category === 'fog')
	},
	{
		id: 'high-humidity',
		severity: 'info',
		title: 'Kelembapan Tinggi',
		description: 'Kelembapan udara di atas 85%, cuaca terasa panas dan gerah.',
		advice:
			'Kenakan pakaian yang menyerap keringat dan hindari aktivitas fisik berat di luar ruangan.',
		check: (d) =>
			d.filter((h) => h.humidity > 85).length >= 3 &&
			d.some((h) => h.category !== 'rain' && h.category !== 'storm')
	}
];

export const generateAlerts = (data: ProcessedWeatherData[]): WeatherAlert[] => {
	// Only check the next 24 hours
	const next24h = data.slice(0, 8);
	return ALERT_DEFS.filter((def) => def.check(next24h)).map(
		({ id, severity, title, description, advice }) => ({
			id,
			severity,
			title,
			description,
			advice
		})
	);
};

// ─── Temperature color ────────────────────────────────────────────────────────

export const getTempColor = (temp: number): string => {
	if (temp <= 20) return 'text-cold';
	if (temp <= 27) return 'text-cool';
	if (temp <= 32) return 'text-warm';
	return 'text-hot';
};

export const getTempBg = (temp: number): string => {
	if (temp <= 20) return 'from-blue-600/20 to-blue-400/10';
	if (temp <= 27) return 'from-sky-500/20 to-cyan-400/10';
	if (temp <= 32) return 'from-amber-500/20 to-orange-400/10';
	return 'from-orange-600/20 to-red-500/10';
};
