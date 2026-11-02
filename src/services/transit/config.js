// NEXUS SMART CAMPUS — Transit & Hardware Tracking Configuration
// Reference: https://github.com/coolvnod/ks-bus-tracker.git

export const TRANSIT_CONFIG = Object.freeze({
  bus: {
    id: 'B01',
    routeId: 'S1',
  },

  routing: {
    url: typeof import.meta !== 'undefined' && import.meta.env?.VITE_OSRM_ROUTING_URL
      ? import.meta.env.VITE_OSRM_ROUTING_URL
      : 'https://router.project-osrm.org/route/v1/driving',
    arrivalRadiusM: 90,
    rerouteAfterM: 100,
    minRequestMs: 15_000,
    retryMs: 30_000,
    requestTimeoutMs: 10_000,
  },

  mqtt: {
    // Browsers can only connect to MQTT via WebSockets (wss://).
    url: typeof import.meta !== 'undefined' && import.meta.env?.VITE_MQTT_BROKER_URL
      ? import.meta.env.VITE_MQTT_BROKER_URL
      : 'wss://broker.emqx.io:8084/mqtt',
    username: typeof import.meta !== 'undefined' && import.meta.env?.VITE_MQTT_USERNAME
      ? import.meta.env.VITE_MQTT_USERNAME
      : '',
    password: typeof import.meta !== 'undefined' && import.meta.env?.VITE_MQTT_PASSWORD
      ? import.meta.env.VITE_MQTT_PASSWORD
      : '',
    topicPrefix: typeof import.meta !== 'undefined' && import.meta.env?.VITE_MQTT_TOPIC_PREFIX
      ? import.meta.env.VITE_MQTT_TOPIC_PREFIX
      : 'ksbus/v1/bus',
    reconnectMinMs: 1_000,
    reconnectMaxMs: 15_000,
  },

  timing: {
    staleAfterMs: 15_000,    // no message for >15 s = "Signal Lost / Stale"
    noDataGraceMs: 6_000,    // connected but nothing received for >6 s = "Tracker Offline"
    connectingHintMs: 10_000, // retry hint
  },

  gps: {
    // Sanity boundary box around Bengaluru. Fixes outside are discarded as spoofed or invalid.
    bounds: {
      minLat: 12.7,
      maxLat: 13.3,
      minLng: 77.3,
      maxLng: 77.9,
    },
    offRouteEnterM: 150,     // deviation > 150 m = "Off Route"
    offRouteExitM: 120,      // return within 120 m to clear off-route (hysteresis)
    metresPerHdop: 5,        // rough horizontal error estimate = HDOP x 5 m (NEO-6M)
  },

  eta: {
    typicalSpeedKmh: 20,     // Bengaluru city bus running speed including traffic signals
    dwellS: 30,              // typical passenger boarding dwell per stop ahead
  },
});

/** Return MQTT topics for a given bus ID */
export function getTopicsForBus(busId = TRANSIT_CONFIG.bus.id, prefix = TRANSIT_CONFIG.mqtt.topicPrefix) {
  return {
    gps: `${prefix}/${busId}/gps`,
    status: `${prefix}/${busId}/status`,
  };
}

