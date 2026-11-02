// NEXUS SMART CAMPUS — Bus Tracker State Machine & Tracking Manager
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import { TRANSIT_CONFIG } from './config.js';
import { bearing, haversine, pointAt, projectOnto } from './geo.js';
import { stopEtas, etaSpeed, tripStatus } from './eta.js';

const SPEED_EMA_TAU_S = 8;
const HEADING_MIN_KMH = 5;
const FORWARD_MAX_DEG = 60;
const BACKWARD_MIN_DEG = 120;
const SLIDE_MAX_MS = 2500;
const JUMP_GAP_MS = 10_000;
const JUMP_DISTANCE_M = 300;

/**
 * Pure state machine deriving connection/GPS quality.
 * Priority:
 * 1. offline
 * 2. connecting
 * 3. lost (stale >15s)
 * 4. nofix (fix=false)
 * 5. offroute (>150m)
 * 6. live
 */
export function deriveState({ link, connectedAt, tracker, trackerAt, last, offRoute, now, timing }) {
  const revived = Boolean(last?.live) && (last.receivedAt ?? 0) > (trackerAt ?? 0);
  if (tracker === 'offline' && !revived) return 'offline';
  if (!last) {
    if (link !== 'connected') return 'connecting';
    return now - connectedAt > timing.noDataGraceMs ? 'offline' : 'connecting';
  }
  const fresh = last.at != null && now - last.at <= timing.staleAfterMs;
  if (!fresh) return 'lost';
  if (last.kind === 'nofix') return 'nofix';
  return offRoute ? 'offroute' : 'live';
}

export class BusTracker {
  #data;
  #cfg;
  #now;
  #startedAt;
  #link = 'connecting';
  #connectedAt = null;
  #tracker = { state: 'unknown', at: null };
  #last = null;
  #fix = null;
  #gps = { sats: null, hdop: null };
  #matched = null;
  #offRoute = false;
  #direction = null; // 'out' | 'back'
  #directionAnchor = null;
  #speedEma = null;
  #heading = null;
  #slide = null;
  #journey = null;

  constructor(data, provider, { config = TRANSIT_CONFIG, now = () => Date.now() } = {}) {
    this.#data = data;
    this.#cfg = config;
    this.#now = now;
    this.#startedAt = now();
    if (provider?.subscribe) {
      provider.subscribe((event) => this.handle(event));
    }
  }

  handle(event) {
    switch (event.type) {
      case 'link':
        this.#link = event.state;
        if (event.state === 'connected') this.#connectedAt ??= this.#now();
        break;
      case 'tracker':
        this.#tracker = { state: event.state, at: event.receivedAt };
        break;
      case 'nofix':
        this.#last = { kind: 'nofix', at: event.at, receivedAt: event.receivedAt, live: event.live };
        this.#gps = { sats: event.sats, hdop: event.hdop };
        break;
      case 'fix':
        this.#onFix(event);
        break;
      default:
        break;
    }
  }

  setJourney(trip) {
    this.#journey = trip;
    if (trip?.kind === 'shuttle') {
      this.#direction = trip.direction;
      this.#directionAnchor = this.#matched?.dist_m ?? null;
    }
  }

  setData(data) {
    this.#data = data;
    this.#matched = null;
    this.#direction = null;
  }

  get activeTrip() {
    return this.#journey ?? this.#data?.trips?.[this.#direction ?? 'out'] ?? null;
  }

