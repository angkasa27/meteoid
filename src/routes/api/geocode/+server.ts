import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

interface NominatimResponse {
	address: {
		village?: string;
		hamlet?: string;
		suburb?: string;
		neighbourhood?: string;
		city_district?: string;
		district?: string;
		county?: string;
		city?: string;
		town?: string;
		state?: string;
		country?: string;
		country_code?: string;
	};
	display_name?: string;
}

export const GET: RequestHandler = async ({ url }) => {
	const lat = url.searchParams.get('lat');
	const lon = url.searchParams.get('lon');

	if (!lat || !lon) {
		throw error(400, 'Missing lat or lon parameters');
	}

	const parsedLat = parseFloat(lat);
	const parsedLon = parseFloat(lon);

	if (isNaN(parsedLat) || isNaN(parsedLon)) {
		throw error(400, 'Invalid lat/lon values');
	}

	// Indonesia bounding box check
	if (parsedLat < -11 || parsedLat > 6 || parsedLon < 95 || parsedLon > 141) {
		throw error(400, 'Coordinates are outside Indonesia');
	}

	try {
		const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${parsedLat}&lon=${parsedLon}&format=json&zoom=14&addressdetails=1&accept-language=id`;

		const res = await fetch(nominatimUrl, {
			headers: {
				'User-Agent': 'Meteoid/1.0 (Indonesian Weather App; contact@meteoid.id)',
				Accept: 'application/json'
			}
		});

		if (!res.ok) {
			throw error(502, 'Geocoding service unavailable');
		}

		const data: NominatimResponse = await res.json();

		if (data.address.country_code !== 'id') {
			throw error(400, 'Location is outside Indonesia');
		}

		const addr = data.address;

		// Extract the most useful name for each administrative level
		// matching what's in our regions hierarchy
		const result = {
			// Province / state
			province: addr.state ?? null,

			// Regency / city
			regency: addr.county ?? addr.city ?? addr.town ?? null,

			// District / kecamatan
			district: addr.city_district ?? addr.district ?? null,

			// Village / kelurahan / desa
			village:
				addr.village ??
				addr.hamlet ??
				addr.suburb ??
				addr.neighbourhood ??
				null,

			// Full display name for UI
			displayName: data.display_name ?? null,

			// Raw address for debugging
			raw: addr
		};

		return json(result, {
			headers: {
				'Cache-Control': 'no-store' // GPS results should not be cached
			}
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('Geocode error:', err);
		throw error(502, 'Failed to reverse geocode location');
	}
};
