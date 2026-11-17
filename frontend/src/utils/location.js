export const FARM_BASE = { lat: -29.31, lng: 27.48 };

export function buildGoogleMapsUrl(query) {
  if (!query || !String(query).trim()) return '#';
  const clean = encodeURIComponent(String(query).trim());
  return `https://www.google.com/maps/search/?api=1&query=${clean}`;
}

export function buildDirectionsUrl(destinationQuery) {
  if (!destinationQuery || !String(destinationQuery).trim()) return '#';
  const destination = encodeURIComponent(String(destinationQuery).trim());
  const origin = encodeURIComponent(`${FARM_BASE.lat},${FARM_BASE.lng}`);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(hav));
}

export function formatDistanceKm(km) {
  if (!Number.isFinite(km) || km < 0) return 'Distance unavailable';
  if (km < 1) return '< 1 km away';
  return `${km.toFixed(1)} km away`;
}

export async function geocodeLocation(query, region = 'Lesotho') {
  const cleaned = String(query || '').trim();
  if (!cleaned) return null;

  const search = `${cleaned}, ${region}`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(search)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    const first = results[0];
    const lat = Number(first.lat);
    const lng = Number(first.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng, label: first.display_name || cleaned };
  } catch (error) {
    return null;
  }
}

export async function getLocationDistance(query, region = 'Lesotho') {
  const cleaned = String(query || '').trim();
  const mapQuery = cleaned ? `${cleaned}, ${region}` : '';
  if (!cleaned) return { distanceKm: null, googleMapUrl: buildGoogleMapsUrl(mapQuery), directionsUrl: '#' };

  const geo = await geocodeLocation(cleaned, region);
  if (!geo) {
    return {
      distanceKm: null,
      googleMapUrl: buildGoogleMapsUrl(mapQuery),
      directionsUrl: buildDirectionsUrl(mapQuery),
      label: cleaned,
    };
  }

  const distanceKm = haversineKm(FARM_BASE, geo);
  return {
    distanceKm,
    googleMapUrl: buildGoogleMapsUrl(mapQuery),
    directionsUrl: buildDirectionsUrl(mapQuery),
    label: geo.label,
    distanceText: formatDistanceKm(distanceKm),
  };
}
