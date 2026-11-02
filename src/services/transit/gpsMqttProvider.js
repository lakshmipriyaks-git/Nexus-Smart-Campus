// NEXUS SMART CAMPUS — MQTT Live Telemetry Provider (WebSockets)
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

import mqtt from 'mqtt';
import { TRANSIT_CONFIG, getTopicsForBus } from './config.js';
import { parseGpsMessage, MessageOrder } from './gpsMessage.js';

export class GpsMqttProvider {
  #config;
  #now;
  #busId;
  #topics;
  #client = null;
  #order = new MessageOrder();
  #retryTimer = null;
  #attempt = 0;
  #stopped = false;
  #listeners = new Set();

  constructor({
    config = TRANSIT_CONFIG,
    busId = TRANSIT_CONFIG.bus.id,
    now = () => Date.now(),
  } = {}) {
    this.#config = config;
    this.#busId = busId;
    this.#now = now;
    this.#topics = getTopicsForBus(busId, config.mqtt.topicPrefix);
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
        console.debug('Listener error:', e);
      }
    }
  }

  start() {
    this.#stopped = false;
    this.emit({ type: 'link', state: 'connecting' });

    const { url, username, password } = this.#config.mqtt;

    try {
      this.#client = mqtt.connect(url, {
        clientId: `nexus-bus-web-${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        keepalive: 30,
        connectTimeout: 10_000,
        reconnectPeriod: 0, // Manual exponential backoff
        ...(username ? { username, password } : {}),
      });

      this.#client.on('connect', () => this.#onConnect());
      this.#client.on('close', () => this.#onClose());
      this.#client.on('error', (err) => console.debug('MQTT error:', err?.message ?? err));
      this.#client.on('message', (topic, payload, packet) =>
        this.handleMessage(topic, payload.toString(), Boolean(packet?.retain))
      );
    } catch (err) {
      console.error('MQTT initialization failure:', err);
      this.emit({ type: 'link', state: 'failed' });
    }
  }

  stop() {
    this.#stopped = true;
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
    this.#client?.end(true);
    this.#client = null;
  }

  handleMessage(topic, payload, retained) {
    const receivedAt = this.#now();
    if (topic === this.#topics.status) {
      this.#onStatus(payload.trim(), receivedAt);
    } else if (topic === this.#topics.gps) {
      this.#onGps(payload, retained, receivedAt);
    }
  }

  #onConnect() {
    this.#attempt = 0;
    this.#client.subscribe([this.#topics.gps, this.#topics.status], { qos: 0 }, (err) => {
      if (err) console.debug('MQTT subscribe failed:', err.message);
    });
    this.emit({ type: 'link', state: 'connected' });
  }

  #onClose() {
    if (this.#stopped) return;
    this.emit({ type: 'link', state: 'reconnecting' });
    this.#scheduleRetry();
  }

  #scheduleRetry() {
    if (this.#retryTimer) return;
    const { reconnectMinMs, reconnectMaxMs } = this.#config.mqtt;
    const base = Math.min(reconnectMinMs * 2 ** this.#attempt, reconnectMaxMs);
    const delay = Math.round(base * (0.8 + Math.random() * 0.4));
    this.#attempt++;
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = null;
      if (!this.#stopped) this.start();
    }, delay);
  }

  #onStatus(status, receivedAt) {
    if (status === 'online' || status === 'offline') {
      this.emit({ type: 'tracker', state: status, receivedAt });
    }
  }

  #onGps(payload, retained, receivedAt) {
    const parsed = parseGpsMessage(payload, this.#busId, this.#config.gps.bounds);
    if (!parsed.ok) {
      console.debug('Dropped GPS message:', parsed.reason);
      return;
    }

    const { msg } = parsed;
    if (!this.#order.accept(msg)) {
      console.debug('Dropped out-of-order GPS packet:', msg.seq);
      return;
    }

    const at = msg.ts > 0 ? msg.ts * 1000 : null;
    const live = !retained && at != null && Math.abs(receivedAt - at) <= this.#config.timing.staleAfterMs;

    if (!msg.fix) {
      this.emit({
        type: 'nofix',
        sats: msg.sats,
        hdop: msg.hdop,
        at,
        receivedAt,
        live,
      });
      return;
    }

    this.emit({
      type: 'fix',
      lat: msg.lat,
      lng: msg.lng,
      speed_kmh: msg.speed_kmh,
      heading: msg.heading,
      sats: msg.sats,
      hdop: msg.hdop,
      at,
      receivedAt,
      live,
    });
  }
}

