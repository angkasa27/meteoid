import { describe, expect, it } from 'vitest';
import { buildHierarchyFromCsv, searchVillages } from './regions.js';

const hierarchy = buildHierarchyFromCsv(
	[
		'31,Dki Jakarta',
		'31.71,Jakarta Pusat',
		'31.71.01,Gambir',
		'31.71.01.1001,Petojo Selatan',
		'31.71.01.1002,Kebon Kelapa',
		'31.73,Jakarta Barat',
		'31.73.01,Palmerah',
		'31.73.01.1001,Kota Bambu Selatan',
		'32,Jawa Barat',
		'32.75,Kota Bekasi',
		'32.75.01,Bekasi Timur',
		'32.75.01.1001,Margahayu',
		'32.76,Kota Depok',
		'32.76.01,Pancoran Mas',
		'32.76.01.1001,Depok Jaya'
	].join('\n')
);

describe('searchVillages', () => {
	it('keeps village-name matches working', () => {
		const results = searchVillages(hierarchy, 'petojo');
		expect(results[0]?.villageName).toBe('Petojo Selatan');
	});

	it('returns descendant villages for regency or city queries', () => {
		const results = searchVillages(hierarchy, 'jakarta pusat', 10);
		expect(results.map((result) => result.villageName)).toEqual(
			expect.arrayContaining(['Petojo Selatan', 'Kebon Kelapa'])
		);
	});

	it('returns descendant villages for province queries', () => {
		const results = searchVillages(hierarchy, 'jawa barat', 10);
		expect(results.map((result) => result.villageName)).toEqual(
			expect.arrayContaining(['Margahayu', 'Depok Jaya'])
		);
	});

	it('matches combined address queries across fields', () => {
		const results = searchVillages(hierarchy, 'bekasi jawa barat', 10);
		expect(results[0]?.villageName).toBe('Margahayu');
	});

	it('ranks tighter matches ahead of broader substring matches', () => {
		const results = searchVillages(hierarchy, 'jakarta barat', 10);
		expect(results[0]?.regencyName).toBe('Jakarta Barat');
		expect(results[0]?.villageName).toBe('Kota Bambu Selatan');
	});
});
