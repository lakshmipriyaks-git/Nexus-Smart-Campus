// NEXUS SMART CAMPUS — Transit Hardware & Tracking Integration Test Suite
// Verifies message validation, order handling, state machine transitions, map matching, and ETAs.

import test from 'node:test';
import assert from 'node:assert/strict';

import { TRANSIT_CONFIG } from '../src/services/transit/config.js';
import { parseGpsMessage, MessageOrder } from '../src/services/transit/gpsMessage.js';
import { haversine, buildLine, pointAt, projectOnto } from '../src/services/transit/geo.js';
import { stopEtas, etaSpeed, tripStatus, formatEta } from '../src/services/transit/eta.js';
import { deriveState, BusTracker } from '../src/services/transit/tracker.js';
import { indexRoute } from '../src/services/transit/transitData.js';

// ----------------------------------------------------
// 1. Message Validation Tests
// ----------------------------------------------------
test('1. Valid GPS message that satisfies contract is accepted', () => {
  const payload = JSON.stringify({
    bus: 'B01',
    lat: 12.879576,
    lng: 77.545703,
    speed_kmh: 21.4,
    heading: 184.0,
    sats: 8,
    hdop: 1.1,
    fix: true,
    ts: 1730450000,
    seq: 1234,
  });

  const parsed = parseGpsMessage(payload, 'B01');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.msg.bus, 'B01');
  assert.equal(parsed.msg.lat, 12.879576);
  assert.equal(parsed.msg.lng, 77.545703);
  assert.equal(parsed.msg.speed_kmh, 21.4);
  assert.equal(parsed.msg.heading, 184.0);
  assert.equal(parsed.msg.sats, 8);
  assert.equal(parsed.msg.hdop, 1.1);
  assert.equal(parsed.msg.fix, true);
});

test('2. Invalid coordinates outside Bengaluru bounding box are rejected', () => {
  const payloadLondon = JSON.stringify({
    bus: 'B01',
    lat: 51.5074,
    lng: -0.1278,
    speed_kmh: 30,
    heading: 90,
    sats: 8,
    hdop: 1.0,
    fix: true,
    ts: 1730450000,
    seq: 1,
  });
  const res1 = parseGpsMessage(payloadLondon, 'B01');
  assert.equal(res1.ok, false);
  assert.match(res1.reason, /outside the Bengaluru sanity box/);

  const payloadNan = JSON.stringify({
    bus: 'B01',
    lat: 'not-a-number',
    lng: 77.5,
    speed_kmh: 20,
    fix: true,
    ts: 1730450000,
    seq: 2,
  });
  const res2 = parseGpsMessage(payloadNan, 'B01');
  assert.equal(res2.ok, false);
});

test('3. GPS fix=false is accepted and invalid coordinates are discarded', () => {
  const payloadNoFix = JSON.stringify({
    bus: 'B01',
    lat: 0.0,
    lng: 0.0,
    speed_kmh: 0,
    heading: 0,
    sats: 2,
    hdop: 15.0,
    fix: false,
    ts: 1730450000,
    seq: 50,
  });
  const parsed = parseGpsMessage(payloadNoFix, 'B01');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.msg.fix, false);
  assert.equal(parsed.msg.lat, undefined);
  assert.equal(parsed.msg.sats, 2);
});

// ----------------------------------------------------
// 2. Message Ordering & Reboot Handling Tests
// ----------------------------------------------------
test('4. MessageOrder handles reboot counter reset & drops late duplicates', () => {
  const order = new MessageOrder();

  assert.equal(order.accept({ seq: 10, ts: 100 }), true);
  assert.equal(order.accept({ seq: 11, ts: 102 }), true);
  // Duplicate or older timestamp dropped
  assert.equal(order.accept({ seq: 9, ts: 98 }), false);
  assert.equal(order.accept({ seq: 10, ts: 100 }), false);

  // ESP32 Reboot scenario: seq resets to 0, but GPS timestamp moves forward
  assert.equal(order.accept({ seq: 1, ts: 104 }), true);
});

// ----------------------------------------------------
// 3. State Machine & Staleness Tests
// ----------------------------------------------------
test('5. DeriveState handles connecting, live, stale lost, and offline states', () => {
  const timing = TRANSIT_CONFIG.timing;
  const now = 100000;

  // Connecting state
  const sConnecting = deriveState({
    link: 'connecting',
    connectedAt: 0,
    tracker: 'unknown',
    trackerAt: null,
    last: null,
    offRoute: false,
    now,
    timing,
  });
  assert.equal(sConnecting, 'connecting');

  // Live state
  const sLive = deriveState({
    link: 'connected',
    connectedAt: now - 5000,
    tracker: 'online',
    trackerAt: now - 5000,
    last: { kind: 'fix', at: now - 1000, receivedAt: now - 1000, live: true },
    offRoute: false,
    now,
    timing,
  });
  assert.equal(sLive, 'live');

  // Stale position (>15s timeout)
  const sStale = deriveState({
    link: 'connected',
    connectedAt: now - 30000,
    tracker: 'online',
    trackerAt: now - 30000,
    last: { kind: 'fix', at: now - 16000, receivedAt: now - 16000, live: true },
    offRoute: false,
    now,
    timing,
  });
  assert.equal(sStale, 'lost');

  // Offline via MQTT Last Will
  const sOffline = deriveState({
    link: 'connected',
    connectedAt: now - 30000,
    tracker: 'offline',
    trackerAt: now - 500,
    last: { kind: 'fix', at: now - 1000, receivedAt: now - 1000, live: false },
    offRoute: false,
    now,
    timing,
  });
  assert.equal(sOffline, 'offline');
});

