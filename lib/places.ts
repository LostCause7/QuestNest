export type NearbyPlace = {
  key: string;
  name: string;
  kind: string;
  icon: string;
  cost: number;
  category: "privilege" | "item" | "experience";
  title: string;
  description: string;
  miles: number;
  address?: string | null;
};

const UA = "QuestNest/1.0 (https://questnest.org; family rewards app)";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name?: string;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

function formatAddress(props: PhotonFeature["properties"]) {
  if (!props) return null;
  const street = [props.housenumber, props.street].filter(Boolean).join(" ").trim();
  const cityLine = [props.city, props.state, props.postcode].filter(Boolean).join(", ");
  const parts = [street, cityLine].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

const PLACE_FILTERS: {
  tag: string;
  value: string;
  kind: string;
  icon: string;
  cost: number;
  verb: string;
  query: string;
}[] = [
  { tag: "amenity", value: "ice_cream", kind: "Ice cream", icon: "🍦", cost: 100, verb: "Ice cream at", query: "ice cream" },
  { tag: "amenity", value: "cinema", kind: "Movies", icon: "🎬", cost: 150, verb: "Movie at", query: "movie theater" },
  { tag: "amenity", value: "library", kind: "Library", icon: "📚", cost: 40, verb: "Visit", query: "library" },
  { tag: "amenity", value: "cafe", kind: "Cafe", icon: "🧁", cost: 80, verb: "Treat at", query: "cafe" },
  { tag: "amenity", value: "fast_food", kind: "Restaurant", icon: "🍔", cost: 120, verb: "Meal at", query: "restaurant" },
  { tag: "leisure", value: "park", kind: "Park", icon: "🏞️", cost: 50, verb: "Play at", query: "park" },
  { tag: "leisure", value: "playground", kind: "Playground", icon: "🛝", cost: 50, verb: "Play at", query: "playground" },
  { tag: "leisure", value: "bowling_alley", kind: "Bowling", icon: "🎳", cost: 180, verb: "Bowl at", query: "bowling" },
  { tag: "leisure", value: "swimming_pool", kind: "Pool", icon: "🏊", cost: 100, verb: "Swim at", query: "swimming pool" },
  { tag: "tourism", value: "museum", kind: "Museum", icon: "🏛️", cost: 140, verb: "Visit", query: "museum" },
  { tag: "tourism", value: "zoo", kind: "Zoo", icon: "🦁", cost: 220, verb: "Visit", query: "zoo" },
  { tag: "shop", value: "toys", kind: "Toy store", icon: "🧸", cost: 200, verb: "Shop at", query: "toy store" },
  { tag: "shop", value: "books", kind: "Bookstore", icon: "📖", cost: 90, verb: "Bookstore trip to", query: "bookstore" },
  { tag: "shop", value: "bakery", kind: "Bakery", icon: "🥐", cost: 70, verb: "Treat at", query: "bakery" },
  { tag: "leisure", value: "ice_rink", kind: "Ice rink", icon: "⛸️", cost: 160, verb: "Skate at", query: "ice rink" },
  { tag: "leisure", value: "miniature_golf", kind: "Mini golf", icon: "⛳", cost: 120, verb: "Play at", query: "mini golf" },
  { tag: "amenity", value: "restaurant", kind: "Restaurant", icon: "🍝", cost: 130, verb: "Meal at", query: "pizza" },
  { tag: "amenity", value: "theatre", kind: "Theater", icon: "🎭", cost: 140, verb: "Show at", query: "theater" },
  { tag: "leisure", value: "water_park", kind: "Water park", icon: "🌊", cost: 200, verb: "Splash at", query: "water park" },
  { tag: "tourism", value: "aquarium", kind: "Aquarium", icon: "🐠", cost: 200, verb: "Visit", query: "aquarium" },
  { tag: "shop", value: "confectionery", kind: "Candy shop", icon: "🍬", cost: 70, verb: "Treat at", query: "candy store" },
  { tag: "leisure", value: "amusement_arcade", kind: "Arcade", icon: "🕹️", cost: 90, verb: "Play at", query: "arcade" },
  { tag: "amenity", value: "community_centre", kind: "Community", icon: "🏠", cost: 40, verb: "Visit", query: "community center" },
];

export const NEARBY_PAGE_SIZE = 8;

function milesBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function categoryFor(kind: string): NearbyPlace["category"] {
  return kind === "Toy store" || kind === "Bookstore" ? "item" : "experience";
}

function toPlace(
  filter: (typeof PLACE_FILTERS)[number],
  name: string,
  key: string,
  miles: number,
  address?: string | null
): NearbyPlace {
  const distance = miles < 10 ? miles.toFixed(1) : String(Math.round(miles));
  return {
    key,
    name,
    kind: filter.kind,
    icon: filter.icon,
    cost: filter.cost,
    category: categoryFor(filter.kind),
    title: `${filter.verb} ${name}`.slice(0, 80),
    description: address
      ? `${filter.kind} · ${distance} miles · ${address}`
      : `${filter.kind} about ${distance} miles away.`,
    miles,
    address: address ?? null,
  };
}

async function fetchJson(url: string | URL, init: RequestInit, timeoutMs: number) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ac.signal,
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("The map search took too long. Try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function geocodeCityState(city: string, state: string) {
  const q = `${city.trim()}, ${state.trim()}`;
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    const hits = (await fetchJson(url, {}, 8000)) as NominatimHit[];
    const hit = hits[0];
    if (hit) return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name ?? q };
  } catch {
    /* try Photon */
  }

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");
  const json = (await fetchJson(url, {}, 8000)) as { features?: PhotonFeature[] };
  const feat = json.features?.[0];
  const coords = feat?.geometry?.coordinates;
  if (!coords) throw new Error("We couldn't find that city. Check the spelling.");
  return { lat: coords[1], lng: coords[0], label: feat?.properties?.name ?? q };
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const out: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function bboxAround(lat: number, lng: number, miles: number) {
  const dLat = miles / 69;
  const dLng = miles / (Math.max(0.2, Math.cos((lat * Math.PI) / 180)) * 69);
  return `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`;
}

