// ─── Raw BMKG API types ────────────────────────────────────────────────────────

export interface WeatherItem {
	local_datetime: string;
	weather_desc: string;
	t: number; // temperature °C
	hu: number; // humidity %
	ws: number; // wind speed km/h
	wd_deg: number; // wind direction in degrees
	wd: string; // wind direction label (e.g. "S")
	image: string; // weather icon URL from BMKG
}

export interface WeatherResponse {
	data: Array<{
		cuaca: WeatherItem[][];
	}>;
}

// ─── Processed / UI types ─────────────────────────────────────────────────────

export type WeatherCategory = 'clear' | 'partly-cloudy' | 'cloudy' | 'rain' | 'storm' | 'fog';

export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';

export interface ProcessedWeatherData {
	datetime: Date;
	dateStr: string; // YYYY-MM-DD
	timeStr: string; // HH:MM
	label: string; // e.g. "Cerah", "Hujan Lebat"
	category: WeatherCategory;
	temperature: number;
	humidity: number;
	windSpeedKmh: number;
	windSpeedKnots: number;
	windDegrees: number;
	windDirectionLabel: string;
	iconUrl: string;
	heatIndex: number; // calculated
}

export interface DailyForecast {
	dateStr: string;
	label: string; // weekday name in Indonesian
	category: WeatherCategory;
	minTemp: number;
	maxTemp: number;
	avgHumidity: number;
	dominantWeather: string;
	hourly: ProcessedWeatherData[];
}

export interface WeatherAlert {
	id: string;
	severity: AlertSeverity;
	title: string;
	description: string;
	advice: string;
}

// ─── Region types ─────────────────────────────────────────────────────────────

export type RegionLevel = 'province' | 'regency' | 'district' | 'village';

export interface RegionNode {
	code: string;
	name: string;
	level: RegionLevel;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Province extends RegionNode {
	level: 'province';
	regencies: Regency[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Regency extends RegionNode {
	level: 'regency';
	parentProvinceCode: string;
	districts: District[];
}

export interface District extends RegionNode {
	level: 'district';
	parentProvinceCode: string;
	parentRegencyCode: string;
	villages: Village[];
}

export interface Village extends RegionNode {
	level: 'village';
	parentProvinceCode: string;
	parentRegencyCode: string;
	parentDistrictCode: string;
}

export interface RegionHierarchy {
	provinces: Province[];
	provinceMap: Map<string, Province>;
	regencyMap: Map<string, Regency>;
	districtMap: Map<string, District>;
	villageMap: Map<string, Village>;
}

export interface RegionPath {
	province?: Province;
	regency?: Regency;
	district?: District;
	village?: Village;
}
