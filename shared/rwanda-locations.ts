// Rwanda administrative location data (Province/City -> District -> Sector for Kigali).
// Source: official district/NISR data, verified Aug 2026. No villages included.
// Shared between client (dropdowns) and server (order validation).

export const PROVINCES = [
  "Kigali City",
  "Eastern Province",
  "Northern Province",
  "Southern Province",
  "Western Province",
] as const;

export type Province = (typeof PROVINCES)[number];

export const DISTRICTS_BY_PROVINCE: Record<string, string[]> = {
  "Kigali City": ["Gasabo", "Kicukiro", "Nyarugenge"],
  "Eastern Province": [
    "Bugesera",
    "Gatsibo",
    "Kayonza",
    "Kirehe",
    "Ngoma",
    "Nyagatare",
    "Rwamagana",
  ],
  "Northern Province": ["Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo"],
  "Southern Province": [
    "Gisagara",
    "Huye",
    "Kamonyi",
    "Muhanga",
    "Nyamagabe",
    "Nyanza",
    "Nyaruguru",
    "Ruhango",
  ],
  "Western Province": [
    "Karongi",
    "Ngororero",
    "Nyabihu",
    "Nyamasheke",
    "Rubavu",
    "Rusizi",
    "Rutsiro",
  ],
};

// Sectors only exist (in this dropdown) for Kigali's three districts.
export const KIGALI_SECTORS_BY_DISTRICT: Record<string, string[]> = {
  Gasabo: [
    "Bumbogo",
    "Gatsata",
    "Gikomero",
    "Gisozi",
    "Jabana",
    "Jali",
    "Kacyiru",
    "Kimihurura",
    "Kimironko",
    "Kinyinya",
    "Ndera",
    "Nduba",
    "Remera",
    "Rusororo",
    "Rutunga",
  ],
  Kicukiro: [
    "Gahanga",
    "Gatenga",
    "Gikondo",
    "Kagarama",
    "Kanombe",
    "Kicukiro",
    "Kigarama",
    "Masaka",
    "Niboye",
    "Nyarugunga",
  ],
  Nyarugenge: [
    "Gitega",
    "Kanyinya",
    "Kigali",
    "Kimisagara",
    "Mageragere",
    "Muhima",
    "Nyakabanda",
    "Nyamirambo",
    "Nyarugenge",
    "Rwezamenyo",
  ],
};

export function isKigaliDistrict(district: string): boolean {
  return district in KIGALI_SECTORS_BY_DISTRICT;
}

// Validates a submitted province/district/sector combination.
// Sector is only checked when the district is one of Kigali's three districts;
// outside Kigali, sector is expected to be empty/absent.
export function isValidRwandaLocation(
  province: string,
  district: string,
  sector?: string | null
): boolean {
  const districts = DISTRICTS_BY_PROVINCE[province];
  if (!districts || !districts.includes(district)) return false;

  if (isKigaliDistrict(district)) {
    if (!sector) return false;
    const sectors = KIGALI_SECTORS_BY_DISTRICT[district];
    return sectors.includes(sector);
  }

  // Outside Kigali: no sector expected.
  return true;
}
