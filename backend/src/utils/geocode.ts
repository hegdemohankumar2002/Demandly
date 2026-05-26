/**
 * Geocoding utility using Nominatim (OpenStreetMap) — free, no API key needed.
 * Rate limit: 1 request/second. Results are cached in memory.
 *
 * To switch to Google Geocoding later, just change the fetch URL
 * and parse the response differently.
 */

const cache = new Map<string, { lat: number; lng: number }>();

export async function geocodeFromPincode(
  pincode: string,
  city?: string
): Promise<{ lat: number; lng: number } | null> {
  const key = `${pincode}-${city || ''}`;

  if (cache.has(key)) return cache.get(key)!;

  try {
    const query = city
      ? `${pincode} ${city}, India`
      : `${pincode}, India`;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Demandly/1.0 (demandly-tracking)',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[GEOCODE] Nominatim returned ${res.status} for "${query}"`);
      return null;
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      console.warn(`[GEOCODE] No results for "${query}"`);
      return null;
    }

    const result = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };

    cache.set(key, result);
    console.log(`[GEOCODE] ${query} → ${result.lat}, ${result.lng}`);
    return result;
  } catch (error) {
    console.error('[GEOCODE] Error:', error);
    return null;
  }
}
