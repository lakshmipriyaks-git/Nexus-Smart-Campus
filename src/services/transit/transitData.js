// NEXUS SMART CAMPUS — Transit Fleet & Route Data Indexer
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import routesRaw from '../../data/campusTransitRoutes.js';
import { buildLine, projectOnto } from './geo.js';

export const CAMPUS_LOCATIONS = routesRaw.campuses;

function makeTrip(route, direction, from, to, line, stops) {
  return {
    key: `${route.id}:${direction}`,
    direction,
    from,
    to,
    line,
    stops,
    kind: route.kind || 'route',
  };
}

export function indexRoute(routeId = 'S1') {
  const raw = routesRaw.routes.find((r) => r.id === routeId) || routesRaw.routes[0];
  const line = buildLine(raw.geometry);

  const stops = (raw.stops || []).map((s) => {
    const { dist_m } = projectOnto(line, s);
    return {
      key: s.name,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      d: dist_m,
    };
  });

  const route = {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    from: raw.from,
    to: raw.to,
    kind: raw.kind || 'route',
    line,
    stops,
  };

  const trips = {
    out: makeTrip(route, 'out', route.from, route.to, line, stops),
    back: makeTrip(
      route,
      'back',
      route.to,
      route.from,
      buildLine([...raw.geometry].reverse()),
      [...stops].reverse().map((s) => ({ ...s, d: line.length - s.d }))
    ),
  };

  return {
    campuses: CAMPUS_LOCATIONS,
    route,
    trips,
    raw,
  };
}

export const ALL_ROUTES = routesRaw.routes.map((r) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  from: r.from,
  to: r.to,
  stopsCount: r.stops?.length || 0,
}));
