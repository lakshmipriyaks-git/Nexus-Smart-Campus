// NEXUS SMART CAMPUS — Deterministic Transit Simulation Provider (DEMO MODE)
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import { buildLine, pointAt } from './geo.js';

export class SimProvider {
  #data;
  #now;
  #timer = null;
  #t0;
  #listeners = new Set();
  #seq = 1;

  constructor(data, now = () => Date.now()) {
    this.#data = data;
    this.#now = now;
    this.#t0 = now();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  emit(event) {
    for (const listener of this.#listeners) {
      try {
        listener(event);
      } catch (e) {
        console.debug('Sim listener error:', e);
      }
    }
  }

  setData(data) {
    this.#data = data;
    this.#t0 = this.#now();
  }

  start() {
    if (this.#timer) return;
    this.emit({ type: 'link', state: 'connected' });
    this.emit({ type: 'tracker', state: 'online', receivedAt: this.#now() });
    this.#emitFix();
    this.#timer = setInterval(() => this.#emitFix(), 2000);
  }

  stop() {
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #emitFix() {
    const now = this.#now();
    const elapsedS = (now - this.#t0) / 1000;
    const line = this.#data?.route?.line;
    if (!line || line.length === 0) return;

    // Simulate motion along route at 25 km/h (~6.94 m/s) with turnarounds
    const speedMs = 25 / 3.6;
    const totalDist = line.length;
    const cycleDist = totalDist * 2; // out and back
    const posInCycle = (elapsedS * speedMs) % cycleDist;

    let distOnLine = posInCycle <= totalDist ? posInCycle : (cycleDist - posInCycle);
    const p = pointAt(line, distOnLine);
    const heading = posInCycle <= totalDist ? p.heading : (p.heading + 180) % 360;

    this.emit({
      type: 'fix',
      lat: p.lat,
      lng: p.lng,
      speed_kmh: 25.0,
      heading,
      sats: 8,
      hdop: 1.1,
      at: now,
      receivedAt: now,
      live: true,
      seq: this.#seq++,
      demo: true,
    });
  }
}

