import type { RequestHandler } from './$types';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Read the local CSV once at module level (cached for the server lifetime)
let csvCache: string | null = null;

const getCsv = (): string => {
	if (csvCache) return csvCache;
	// Resolve relative to the project root (works with adapter-node)
	const csvPath = resolve('static/regions.csv');
	csvCache = readFileSync(csvPath, 'utf-8');
	return csvCache;
};

export const GET: RequestHandler = () => {
	try {
		const csv = getCsv();
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=86400',
				'Content-Length': String(Buffer.byteLength(csv, 'utf-8'))
			}
		});
	} catch (err) {
		console.error('Failed to read regions.csv:', err);
		return new Response('Region data unavailable', { status: 500 });
	}
};
