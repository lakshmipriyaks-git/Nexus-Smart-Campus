// NEXUS SMART CAMPUS — Transit Stop ETAs & Trip Status
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import { TRANSIT_CONFIG } from './config.js';

const AT_STOP_TOLERANCE_M = 25; // tolerance for GPS jitter when stopped at pole
const STOPPED_KMH = 3;          // speed below this = stationary
const SLOW_KMH = 3;
const CRUISING_KMH = 12;
const MAX_ETA_SPEED_KMH = 50;

/**
 * Calculates per-stop state and remaining ETA in seconds.
 * @param {{stops: {d: number, name: string}[]}} trip
 * @param {number} distM
 * @param {'moving'|'at_stop'|'layover'} status
 * @param {number} speedKmh
 */
export function stopEtas(trip, distM, status, speedKmh) {
  if (!trip || !trip.stops || trip.stops.length === 0) {
    return { stops: [], nextIndex: -1 };
  }

  const speedMs = Math.max(speedKmh, 3) / 3.6;
  const stationary = status !== 'moving';
  let nextIndex = -1;
  let dwellsAhead = stationary ? TRANSIT_CONFIG.eta.dwellS / 2 : 0;

  const stops = trip.stops.map((stop, i) => {
    const gap = stop.d - distM;
    if (stationary && Math.abs(gap) <= AT_STOP_TOLERANCE_M) {
      if (status === 'layover') return { stop, state: 'passed', eta_s: null };
      nextIndex = i;
      return { stop, state: 'current', eta_s: 0 };
    }
    if (gap <= 0) return { stop, state: 'passed', eta_s: null };
    if (nextIndex === -1) nextIndex = i;
    const eta_s = gap / speedMs + dwellsAhead;
    dwellsAhead += TRANSIT_CONFIG.eta.dwellS;
    return { stop, state: i === nextIndex ? 'current' : 'upcoming', eta_s };
  });

  return { stops, nextIndex };
}

/**
 * Speed to plan ETA with, using exponential moving average (EMA) speed.
 * Falls back to typical speed while stopped or crawling in traffic.
 */
export function etaSpeed(emaKmh) {
  const typical = TRANSIT_CONFIG.eta.typicalSpeedKmh;
  if (emaKmh == null) return typical;
  const trust = Math.min(1, Math.max(0, (emaKmh - SLOW_KMH) / (CRUISING_KMH - SLOW_KMH)));
  return typical + trust * (Math.min(emaKmh, MAX_ETA_SPEED_KMH) - typical);
}

/**
 * Determines whether bus is moving, boarding at an intermediate stop, or on layover at terminus.
 */
export function tripStatus(trip, distM, speedKmh) {
  if (speedKmh >= STOPPED_KMH) return 'moving';
  if (!trip || !trip.stops || trip.stops.length === 0) return 'moving';
  const near = (stop) => Math.abs(stop.d - distM) <= AT_STOP_TOLERANCE_M;
  if (near(trip.stops[trip.stops.length - 1])) return 'layover';
  return trip.stops.some(near) ? 'at_stop' : 'moving';
}

/** Formats ETA seconds into human-readable string like "~4 min" */
export function formatEta(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  if (seconds <= 45) return 'Arriving';
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}