function placesFromFeatures(
  filter: (typeof PLACE_FILTERS)[number],
  features: PhotonFeature[],
  lat: number,
  lng: number,
  radiusMiles: number
) {
  return features
    .map((feat) => {
      const name = feat.properties?.name?.trim();
      const coords = feat.geometry?.coordinates;
      if (!name || name.length < 2 || !coords) return null;
      const miles = milesBetween(lat, lng, coords[1], coords[0]);
      if (miles > radiusMiles + 0.75) return null;
      const osmType = feat.properties?.osm_type ?? "n";
      const osmId = feat.properties?.osm_id ?? name;
      return toPlace(filter, name, `osm:${osmType}:${osmId}`, miles, formatAddress(feat.properties));
    })
    .filter((p): p is NearbyPlace => Boolean(p));
}

async function photonSearch(
  filter: (typeof PLACE_FILTERS)[number],
  lat: number,
  lng: number,
  radiusMiles: number,
  tagged: boolean
) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", filter.query);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("limit", "12");
  url.searchParams.set("location_bias_scale", "0.8");
  url.searchParams.set("bbox", bboxAround(lat, lng, Math.min(radiusMiles, 40)));
  if (tagged) url.searchParams.append("osm_tag", `${filter.tag}:${filter.value}`);
  const json = (await fetchJson(url, {}, 7000)) as { features?: PhotonFeature[] };
  return placesFromFeatures(filter, json.features ?? [], lat, lng, radiusMiles);
}

async function fetchPhotonPlaces(lat: number, lng: number, radiusMiles: number): Promise<NearbyPlace[]> {
  const batches = await mapPool(PLACE_FILTERS, 4, async (filter) => {
    try {
      const tagged = await photonSearch(filter, lat, lng, radiusMiles, true);
      if (tagged.length) return tagged;
      return await photonSearch(filter, lat, lng, radiusMiles, false);
    } catch {
      return [] as NearbyPlace[];
    }
  });
  return batches.flat();
}

