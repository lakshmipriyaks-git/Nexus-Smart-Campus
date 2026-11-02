// NEXUS SMART CAMPUS — Transit GPS Message Validation & Ordering
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import { TRANSIT_CONFIG } from './config.js';

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const inRange = (v, lo, hi) => isNum(v) && v >= lo && v <= hi;

/**
 * Validates and sanitizes raw MQTT payloads.
 * Drops malformed or forged payloads; never throws.
 *
 * Wire contract with firmware:
 * {
 *   "bus": "B01",
 *   "lat": 12.879576,
 *   "lng": 77.545703,
 *   "speed_kmh": 21.4,
 *   "heading": 184.0,
 *   "sats": 8,
 *   "hdop": 1.1,
 *   "fix": true,
 *   "ts": 1730450000,
 *   "seq": 1234
 * }
 */
export function parseGpsMessage(payload, expectedBus = TRANSIT_CONFIG.bus.id, bounds = TRANSIT_CONFIG.gps.bounds) {
  let raw;
  try {
    raw = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch {
    return { ok: false, reason: 'not JSON' };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, reason: 'not an object' };
  }
  if (raw.bus !== expectedBus) {
    return { ok: false, reason: `wrong bus id ${JSON.stringify(raw.bus)}` };
  }
  if (typeof raw.fix !== 'boolean') {
    return { ok: false, reason: 'fix flag missing' };
  }
  if (!Number.isInteger(raw.seq) || raw.seq < 0) {
    return { ok: false, reason: 'bad seq' };
  }
  if (!Number.isInteger(raw.ts) || raw.ts < 0) {
    return { ok: false, reason: 'bad ts' };
  }

  const sats = inRange(raw.sats, 0, 64) ? Math.round(raw.sats) : null;
  const hdop = inRange(raw.hdop, 0, 99.9) ? raw.hdop : null;
  const msg = {
    bus: raw.bus,
    fix: raw.fix,
    seq: raw.seq,
    ts: raw.ts,
    sats,
    hdop,
  };

  // If fix is false, coordinates are ignored (device is running, but no satellite fix yet)
  if (!raw.fix) {
    return { ok: true, msg };
  }

  if (!inRange(raw.lat, -90, 90) || !inRange(raw.lng, -180, 180)) {
    return { ok: false, reason: 'lat/lng out of range' };
  }
  if (!inRange(raw.lat, bounds.minLat, bounds.maxLat) || !inRange(raw.lng, bounds.minLng, bounds.maxLng)) {
    return { ok: false, reason: 'outside the Bengaluru sanity box' };
  }
  if (!inRange(raw.speed_kmh, 0, 150)) {
    return { ok: false, reason: 'speed out of range' };
  }

  const heading = inRange(raw.heading, 0, 360) ? raw.heading % 360 : null;
  return {
    ok: true,
    msg: {
      ...msg,
      lat: raw.lat,
      lng: raw.lng,
      speed_kmh: raw.speed_kmh,
      heading,
    },
  };
}

/**
 * MessageOrder handles out-of-order packets and ESP32 reboot sequence resets.
 */
export class MessageOrder {
  static REBOOT_SEQ_MAX = 5;
  #lastSeq = -1;
  #lastTs = 0;

  accept(msg) {
    if (this.#lastSeq < 0) return this.#take(msg);
    if (msg.ts > 0 && this.#lastTs > 0) {
      if (msg.ts > this.#lastTs || (msg.ts === this.#lastTs && msg.seq > this.#lastSeq)) {
        return this.#take(msg);
      }
      return false;
    }
    if (msg.seq > this.#lastSeq || msg.seq <= MessageOrder.REBOOT_SEQ_MAX) {
      return this.#take(msg);
    }
    return false;
  }

  reset() {
    this.#lastSeq = -1;
    this.#lastTs = 0;
  }

  #take(msg) {
    this.#lastSeq = msg.seq;
    if (msg.ts > 0) this.#lastTs = msg.ts;
    return true;
  }
}

