import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const adm4 = url.searchParams.get('adm4');

	if (!adm4) {
		throw error(400, 'Missing adm4 parameter');
	}

	// Validate the region code format (X.XX.XX.XXXX)
	if (!/^\d{1,2}\.\d{2}\.\d{2}\.\d{4}$/.test(adm4)) {
		throw error(400, 'Invalid adm4 region code format');
	}

	try {
		const bmkgUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`;

		const response = await fetch(bmkgUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				Accept: 'application/json',
				'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
			}
		});

		if (!response.ok) {
			throw error(response.status, `BMKG API error: ${response.statusText}`);
		}

		const data = await response.json();

		return json(data, {
			headers: {
				'Cache-Control': 'public, max-age=900' // 15 minutes cache
			}
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) throw err;
		console.error('BMKG fetch error:', err);
		throw error(502, 'Failed to fetch weather data from BMKG');
	}
};
