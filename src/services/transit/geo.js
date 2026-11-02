// NEXUS SMART CAMPUS — Transit Geometry Helpers
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

const EARTH_RADIUS_M = 6371008.8;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

/** Great-circle distance between two {lat, lng} points in metres. */
export function haversine(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Initial bearing from coordinate a to b ([lng, lat] GeoJSON order). */
export function bearing(a, b) {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Precompute cumulative distances along coordinates for O(log n) segment lookups.
 * @param {number[][]} coords [[lng, lat], ...]
 */
export function buildLine(coords) {
  const cum = new Float64Array(coords.length);
  for (let i = 1; i < coords.length; i++) {
    const [lng0, lat0] = coords[i - 1];
    const [lng1, lat1] = coords[i];
    cum[i] = cum[i - 1] + haversine({ lat: lat0, lng: lng0 }, { lat: lat1, lng: lng1 });
  }
  return { coords, cum, length: cum[cum.length - 1] || 0 };
}

function segmentIndex(line, d) {
  let lo = 0;
  let hi = line.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (line.cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * Point at distance d along the line, with the road's bearing.
 */
export function pointAt(line, d) {
  if (!line || !line.coords || line.coords.length === 0) {
    return { lng: 77.5447, lat: 12.8718, heading: 0 };
  }
  const dist = Math.min(Math.max(d, 0), line.length);
  const i = segmentIndex(line, dist);
  const a = line.coords[i];
  const b = line.coords[Math.min(i + 1, line.coords.length - 1)] || a;
  const segLen = line.cum[i + 1] - line.cum[i] || 1;
  const t = (dist - line.cum[i]) / segLen;
  return {
    lng: a[0] + (b[0] - a[0]) * t,
    lat: a[1] + (b[1] - a[1]) * t,
    heading: bearing(a, b),
  };
}

/**
 * Project a free coordinate (raw GPS fix) onto the polyline.
 * @returns {{dist_m: number, offset_m: number}}
 */
export function projectOnto(line, point) {
  if (!line || !line.coords || line.coords.length < 2) {
    return { dist_m: 0, offset_m: 0 };
  }
  const kx = toRad(1) * EARTH_RADIUS_M * Math.cos(toRad(point.lat));
  const ky = toRad(1) * EARTH_RADIUS_M;
  let best = { dist_m: 0, offset_m: Infinity };

  for (let i = 0; i < line.coords.length - 1; i++) {
    const ax = (line.coords[i][0] - point.lng) * kx;
    const ay = (line.coords[i][1] - point.lat) * ky;
    const bx = (line.coords[i + 1][0] - point.lng) * kx;
    const by = (line.coords[i + 1][1] - point.lat) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2));
    const offset = Math.hypot(ax + t * dx, ay + t * dy);
    if (offset < best.offset_m) {
      best = {
        dist_m: line.cum[i] + t * (line.cum[i + 1] - line.cum[i]),
        offset_m: offset,
      };
    }
  }
  return best;
}

/**
 * Slice a polyline from start_m to end_m, preserving interior vertices.
 */
export function sliceLine(line, from_m, to_m) {
  if (!line || !line.coords || line.coords.length === 0) return [];
  const startD = Math.max(0, Math.min(from_m, line.length));
  const endD = Math.max(startD, Math.min(to_m, line.length));
  if (startD >= endD) return [];

  const startPt = pointAt(line, startD);
  const endPt = pointAt(line, endD);
  const iStart = segmentIndex(line, startD);
  const iEnd = segmentIndex(line, endD);

  const out = [[startPt.lng, startPt.lat]];
  for (let i = iStart + 1; i <= iEnd; i++) {
    out.push(line.coords[i]);
  }
  out.push([endPt.lng, endPt.lat]);
  return out;
}

/** Get bounding box for a set of [lng, lat] coordinates */
export function getBounds(coords) {
  if (!coords || coords.length === 0) {
    return [[77.54, 12.85], [77.58, 12.92]];
  }
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