async function fetchOverpassPlaces(lat: number, lng: number, radiusMiles: number): Promise<NearbyPlace[]> {
  const meters = Math.round(Math.min(Math.max(radiusMiles, 5), 40) * 1609.34);
  const query = `[out:json][timeout:12];(
    nwr["name"]["amenity"~"ice_cream|cinema|library|cafe|fast_food"](around:${meters},${lat},${lng});
    nwr["name"]["leisure"~"park|playground|bowling_alley|swimming_pool|ice_rink|miniature_golf"](around:${meters},${lat},${lng});
    nwr["name"]["tourism"~"museum|zoo"](around:${meters},${lat},${lng});
    nwr["name"]["shop"~"toys|books|bakery"](around:${meters},${lat},${lng});
  );out center 80;`;
  const mirrors = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  let lastError: unknown;
  for (const endpoint of mirrors) {
    try {
      const json = (await fetchJson(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ data: query }),
        },
        14000
      )) as {
        remark?: string;
        elements?: {
          type: string;
          id: number;
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: { name?: string; [k: string]: string | undefined };
        }[];
      };
      if (json.remark && /error|timeout/i.test(json.remark)) throw new Error(json.remark);
      const found: NearbyPlace[] = [];
      for (const el of json.elements ?? []) {
        const name = el.tags?.name?.trim();
        if (!name || name.length < 2) continue;
        const filter = PLACE_FILTERS.find((f) => el.tags?.[f.tag] === f.value);
        if (!filter) continue;
        const plat = el.lat ?? el.center?.lat;
        const plng = el.lon ?? el.center?.lon;
        if (plat == null || plng == null) continue;
        const miles = milesBetween(lat, lng, plat, plng);
        if (miles > radiusMiles + 0.75) continue;
        found.push(toPlace(filter, name, `osm:${el.type}:${el.id}`, miles));
      }
      return found;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Nearby places are taking a break.");
}

function dedupePlaces(places: NearbyPlace[]) {
  const seen = new Set<string>();
  const perKind = new Map<string, number>();
  const out: NearbyPlace[] = [];
  for (const p of places.sort((a, b) => a.miles - b.miles)) {
    const titleKey = `${p.kind}:${p.name.toLowerCase()}`;
    if (seen.has(p.key) || seen.has(titleKey)) continue;
    const count = perKind.get(p.kind) ?? 0;
    if (count >= 8) continue;
    seen.add(p.key);
    seen.add(titleKey);
    perKind.set(p.kind, count + 1);
    out.push(p);
  }
  return out.slice(0, 80);
}

const nearbyCache = new Map<string, { places: NearbyPlace[]; at: number }>();
const CACHE_MS = 5 * 60 * 1000;

function cacheKey(lat: number, lng: number, radiusMiles: number) {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}:${Math.round(radiusMiles)}`;
}

export async function fetchNearbyPlaces(lat: number, lng: number, radiusMiles: number): Promise<NearbyPlace[]> {
  const fromPhoton = await fetchPhotonPlaces(lat, lng, radiusMiles);
  if (fromPhoton.length >= 8) return dedupePlaces(fromPhoton);
  try {
    const fromOverpass = await fetchOverpassPlaces(lat, lng, radiusMiles);
    return dedupePlaces([...fromPhoton, ...fromOverpass]);
  } catch (e) {
    if (fromPhoton.length) return dedupePlaces(fromPhoton);
    throw e instanceof Error ? e : new Error("Nearby places are taking a break. Try again in a minute.");
  }
}

export type NearbyPage = {
  places: NearbyPlace[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export async function fetchNearbyPage(
  lat: number,
  lng: number,
  radiusMiles: number,
  page: number,
  pageSize = NEARBY_PAGE_SIZE
): Promise<Omit<NearbyPage, "origin">> {
  const key = cacheKey(lat, lng, radiusMiles);
  const hit = nearbyCache.get(key);
  const places =
    hit && Date.now() - hit.at < CACHE_MS ? hit.places : await fetchNearbyPlaces(lat, lng, radiusMiles);
  if (!hit || Date.now() - hit.at >= CACHE_MS) nearbyCache.set(key, { places, at: Date.now() });
  const safePage = Math.max(1, Math.floor(page) || 1);
  const start = (safePage - 1) * pageSize;
  return {
    places: places.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total: places.length,
    hasMore: start + pageSize < places.length,
  };
}

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
];