// ----------------------------------------------------
// 4. Geometry & Route Matching Tests
// ----------------------------------------------------
test('6. Haversine distance correctly calculates KSIT to KSSEM distance', () => {
  const ksit = { lat: 12.879476, lng: 77.544439 };
  const kssem = { lat: 12.85944, lng: 77.543706 };
  const dist = haversine(ksit, kssem);
  assert.ok(dist >= 2100 && dist <= 2400, `Expected ~2.2km, got ${dist}`);
});

test('7. Route projection and line slicing on KSIT-KSSEM shuttle', () => {
  const routeData = indexRoute('S1');
  const line = routeData.route.line;
  assert.ok(line.length > 2000, 'Shuttle route should be >2km');

  const ptNearKsit = { lat: 12.8795, lng: 77.5456 };
  const proj = projectOnto(line, ptNearKsit);
  assert.ok(proj.dist_m >= 0 && proj.dist_m <= 100, 'Should snap near start of line');
  assert.ok(proj.offset_m <= 30, 'Should be within 30m of road');
});

// ----------------------------------------------------
// 5. ETA & Speed Smoothing Tests
// ----------------------------------------------------
test('8. ETA calculations scale with road distance and pause when stationary', () => {
  const routeData = indexRoute('S1');
  const trip = routeData.trips.out;

  const etaMoving = stopEtas(trip, 500, 'moving', 25);
  assert.ok(etaMoving.stops.length > 0);
  assert.equal(etaMoving.stops[0].state, 'passed');
  assert.ok(etaMoving.stops[etaMoving.stops.length - 1].eta_s > 0, 'Terminus ETA should be positive');

  const speedStopped = etaSpeed(1.0);
  assert.equal(speedStopped, TRANSIT_CONFIG.eta.typicalSpeedKmh);

  assert.equal(formatEta(180), '~3 min');
  assert.equal(formatEta(30), 'Arriving');
  assert.equal(formatEta(null), '—');
});

// ----------------------------------------------------
// 6. Moving vs Stationary Bus State & Reconnection Tests
// ----------------------------------------------------
test('9. BusTracker handles moving vs stationary fixes and updates speed/heading', () => {
  const routeData = indexRoute('S1');
  let listener = null;
  const mockProvider = {
    subscribe: (fn) => { listener = fn; },
  };

  let clock = 1000000;
  const tracker = new BusTracker(routeData, mockProvider, { now: () => clock });

  listener({ type: 'link', state: 'connected' });
  listener({ type: 'tracker', state: 'online', receivedAt: clock });

  // 1st Fix: Stationary bus at KSIT (speed = 0)
  clock += 2000;
  listener({
    type: 'fix',
    lat: 12.879576,
    lng: 77.545703,
    speed_kmh: 0.0,
    heading: 0,
    sats: 8,
    hdop: 1.0,
    at: clock,
    receivedAt: clock,
    live: true,
  });

  let snap = tracker.snapshot(clock);
  assert.equal(snap.state, 'live');
  assert.equal(snap.speed_kmh, 0.0);

  // 2nd Fix: Bus moves south along Kanakapura road (speed = 28 km/h, heading = 184 deg)
  clock += 2000;
  listener({
    type: 'fix',
    lat: 12.875997,
    lng: 77.544146,
    speed_kmh: 28.0,
    heading: 184.0,
    sats: 9,
    hdop: 0.9,
    at: clock,
    receivedAt: clock,
    live: true,
  });

  snap = tracker.snapshot(clock);
  assert.equal(snap.state, 'live');
  assert.equal(snap.speed_kmh, 28.0);
  assert.equal(snap.heading, 184.0);
  assert.ok(snap.distM > 0, 'Distance along route should have increased');

  // Disconnect & Reconnect handling
  listener({ type: 'link', state: 'reconnecting' });
  snap = tracker.snapshot(clock);
  assert.equal(snap.state, 'live'); // Last position kept while reconnecting

  // Signal lost after 16 seconds without fixes
  clock += 16000;
  snap = tracker.snapshot(clock);
  assert.equal(snap.state, 'lost');
  assert.equal(snap.isPaused, true);
});