  positionAt(t = this.#now()) {
    if (!this.#fix) return null;
    let heading = this.#heading ?? (this.#matched ? pointAt(this.activeTrip?.line, this.#matched.dist_m).heading : 0);

    if (!this.#slide) {
      return {
        lat: this.#fix.lat,
        lng: this.#fix.lng,
        heading,
        at: this.#fix.at,
      };
    }

    const { from, to, t0, dur } = this.#slide;
    const progress = Math.min(1, Math.max(0, (t - t0) / dur));
    return {
      lat: from.lat + (to.lat - from.lat) * progress,
      lng: from.lng + (to.lng - from.lng) * progress,
      heading,
      at: this.#fix.at,
    };
  }

  snapshot(now = this.#now()) {
    const trip = this.activeTrip;
    const state = deriveState({
      link: this.#link,
      connectedAt: this.#connectedAt ?? 0,
      tracker: this.#tracker.state,
      trackerAt: this.#tracker.at,
      last: this.#last,
      offRoute: this.#offRoute,
      now,
      timing: this.#cfg.timing,
    });

    const isLive = state === 'live';
    const isPaused = !['live', 'offroute'].includes(state);
    const speed = isLive ? (this.#fix?.speed_kmh ?? 0) : null;
    const effectiveSpeed = etaSpeed(this.#speedEma);

    const distM = this.#matched?.dist_m ?? 0;
    const status = trip ? tripStatus(trip, distM, this.#speedEma ?? 0) : 'moving';
    const { stops, nextIndex } = trip && isLive
      ? stopEtas(trip, distM, status, effectiveSpeed)
      : { stops: (trip?.stops ?? []).map((s) => ({ stop: s, state: 'upcoming', eta_s: null })), nextIndex: -1 };

    return {
      state,
      isLive,
      isPaused,
      fix: this.#fix ? { ...this.#fix } : null,
      sats: this.#gps.sats,
      hdop: this.#gps.hdop,
      speed_kmh: speed,
      speedEma_kmh: this.#speedEma,
      heading: this.#heading,
      offRoute: this.#offRoute,
      direction: this.#direction,
      trip,
      stops,
      nextIndex,
      distM,
      lastUpdated: this.#last?.receivedAt || null,
    };
  }

  #onFix(event) {
    const prev = this.#fix;
    this.#fix = { lat: event.lat, lng: event.lng, speed_kmh: event.speed_kmh, at: event.at, receivedAt: event.receivedAt };
    this.#last = { kind: 'fix', at: event.at, receivedAt: event.receivedAt, live: event.live };
    this.#gps = { sats: event.sats, hdop: event.hdop };

    // Update Speed EMA
    if (event.speed_kmh != null) {
      if (this.#speedEma == null || !prev) {
        this.#speedEma = event.speed_kmh;
      } else {
        const dt = Math.max(0, (event.at - prev.at) / 1000);
        const alpha = 1 - Math.exp(-dt / SPEED_EMA_TAU_S);
        this.#speedEma += alpha * (event.speed_kmh - this.#speedEma);
      }
    }

    // Update Heading
    if (event.heading != null && (event.speed_kmh ?? 0) >= HEADING_MIN_KMH) {
      this.#heading = event.heading;
    } else if (prev) {
      const d = haversine(prev, this.#fix);
      if (d >= 5) {
        this.#heading = bearing([prev.lng, prev.lat], [this.#fix.lng, this.#fix.lat]);
      }
    }

    // Map Matching
    const line = this.#data?.route?.line;
    if (line) {
      const proj = projectOnto(line, this.#fix);
      this.#matched = proj;
      if (this.#offRoute) {
        if (proj.offset_m <= this.#cfg.gps.offRouteExitM) this.#offRoute = false;
      } else if (proj.offset_m >= this.#cfg.gps.offRouteEnterM) {
        this.#offRoute = true;
      }
    }

    // Slide interpolation setup
    if (prev && event.live) {
      const dtMs = event.receivedAt - prev.receivedAt;
      const dM = haversine(prev, this.#fix);
      if (dtMs > 0 && dtMs <= JUMP_GAP_MS && dM <= JUMP_DISTANCE_M) {
        this.#slide = {
          from: { lat: prev.lat, lng: prev.lng },
          to: { lat: this.#fix.lat, lng: this.#fix.lng },
          t0: event.receivedAt,
          dur: Math.min(dtMs, SLIDE_MAX_MS),
        };
        return;
      }
    }
    this.#slide = null;
  }
}

