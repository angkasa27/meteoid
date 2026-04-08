import type { Province, Regency, District, Village, RegionHierarchy, RegionPath } from './types.js';

export type { RegionHierarchy, RegionPath };

// ─── Parsers ──────────────────────────────────────────────────────────────────

const parseLine = (line: string): { code: string; name: string } | null => {
	const trimmed = line.trim();
	if (!trimmed) return null;
	const comma = trimmed.indexOf(',');
	if (comma === -1) return null;
	const code = trimmed.slice(0, comma).trim();
	const name = trimmed.slice(comma + 1).trim();
	if (!code || !name) return null;
	return { code, name };
};

// ─── Ensure helpers ───────────────────────────────────────────────────────────

const ensureProvince = (h: RegionHierarchy, code: string, name: string): Province => {
	let p = h.provinceMap.get(code);
	if (!p) {
		p = { code, name, level: 'province', regencies: [] };
		h.provinceMap.set(code, p);
		h.provinces.push(p);
	} else if (!p.name && name) {
		p.name = name;
	}
	return p;
};

const ensureRegency = (
	h: RegionHierarchy,
	code: string,
	name: string,
	provinceCode: string
): Regency => {
	let r = h.regencyMap.get(code);
	if (!r) {
		r = { code, name, level: 'regency', parentProvinceCode: provinceCode, districts: [] };
		h.regencyMap.set(code, r);
		ensureProvince(h, provinceCode, '').regencies.push(r);
	} else if (!r.name && name) {
		r.name = name;
	}
	return r;
};

const ensureDistrict = (
	h: RegionHierarchy,
	code: string,
	name: string,
	provinceCode: string,
	regencyCode: string
): District => {
	let d = h.districtMap.get(code);
	if (!d) {
		d = {
			code,
			name,
			level: 'district',
			parentProvinceCode: provinceCode,
			parentRegencyCode: regencyCode,
			villages: []
		};
		h.districtMap.set(code, d);
		ensureRegency(h, regencyCode, '', provinceCode).districts.push(d);
	} else if (!d.name && name) {
		d.name = name;
	}
	return d;
};

const addVillage = (
	h: RegionHierarchy,
	code: string,
	name: string,
	provinceCode: string,
	regencyCode: string,
	districtCode: string
) => {
	if (h.villageMap.has(code)) return;
	const v: Village = {
		code,
		name,
		level: 'village',
		parentProvinceCode: provinceCode,
		parentRegencyCode: regencyCode,
		parentDistrictCode: districtCode
	};
	h.villageMap.set(code, v);
	ensureDistrict(h, districtCode, '', provinceCode, regencyCode).villages.push(v);
};

// ─── Build hierarchy from CSV ─────────────────────────────────────────────────

export const buildHierarchyFromCsv = (csv: string): RegionHierarchy => {
	const h: RegionHierarchy = {
		provinces: [],
		provinceMap: new Map(),
		regencyMap: new Map(),
		districtMap: new Map(),
		villageMap: new Map()
	};

	for (const line of csv.split(/\r?\n/)) {
		const parsed = parseLine(line);
		if (!parsed) continue;
		const { code, name } = parsed;
		const parts = code.split('.');

		switch (parts.length) {
			case 1:
				ensureProvince(h, code, name);
				break;
			case 2:
				ensureRegency(h, code, name, parts[0]);
				break;
			case 3:
				ensureDistrict(h, code, name, parts[0], `${parts[0]}.${parts[1]}`);
				break;
			case 4:
				addVillage(
					h,
					code,
					name,
					parts[0],
					`${parts[0]}.${parts[1]}`,
					`${parts[0]}.${parts[1]}.${parts[2]}`
				);
				break;
		}
	}

	const byName = <T extends { name: string }>(arr: T[]) =>
		arr.sort((a, b) => a.name.localeCompare(b.name, 'id'));

	byName(h.provinces);
	for (const prov of h.provinces) {
		byName(prov.regencies);
		for (const reg of prov.regencies) {
			byName(reg.districts);
			for (const dist of reg.districts) {
				byName(dist.villages);
			}
		}
	}

	return h;
};

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export const getRegionPath = (h: RegionHierarchy, villageCode: string): RegionPath => {
	const village = h.villageMap.get(villageCode);
	if (!village) return {};
	const district = h.districtMap.get(village.parentDistrictCode);
	const regency = h.regencyMap.get(village.parentRegencyCode);
	const province = h.provinceMap.get(village.parentProvinceCode);
	return { village, district, regency, province };
};

export const getRegionDisplayName = (h: RegionHierarchy, villageCode: string): string => {
	const { village, regency, province } = getRegionPath(h, villageCode);
	if (!village) return villageCode;
	const parts = [village.name];
	if (regency) parts.push(regency.name);
	if (province) parts.push(province.name);
	return parts.join(', ');
};

export const splitRegionCode = (code: string) => {
	const s = code.split('.');
	return {
		provinceCode: s[0] || '',
		regencyCode: s.length >= 2 ? `${s[0]}.${s[1]}` : '',
		districtCode: s.length >= 3 ? `${s[0]}.${s[1]}.${s[2]}` : '',
		villageCode: s.length >= 4 ? code : ''
	};
};

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
	villageCode: string;
	villageName: string;
	districtName: string;
	regencyName: string;
	provinceName: string;
	displayName: string;
}

export const searchVillages = (h: RegionHierarchy, query: string, limit = 20): SearchResult[] => {
	if (!query.trim()) return [];
	const q = query.toLowerCase().trim();
	const results: SearchResult[] = [];

	for (const [code, village] of h.villageMap) {
		if (!village.name.toLowerCase().includes(q)) continue;
		const district = h.districtMap.get(village.parentDistrictCode);
		const regency = h.regencyMap.get(village.parentRegencyCode);
		const province = h.provinceMap.get(village.parentProvinceCode);

		results.push({
			villageCode: code,
			villageName: village.name,
			districtName: district?.name ?? '',
			regencyName: regency?.name ?? '',
			provinceName: province?.name ?? '',
			displayName: [village.name, regency?.name, province?.name].filter(Boolean).join(', ')
		});

		if (results.length >= limit) break;
	}

	return results;
};
