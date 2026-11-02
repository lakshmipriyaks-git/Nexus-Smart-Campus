import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  Home,
  Shield,
  Radio,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
  Compass,
  Search,
  X,
  AlertTriangle,
  Wifi,
  WifiOff,
  Signal,
  Play,
  Satellite,
  Gauge
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getBuses, updateBusLocation, DEFAULT_KSSEM_BUSES } from '../services/campusUtilitiesService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../utils/constants';

import BusMapLibre from '../components/transit/BusMapLibre';
import { indexRoute, ALL_ROUTES, CAMPUS_LOCATIONS } from '../services/transit/transitData';
import { BusTracker } from '../services/transit/tracker';
import { GpsMqttProvider } from '../services/transit/gpsMqttProvider';
import { SimProvider } from '../services/transit/simProvider';
import { formatEta } from '../services/transit/eta';
import { haversine } from '../services/transit/geo';

// KSSEM Campus Coordinates
const KSSEM_CAMPUS = {
  name: 'KSSEM Campus (Main Gate)',
  lat: 12.85944,
  lng: 77.543706,
};

export default function BusTrackingPage() {
  const { getDomainUser, logoutDomain } = useAuth();
  const { darkMode } = useTheme();
  const isDark = darkMode || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const theme = isDark ? 'dark' : 'light';

  const user = getDomainUser('bustracking');
  const userRoleLower = (user?.role || '').toLowerCase();
  const isDriver = userRoleLower === 'driver' || user?.role === ROLES.DRIVER;

  // Operating Mode: 'demo' (deterministic simulation) vs 'live' (real MQTT stream)
  const [operatingMode, setOperatingMode] = useState('demo');
  const [selectedRouteId, setSelectedRouteId] = useState('S1');
  const [isFullView, setIsFullView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore fleet route buses for driver broadcast & phone directory
  const [buses, setBuses] = useState(DEFAULT_KSSEM_BUSES);

  // Selected bus information for current route
  const selectedBus = useMemo(() => {
    return (
      buses.find((b) => b.routeId === selectedRouteId || b.id === selectedRouteId) ||
      buses[0] || {
        busNumber: 'B01',
        driverName: 'Ramesh Gowda',
        driverPhone: '+91 98450 12345',
      }
    );
  }, [buses, selectedRouteId]);

  // Driver quick broadcast states
  const [driverStatus, setDriverStatus] = useState('On Time');
  const [driverNextStop, setDriverNextStop] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Transit Data for selected route
  const routeData = useMemo(() => indexRoute(selectedRouteId), [selectedRouteId]);

  // Tracking state from BusTracker
  const [snapshot, setSnapshot] = useState({
    state: 'connecting',
    isLive: false,
    isPaused: false,
    fix: null,
    sats: null,
    hdop: null,
    speed_kmh: null,
    heading: null,
    offRoute: false,
    stops: [],
    nextIndex: -1,
    distM: 0,
    lastUpdated: null,
  });

  const [busPosition, setBusPosition] = useState(null);

  // Refs for tracking engine lifecycle
  const trackerRef = useRef(null);
  const providerRef = useRef(null);

  // Setup tracking engine whenever operatingMode or routeData changes
  useEffect(() => {
    // Teardown previous provider
    if (providerRef.current) {
      providerRef.current.stop();
      providerRef.current = null;
    }

    let provider;
    if (operatingMode === 'live') {
      provider = new GpsMqttProvider({ busId: 'B01' });
    } else {
      provider = new SimProvider(routeData);
    }

    const tracker = new BusTracker(routeData, provider);
    trackerRef.current = tracker;
    providerRef.current = provider;

    provider.start();

    // Fast animation frame loop for smooth bus sliding
    let animId;
    const animLoop = () => {
      if (trackerRef.current) {
        const pos = trackerRef.current.positionAt();
        if (pos) setBusPosition(pos);
      }
      animId = requestAnimationFrame(animLoop);
    };
    animId = requestAnimationFrame(animLoop);

    // Snapshot tick loop at 1 Hz for UI indicators, ETAs and timestamps
    const timer = setInterval(() => {
      if (trackerRef.current) {
        setSnapshot(trackerRef.current.snapshot());
      }
    }, 1000);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(timer);
      provider.stop();
    };
  }, [operatingMode, selectedRouteId]);

  // Sync route data with tracker when route changes in demo mode
  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.setData(routeData);
    }
    if (operatingMode === 'demo' && providerRef.current?.setData) {
      providerRef.current.setData(routeData);
    }
  }, [routeData, operatingMode]);

  // Load Firestore buses for driver console
  useEffect(() => {
    const loadFleet = async () => {
      try {
        const data = await getBuses();
        if (data && data.length > 0) setBuses(data);
      } catch (e) {}
    };
    loadFleet();
  }, []);

  const activeTrip = snapshot.trip || routeData.trips?.out;
  const currentStop = snapshot.stops?.[snapshot.nextIndex] || snapshot.stops?.[0];
  const targetLocation = busPosition || (routeData.route?.stops?.[0] ? { lat: routeData.route.stops[0].lat, lng: routeData.route.stops[0].lng } : KSSEM_CAMPUS);

  const googleMapExternalUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${targetLocation.lat},${targetLocation.lng}`)}`;

  // Optional Viewer Geolocation (Requested on explicit user demand only)
  const [viewerLocation, setViewerLocation] = useState(null);
  const [isLocatingViewer, setIsLocatingViewer] = useState(false);

  const handleLocateViewer = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Device geolocation is not supported by your browser');
      return;
    }
    setIsLocatingViewer(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
        };
        setViewerLocation(coords);
        setIsLocatingViewer(false);
        toast.success('Your current location has been marked on the map');
      },
      (err) => {
        setIsLocatingViewer(false);
        if (err.code === 1) {
          toast.error('Location permission was denied in your browser settings');
        } else {
          toast.error('Unable to retrieve device location');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Find Nearest Stop to Viewer
  const nearestStopToViewer = useMemo(() => {
    if (!viewerLocation || !routeData?.route?.stops) return null;
    let minD = Infinity;
    let nearest = null;
    routeData.route.stops.forEach((s) => {
      const d = haversine(viewerLocation, { lat: s.lat, lng: s.lng });
      if (d < minD) {
        minD = d;
        nearest = { ...s, distance_m: d };
      }
    });
    return nearest;
  }, [viewerLocation, routeData]);

  // Formatters
  const formatDistance = (meters) => {
    if (meters == null || isNaN(meters)) return '--';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatAgo = (timestamp) => {
    if (!timestamp) return 'No fix yet';
    const diffSec = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.round(diffMin / 60)}h ago`;
  };

  // Connection State Derivation
  const isLiveOrDemo = operatingMode === 'demo' || snapshot.state === 'live';

  const connectionState = useMemo(() => {
    if (operatingMode === 'demo') {
      return {
        label: 'DEMO SIMULATION',
        tone: 'amber',
        statusKey: 'demo',
        description: 'Simulated deterministic GPS telemetry along verified OSRM road geometry.',
      };
    }
    switch (snapshot.state) {
      case 'live':
        return {
          label: 'LIVE',
          tone: 'emerald',
          statusKey: 'live',
          description: `Live hardware stream from ESP32 tracker via MQTT. Fix: ${formatAgo(snapshot.lastUpdated)}.`,
        };
      case 'connecting':
        return {
          label: 'CONNECTING',
          tone: 'blue',
          statusKey: 'connecting',
          description: 'Connecting to MQTT broker wss://broker.emqx.io:8084/mqtt...',
        };
      case 'nofix':
        return {
          label: 'WAITING FOR GPS',
          tone: 'amber',
          statusKey: 'nofix',
          description: 'ESP32 online; waiting for NEO-6M GPS satellite lock (fix=false).',
        };
      case 'lost':
        return {
          label: 'SIGNAL LOST',
          tone: 'amber',
          statusKey: 'lost',
          description: 'No GPS packet received for over 15 seconds. Arrival times are paused.',
        };
      case 'offline':
        return {
          label: 'TRACKER OFFLINE',
          tone: 'rose',
          statusKey: 'offline',
          description: 'ESP32 reported status offline via MQTT Last Will or connection dropped.',
        };
      case 'offroute':
        return {
          label: 'OFF ROUTE',
          tone: 'purple',
          statusKey: 'offroute',
          description: 'Vehicle location has deviated >150m from designated route corridor.',
        };
      default:
        return {
          label: 'STANDBY',
          tone: 'neutral',
          statusKey: 'unknown',
          description: 'Awaiting telemetry packet.',
        };
    }
  }, [operatingMode, snapshot.state, snapshot.lastUpdated]);

  // Hero ETA and Destination display
  const heroDisplay = useMemo(() => {
    if (operatingMode === 'demo') {
      return {
        mainEta: formatEta(currentStop?.eta_s) || '~3 min',
        subDest: `Next: ${currentStop?.stop?.name || 'KSSEM Main Gate'} · towards ${routeData.route?.to || 'KSSEM'}`,
        lastGpsUpdate: 'Simulated 1s tick',
        locationNote: 'Simulated Location (OSRM Route)',
      };
    }
    if (snapshot.state === 'live') {
      return {
        mainEta: formatEta(currentStop?.eta_s) || 'Arriving Now',
        subDest: `Next: ${currentStop?.stop?.name || 'KSSEM'} · towards ${routeData.route?.to || 'KSSEM'}`,
        lastGpsUpdate: snapshot.lastUpdated ? `Updated ${formatAgo(snapshot.lastUpdated)}` : 'Updated just now',
        locationNote: 'Live Hardware GPS Fix',
      };
    }
    if (snapshot.state === 'connecting') {
      return {
        mainEta: 'Connecting...',
        subDest: 'Establishing MQTT telemetry stream',
        lastGpsUpdate: 'Connecting to broker',
        locationNote: 'Awaiting hardware connection',
      };
    }
    if (snapshot.state === 'nofix') {
      return {
        mainEta: 'Waiting for GPS',
        subDest: 'ESP32 connected · searching for satellites',
        lastGpsUpdate: 'Fix searching',
        locationNote: 'Satellite lock in progress',
      };
    }
    if (snapshot.state === 'lost') {
      return {
        mainEta: 'Signal Lost',
        subDest: 'Arrival times paused (>15s without fix)',
        lastGpsUpdate: snapshot.lastUpdated ? `Last seen ${formatAgo(snapshot.lastUpdated)}` : 'Last seen earlier',
        locationNote: 'Showing Last Known Position',
      };
    }
    if (snapshot.state === 'offroute') {
      return {
        mainEta: 'Off Route',
        subDest: 'Vehicle deviated from designated corridor',
        lastGpsUpdate: snapshot.lastUpdated ? `Updated ${formatAgo(snapshot.lastUpdated)}` : 'Recent',
        locationNote: 'Showing Off-Route Position',
      };
    }
    return {
      mainEta: 'Tracker Offline',
      subDest: 'Arrival times paused (bus powered down)',
      lastGpsUpdate: snapshot.lastUpdated ? `Last seen ${formatAgo(snapshot.lastUpdated)}` : 'Hardware offline',
      locationNote: snapshot.lastUpdated ? 'Showing Last Known Position' : 'No position received yet',
    };
  }, [operatingMode, snapshot.state, snapshot.lastUpdated, currentStop, routeData]);

  // Filter routes for route directory search
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return ALL_ROUTES;
    const q = searchQuery.toLowerCase();
    return ALL_ROUTES.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.from.toLowerCase().includes(q) ||
        r.to.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#F5F6FF] dark:bg-[#070A11] text-[#202442] dark:text-slate-100 p-4 md:p-6 lg:p-8 font-sans transition-colors duration-200">
      {/* ── Top Bar ── */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#202442] dark:text-slate-300 hover:text-[#6558E8] dark:hover:text-white px-3.5 py-2 rounded-xl bg-white dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm transition-all"
        >
          <Home className="w-4 h-4 text-[#6558E8] dark:text-[#06B6D4]" />
          <span>← Campus Home</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-[#EEF1FC] dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-[#202442] dark:text-slate-200 font-medium">
              {user.name} ({user.role})
            </span>
            <button
              onClick={async () => {
                await logoutDomain('bustracking');
                toast.success('Signed out from Bus Tracking');
                window.location.href = '/login';
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 transition-colors font-medium shadow-sm"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* ── Operating Mode Switcher Bar ── */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex p-1 rounded-xl bg-[#EEF1FC] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setOperatingMode('demo');
                toast('Switched to Demo Simulation Mode', { icon: '🎮' });
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                operatingMode === 'demo'
                  ? 'bg-[#6558E8] text-white shadow-sm'
                  : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>DEMO MODE</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperatingMode('live');
                toast('Connecting to ESP32 MQTT Telemetry Stream...', { icon: '📡' });
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                operatingMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-[#59627E] dark:text-slate-400 hover:text-[#202442] dark:hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE MQTT</span>
            </button>
          </div>

          <div>
            <div className="text-xs font-bold text-[#202442] dark:text-white flex items-center gap-2 flex-wrap">
              <span>{operatingMode === 'demo' ? 'Deterministic Simulation Active' : 'ESP32 Live Hardware Stream'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                operatingMode === 'demo'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
              }`}>
                {operatingMode === 'demo' ? 'SIMULATED DATA' : 'HARDWARE FEED'}
              </span>
            </div>
            <p className="text-[11px] text-[#59627E] dark:text-slate-400 mt-0.5">
              {operatingMode === 'demo'
                ? 'Simulation runs purely in browser functions; coordinates are not physical hardware fixes.'
                : 'Subscribing to MQTT topic ksbus/v1/bus/B01/gps. Stale fixes (>15s) pause ETAs.'}
            </p>
          </div>
        </div>

        {/* Route Selector Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto w-full md:w-auto">
          <span className="text-xs font-semibold text-[#59627E] dark:text-slate-400 whitespace-nowrap">Active Route:</span>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full md:w-auto rounded-xl bg-[#EEF1FC] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] px-3 py-1.5 text-xs font-bold text-[#202442] dark:text-white focus:outline-none focus:border-[#6558E8] dark:focus:border-[#06B6D4]"
          >
            {ALL_ROUTES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}: {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Status Banner (Transparent State Representation) ── */}
      {operatingMode === 'demo' ? (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#202442] dark:text-amber-200 flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  DEMO MODE: DETERMINISTIC SIMULATION
                </strong>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  SIMULATION ACTIVE
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/80 mt-0.5">
                Simulated campus shuttle moving along real OSRM road geometry. No physical hardware connection is active.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className={`mb-6 p-4 rounded-2xl border text-xs shadow-sm flex items-center justify-between gap-3 ${
          snapshot.state === 'live'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : snapshot.state === 'connecting'
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200'
            : snapshot.state === 'nofix'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            : snapshot.state === 'lost'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border bg-white/40 dark:bg-black/20">
              {snapshot.state === 'live' && <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />}
              {snapshot.state === 'connecting' && <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />}
              {snapshot.state === 'nofix' && <Satellite className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {snapshot.state === 'lost' && <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
              {snapshot.state === 'offline' && <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
              {snapshot.state === 'offroute' && <AlertTriangle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xs font-black uppercase tracking-wider">
                  {snapshot.state === 'live' && 'HARDWARE GPS TELEMETRY: NOMINAL'}
                  {snapshot.state === 'connecting' && 'MQTT BROKER: CONNECTING'}
                  {snapshot.state === 'nofix' && 'GPS STATUS: SEARCHING FOR SATELLITE FIX'}
                  {snapshot.state === 'lost' && 'GPS SIGNAL LOST: STALE POSITION (>15s)'}
                  {snapshot.state === 'offline' && 'TRACKER OFFLINE: HARDWARE DISCONNECTED'}
                  {snapshot.state === 'offroute' && 'VEHICLE OFF ROUTE'}
                </strong>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border bg-white/50 dark:bg-black/30">
                  {snapshot.state}
                </span>
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {snapshot.state === 'live' && `Active hardware stream via MQTT topic ksbus/v1/bus/B01/gps. Fix timestamp: ${snapshot.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleTimeString() : 'Recent'}.`}
                {snapshot.state === 'connecting' && 'Opening WebSocket connection to wss://broker.emqx.io:8084/mqtt...'}
                {snapshot.state === 'nofix' && 'ESP32 is connected to MQTT, but NEO-6M GPS has not locked satellites (fix=false).'}
                {snapshot.state === 'lost' && 'No GPS packet received for over 15 seconds. Arrival ETAs are paused. Last known position displayed.'}
                {snapshot.state === 'offline' && 'ESP32 reported status "offline" via MQTT Last Will or connection dropped.'}
                {snapshot.state === 'offroute' && 'Bus location has deviated >150m from designated route corridor.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E6F2] dark:border-[#1E2D4A] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6558E8] dark:bg-[#06B6D4] text-white dark:text-[#070A11] shadow-sm flex-shrink-0">
            <Bus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#202442] dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Bus Tracking</span>
              <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                operatingMode === 'live' && snapshot.state === 'live'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] border-[#6558E8]/30 dark:border-[#06B6D4]/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${operatingMode === 'live' && snapshot.state === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-[#6558E8] dark:bg-[#06B6D4]'}`} />
                {operatingMode === 'live' ? 'LIVE MQTT' : 'DEMO MODE'}
              </span>
            </h1>
            <p className="text-xs text-[#59627E] dark:text-slate-400 mt-0.5">
              MapLibre Vector Fleet Map · OpenStreetMap / CARTO Road Geometry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullView(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#6558E8] hover:bg-[#5244d4] dark:bg-[#06B6D4] dark:hover:bg-[#22D3EE] text-white dark:text-[#070A11] shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all"
            title="Open Full Screen Vector Map"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Full View Map</span>
          </button>
        </div>
      </div>

      {/* ── Driver Broadcast Console (Only visible for Driver) ── */}
      {isDriver && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Driver Broadcast Console</h2>
                <p className="text-xs text-emerald-300/80">Manage route broadcast & transit status in real time</p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Active Driver Mode
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Assigned Route</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full rounded-xl bg-[#0D1527] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {ALL_ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code}: {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Operational Status</label>
              <select
                value={driverStatus}
                onChange={(e) => setDriverStatus(e.target.value)}
                className="w-full rounded-xl bg-[#0D1527] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="On Time">On Time (Normal)</option>
                <option value="Delayed">Delayed (Traffic / Weather)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Next Stop Landmark</label>
              <input
                type="text"
                value={driverNextStop}
                onChange={(e) => setDriverNextStop(e.target.value)}
                placeholder="e.g. Silk Board Junction"
                className="w-full rounded-xl bg-[#0D1527] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={broadcasting}
              onClick={async () => {
                setBroadcasting(true);
                try {
                  const updatedCoords = busPosition || KSSEM_CAMPUS;
                  await updateBusLocation('bus-1', updatedCoords);
                  toast.success('Route operational status broadcasted to student & staff consoles!');
                } catch (e) {
                  toast.error('Failed to update status');
                } finally {
                  setBroadcasting(false);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${broadcasting ? 'animate-spin' : ''}`} />
              <span>{broadcasting ? 'Broadcasting...' : 'Broadcast Route Update'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Main Interactive Map & Vehicle Status Split Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 items-start">
        {/* Left Column: MapLibre Map (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-[#E2E6F2] dark:border-[#1E2D4A] bg-white dark:bg-[#0D1527] overflow-hidden shadow-sm dark:shadow-2xl flex flex-col min-h-[520px]">
          {/* Map Header Strip */}
          <div className="p-4 border-b border-[#E2E6F2] dark:border-[#1E2D4A] flex flex-wrap items-center justify-between gap-3 bg-[#F8F9FE] dark:bg-[#0A0F1D]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/10 dark:text-[#22D3EE] border border-[#6558E8]/20 dark:border-[#06B6D4]/20">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#202442] dark:text-white flex items-center gap-2">
                  <span>Campus Route Map</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF1FC] dark:bg-slate-800 text-[#202442] dark:text-slate-300 border border-[#E2E6F2] dark:border-slate-700">
                    {routeData.route?.name}
                  </span>
                </div>
                <div className="text-[11px] text-[#59627E] dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono">
                    {heroDisplay.locationNote}: {targetLocation.lat.toFixed(4)}°, {targetLocation.lng.toFixed(4)}°
                  </span>
                  <span>·</span>
                  <span className="font-mono">
                    Heading: {busPosition?.heading ? `${Math.round(busPosition.heading)}°` : '0°'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={googleMapExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#59627E] dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-[#EEF1FC] dark:hover:bg-slate-700 border border-[#E2E6F2] dark:border-slate-700 transition-all shadow-sm"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#59627E] dark:text-slate-400" />
              </a>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="flex-1 w-full min-h-[460px]">
            <BusMapLibre
              routeData={routeData}
              busPosition={busPosition}
              busState={snapshot.state}
              theme={theme}
              isFullView={isFullView}
              onToggleFullView={() => setIsFullView(!isFullView)}
              viewerLocation={viewerLocation}
              onLocateViewer={handleLocateViewer}
              isLocatingViewer={isLocatingViewer}
            />
          </div>
        </div>

        {/* Right Column: Prominent Vehicle Status Panel & Stop Progression (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-sm dark:shadow-2xl">
            {/* 1. Header Bar: Bus Identifier, Route Badge, Connection State Tag */}
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#E2E6F2] dark:border-[#1E2D4A] flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE] border border-[#6558E8]/30 dark:border-[#06B6D4]/30 flex items-center justify-center font-bold">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[#202442] dark:text-white flex items-center gap-1.5">
                    <span>Bus {selectedBus?.busNumber || 'B01'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EEF1FC] dark:bg-slate-800 text-[#59627E] dark:text-slate-300 font-bold border border-[#E2E6F2] dark:border-slate-700">
                      {routeData.route?.code || 'S1'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#59627E] dark:text-slate-400 font-medium">
                    {routeData.route?.name}
                  </p>
                </div>
              </div>

              {/* Connection State Badge */}
              <div className="flex items-center gap-1.5">
                {operatingMode === 'demo' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>DEMO SIMULATION</span>
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold font-mono border ${
                    connectionState.tone === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : connectionState.tone === 'blue'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-cyan-400 border-blue-500/30'
                      : connectionState.tone === 'amber'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      connectionState.tone === 'emerald'
                        ? 'bg-emerald-500 animate-pulse'
                        : connectionState.tone === 'blue'
                        ? 'bg-blue-500 animate-pulse'
                        : connectionState.tone === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`} />
                    <span>{connectionState.label}</span>
                  </span>
                )}
              </div>
            </div>

            {/* 2. Hero Arrival Section */}
            <div className="p-4 rounded-2xl bg-[#F8F9FE] dark:bg-[#070A11] border border-[#E2E6F2] dark:border-[#1E2D4A] mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6558E8] dark:text-[#22D3EE]">
                  {isLiveOrDemo ? 'Estimated Arrival' : 'Tracker Status'}
                </span>
                <span className="text-[10px] font-mono text-[#7E87A2] dark:text-slate-400">
                  {operatingMode === 'demo' ? 'Simulated clock' : 'Hardware stream'}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl sm:text-3xl font-black font-display text-[#202442] dark:text-white">
                  {heroDisplay.mainEta}
                </div>
                <div className="text-xs font-semibold text-[#59627E] dark:text-slate-400 text-right">
                  {heroDisplay.subDest}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#E2E6F2] dark:border-[#1E2D4A] flex items-center justify-between text-[11px] text-[#59627E] dark:text-slate-400 flex-wrap gap-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                  <span>{heroDisplay.lastGpsUpdate}</span>
                </span>
                <span className="font-mono text-[10px] text-[#7E87A2] dark:text-slate-400">
                  {heroDisplay.locationNote}
                </span>
              </div>
            </div>

            {/* 3. Stat Tiles: 4 Core Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 1. Speed */}
              <div className="p-3 rounded-2xl bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#59627E] dark:text-slate-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                  <span>Speed</span>
                </div>
                <div className="text-lg font-black font-mono text-[#202442] dark:text-white">
                  {operatingMode === 'demo'
                    ? `${snapshot.speed_kmh != null ? snapshot.speed_kmh.toFixed(1) : '25.0'} km/h`
                    : snapshot.state === 'live'
                    ? `${snapshot.speed_kmh != null ? snapshot.speed_kmh.toFixed(1) : '0.0'} km/h`
                    : '--'}
                </div>
              </div>

              {/* 2. GPS Satellites */}
              <div className="p-3 rounded-2xl bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#59627E] dark:text-slate-400 mb-1">
                  <Satellite className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                  <span>GPS Satellites</span>
                </div>
                <div className="text-lg font-black font-mono text-[#202442] dark:text-white">
                  {operatingMode === 'demo'
                    ? '8 locked (sim)'
                    : snapshot.state === 'live'
                    ? `${snapshot.sats ?? 0} locked`
                    : snapshot.state === 'nofix'
                    ? `${snapshot.sats ?? 0} searching`
                    : '--'}
                </div>
              </div>

              {/* 3. Distance Remaining */}
              <div className="p-3 rounded-2xl bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#59627E] dark:text-slate-400 mb-1">
                  <Compass className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                  <span>Distance Left</span>
                </div>
                <div className="text-lg font-black font-mono text-[#202442] dark:text-white">
                  {operatingMode === 'demo'
                    ? `${formatDistance(Math.max(0, (routeData.route?.distance_m || 2578) - (snapshot.distM || 0)))} (sim)`
                    : snapshot.state === 'live'
                    ? formatDistance(Math.max(0, (routeData.route?.distance_m || 2578) - (snapshot.distM || 0)))
                    : '-- (paused)'}
                </div>
              </div>

              {/* 4. Stops Remaining */}
              <div className="p-3 rounded-2xl bg-[#EEF1FC] dark:bg-[#0A0F1D] border border-[#E2E6F2] dark:border-[#1E2D4A]">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#59627E] dark:text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#6558E8] dark:text-[#06B6D4]" />
                  <span>Stops Left</span>
                </div>
                <div className="text-lg font-black font-mono text-[#202442] dark:text-white">
                  {isLiveOrDemo
                    ? `${snapshot.stops.filter((s) => s.state !== 'passed').length} remaining`
                    : '-- (paused)'}
                </div>
              </div>
            </div>

            {/* 4. Optional Viewer Geolocation "Near You" Card */}
            {viewerLocation ? (
              <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-[#06B6D4]/10 border border-blue-500/25 dark:border-[#06B6D4]/30 flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-[#22D3EE]">
                      Nearest Stop to You
                    </div>
                    <div className="text-xs font-bold text-[#202442] dark:text-white">
                      {nearestStopToViewer ? nearestStopToViewer.name : 'Calculating route proximity...'}
                    </div>
                  </div>
                </div>
                {nearestStopToViewer && (
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-[#22D3EE]">
                      ~{formatDistance(nearestStopToViewer.distance_m)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">from your device</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleLocateViewer}
                  disabled={isLocatingViewer}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl border border-dashed border-[#6558E8]/40 dark:border-[#06B6D4]/40 hover:bg-[#6558E8]/5 dark:hover:bg-[#06B6D4]/5 text-xs font-semibold text-[#6558E8] dark:text-[#22D3EE] transition-all"
                >
                  <MapPin className={`w-3.5 h-3.5 ${isLocatingViewer ? 'animate-bounce' : ''}`} />
                  <span>{isLocatingViewer ? 'Acquiring device GPS...' : 'Find Nearest Stop to My Location'}</span>
                </button>
              </div>
            )}

            {/* 5. Stop Progression Timeline */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#59627E] dark:text-slate-400">
                  Route Stop Progression
                </h3>
                <span className="text-[10px] font-mono text-[#7E87A2] dark:text-slate-500">
                  {routeData.route?.stops?.length || 4} total stops
                </span>
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-[#E2E6F2] dark:border-[#1E2D4A] ml-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {snapshot.stops.map((item, idx) => {
                  const isCurrent = item.state === 'current';
                  const isPassed = item.state === 'passed';
                  return (
                    <div key={idx} className="relative flex items-center justify-between group">
                      <div className={`absolute -left-[23px] w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isCurrent
                          ? 'bg-[#6558E8] dark:bg-[#06B6D4] border-white dark:border-[#0D1527] ring-4 ring-[#6558E8]/20 animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500 border-white dark:border-[#0D1527]'
                          : 'bg-white dark:bg-[#0D1527] border-slate-300 dark:border-slate-600'
                      }`} />
                      <div>
                        <div className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[#6558E8] dark:text-[#22D3EE]'
                            : isPassed
                            ? 'text-[#59627E] dark:text-slate-400 line-through'
                            : 'text-[#202442] dark:text-slate-200'
                        }`}>
                          {item.stop?.name}
                        </div>
                        <div className="text-[10px] text-[#7E87A2] dark:text-slate-500">
                          {isPassed ? 'Passed' : isCurrent ? 'Approaching' : 'Upcoming'}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#59627E] dark:text-slate-300">
                        {isPassed ? '✓' : isLiveOrDemo ? formatEta(item.eta_s) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!isLiveOrDemo && (
                <p className="mt-3 text-[10px] text-amber-700 dark:text-amber-400/80 bg-amber-500/10 p-2 rounded-xl text-center font-medium">
                  Arrival times paused until active GPS fix is restored.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fleet Route Directory Grid ── */}
      <div>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#202442] dark:text-white">Campus Fleet Routes</h2>
            <p className="text-xs text-[#59627E] dark:text-slate-400">
              Select any regional transit corridor to view stops, roadmap, and vehicle progress
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search route or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-[#0D1527] border border-[#E2E6F2] dark:border-[#1E2D4A] text-xs text-[#202442] dark:text-white focus:outline-none focus:border-[#6558E8]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((r) => {
            const isSelected = r.id === selectedRouteId;
            return (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedRouteId(r.id);
                  toast.success(`Tracking switched to ${r.name}`);
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-white dark:bg-[#0D1527] border-[#6558E8] dark:border-[#06B6D4] ring-2 ring-[#6558E8]/20 dark:ring-[#06B6D4]/20 shadow-md'
                    : 'bg-white dark:bg-[#0D1527] border-[#E2E6F2] dark:border-[#1E2D4A] hover:border-[#6558E8]/50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#6558E8]/10 text-[#6558E8] dark:bg-[#06B6D4]/15 dark:text-[#22D3EE]">
                    {r.code}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {r.stopsCount} stops
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#202442] dark:text-white mb-1">
                  {r.name}
                </h4>
                <div className="text-xs text-[#59627E] dark:text-slate-400 flex items-center justify-between">
                  <span>{r.from}</span>
                  <span>→</span>
                  <span>{r.to}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Full View Modal ── */}
      {isFullView && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-4 md:p-6 animate-fadeIn">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Full View Route Navigator</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {routeData.route?.code}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  {routeData.route?.name} · {snapshot.isLive ? 'Live Hardware Stream' : 'Demo Simulation Active'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFullView(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg"
            >
              <X className="w-4 h-4" />
              <span>Exit Full View</span>
            </button>
          </div>

          {/* Full Screen Map */}
          <div className="flex-1 w-full mt-4 rounded-2xl overflow-hidden relative border border-slate-800">
            <BusMapLibre
              routeData={routeData}
              busPosition={busPosition}
              busState={snapshot.state}
              theme="dark"
              isFullView={true}
              onToggleFullView={() => setIsFullView(false)}
              viewerLocation={viewerLocation}
              onLocateViewer={handleLocateViewer}
              isLocatingViewer={isLocatingViewer}
            />
          </div>
        </div>
      )}
    </div>
  );
}
