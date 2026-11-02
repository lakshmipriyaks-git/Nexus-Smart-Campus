import React, { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, AttributionControl, setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, Maximize2, Minimize2, Navigation, MapPin } from 'lucide-react';
import { getBounds } from '../../services/transit/geo';

if (typeof window !== 'undefined' && setWorkerUrl) {
  try {
    setWorkerUrl(maplibreWorkerUrl);
  } catch (e) {
    console.warn('MapLibre worker setup notice:', e);
  }
}

const STYLE_URLS = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

export default function BusMapLibre({
  routeData,
  busPosition,
  busState = 'connecting',
  theme = 'light',
  isFullView = false,
  onToggleFullView,
  selectedBus,
  viewerLocation = null,
  onLocateViewer = null,
  isLocatingViewer = false,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const busMarkerElRef = useRef(null);
  const viewerMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const campusMarkersRef = useRef([]);
  const [followBus, setFollowBus] = useState(true);
  const [styleLoaded, setStyleLoaded] = useState(false);

  const themeRef = useRef(theme);
  const routeDataRef = useRef(routeData);
  themeRef.current = theme;
  routeDataRef.current = routeData;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialStyle = STYLE_URLS[theme] || STYLE_URLS.light;
    const map = new Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [77.5447, 12.8718], // KSSEM Kanakapura Road
      zoom: 13,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: false }), 'bottom-left');

    map.on('style.load', () => {
      setStyleLoaded(true);
      addRouteLayers(map, routeDataRef.current, themeRef.current);
      updateStopMarkers(map, routeDataRef.current);
    });

    map.on('dragstart', () => {
      setFollowBus(false);
    });

    mapRef.current = map;

    // Create animated DOM Bus Marker
    const busEl = document.createElement('div');
    busEl.className = 'nexus-bus-marker relative flex items-center justify-center cursor-pointer transition-transform duration-300';
    busEl.innerHTML = `
      <div class="bus-outer relative w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-[#0D1527] shadow-xl border-2 border-[#6558E8] dark:border-[#06B6D4] transition-colors">
        <div class="bus-heading-arrow absolute -top-1.5 w-3 h-3 bg-[#6558E8] dark:bg-[#06B6D4] rotate-45 rounded-xs transform -translate-y-0.5"></div>
        <svg class="w-6 h-6 text-[#6558E8] dark:text-[#22D3EE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="4" y="3" width="16" height="15" rx="3.5"></rect>
          <path d="M4 11h16"></path>
          <path d="M7.5 21v-3M16.5 21v-3"></path>
          <circle cx="8.5" cy="14.5" r="1" fill="currentColor"></circle>
          <circle cx="15.5" cy="14.5" r="1" fill="currentColor"></circle>
        </svg>
      </div>
      <div class="bus-pulse-ring absolute -inset-2 rounded-full border-2 border-[#6558E8]/40 dark:border-[#06B6D4]/40 animate-ping pointer-events-none"></div>
    `;

    busMarkerElRef.current = busEl;
    const marker = new Marker({
      element: busEl,
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    })
      .setLngLat([77.5447, 12.8718])
      .addTo(map);

    busMarkerRef.current = marker;

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      marker.remove();
      if (viewerMarkerRef.current) viewerMarkerRef.current.remove();
      map.remove();
    };
  }, []);

  // Update theme style dynamically
  useEffect(() => {
    if (!mapRef.current) return;
    const targetStyle = STYLE_URLS[theme] || STYLE_URLS.light;
    setStyleLoaded(false);
    mapRef.current.setStyle(targetStyle, { diff: false });
  }, [theme]);

  // Redraw Route Layers when style reloads or route changes
  useEffect(() => {
    if (!mapRef.current || (!styleLoaded && !mapRef.current.isStyleLoaded()) || !routeData) return;
    addRouteLayers(mapRef.current, routeData, theme);
    updateStopMarkers(mapRef.current, routeData);
    fitRouteBounds();
  }, [routeData, styleLoaded, theme]);

  // Update Bus Marker Position, Heading, and Visual State
  useEffect(() => {
    if (!busMarkerRef.current || !busPosition) return;
    const { lng, lat, heading } = busPosition;

    busMarkerRef.current.setLngLat([lng, lat]);

    // Rotate marker with heading if available
    if (busMarkerElRef.current) {
      const headingDeg = heading || 0;
      const arrow = busMarkerElRef.current.querySelector('.bus-heading-arrow');
      if (arrow) {
        arrow.style.transform = `rotate(${headingDeg}deg) translateY(-2px)`;
      }

      // Visual state styling
      const outer = busMarkerElRef.current.querySelector('.bus-outer');
      const pulse = busMarkerElRef.current.querySelector('.bus-pulse-ring');
      if (outer && pulse) {
        if (busState === 'lost' || busState === 'offline') {
          outer.style.filter = 'grayscale(100%) opacity(70%)';
          pulse.style.display = 'none';
        } else if (busState === 'nofix') {
          outer.style.filter = 'opacity(85%)';
          pulse.style.borderColor = 'rgba(234, 162, 59, 0.4)';
          pulse.style.display = 'block';
        } else {
          outer.style.filter = 'none';
          pulse.style.display = 'block';
        }
      }
    }

    if (followBus && mapRef.current) {
      mapRef.current.easeTo({
        center: [lng, lat],
        duration: 800,
      });
    }
  }, [busPosition, busState, followBus]);

  // Update or clear viewer location marker on map
  useEffect(() => {
    if (!mapRef.current) return;
    if (viewerLocation) {
      const { lat, lng } = viewerLocation;
      if (!viewerMarkerRef.current) {
        const viewerEl = document.createElement('div');
        viewerEl.className = 'nexus-viewer-marker relative flex items-center justify-center cursor-pointer';
        viewerEl.innerHTML = `
          <div class="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white dark:border-[#0D1527] shadow-xl flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
          <div class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping pointer-events-none"></div>
          <div class="hidden group-hover:block absolute bottom-7 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow">
            Your Location (Viewer)
          </div>
        `;
        viewerMarkerRef.current = new Marker({ element: viewerEl })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      } else {
        viewerMarkerRef.current.setLngLat([lng, lat]);
      }
    } else if (viewerMarkerRef.current) {
      viewerMarkerRef.current.remove();
      viewerMarkerRef.current = null;
    }
  }, [viewerLocation]);

  const fitRouteBounds = () => {
    if (!mapRef.current || !routeData?.route?.line?.coords) return;
    const bounds = getBounds(routeData.route.line.coords);
    mapRef.current.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right: 60 },
      maxZoom: 15,
      duration: 1000,
    });
  };

  const addRouteLayers = (map, data, curTheme) => {
    if (!data?.route?.line?.coords) return;
    const coords = data.route.line.coords;

    // Remove existing layers & source if already present
    if (map.getLayer('route-line-casing')) map.removeLayer('route-line-casing');
    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('active-route')) map.removeSource('active-route');

    map.addSource('active-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
      },
    });

    const isDark = curTheme === 'dark';
    const lineColor = isDark ? '#06B6D4' : '#6558E8';
    const casingColor = isDark ? '#083344' : '#C7D2FE';

    map.addLayer({
      id: 'route-line-casing',
      type: 'line',
      source: 'active-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': casingColor,
        'line-width': 8,
        'line-opacity': 0.7,
      },
    });

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'active-route',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': lineColor,
        'line-width': 4.5,
        'line-opacity': 0.95,
      },
    });
  };

  const updateStopMarkers = (map, data) => {
    // Clear old stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    if (!data?.route?.stops) return;

    data.route.stops.forEach((stop, idx) => {
      const el = document.createElement('div');
      el.className = 'group relative flex items-center justify-center cursor-pointer';
      el.innerHTML = `
        <div class="w-6 h-6 rounded-full bg-white dark:bg-[#0D1527] border-2 border-slate-400 dark:border-slate-500 flex items-center justify-center shadow-md hover:scale-125 transition-transform">
          <span class="text-[9px] font-mono font-bold text-slate-700 dark:text-slate-300">${idx + 1}</span>
        </div>
        <div class="hidden group-hover:block absolute bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-medium py-1 px-2.5 rounded-lg shadow-lg pointer-events-none z-30">
          ${stop.name}
        </div>
      `;

      const marker = new Marker({ element: el })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });

    // Add Campus Landmark Pins
    campusMarkersRef.current.forEach((m) => m.remove());
    campusMarkersRef.current = [];

    if (data?.campuses) {
      Object.values(data.campuses).forEach((c) => {
        const el = document.createElement('div');
        el.className = 'flex flex-col items-center cursor-pointer';
        el.innerHTML = `
          <div class="px-2 py-0.5 rounded-md bg-[#6558E8] dark:bg-emerald-600 text-white font-black text-[10px] shadow-lg tracking-wider mb-0.5">
            ${c.short}
          </div>
          <div class="w-2.5 h-2.5 bg-[#6558E8] dark:bg-emerald-600 rotate-45 transform -translate-y-1.5 shadow-sm"></div>
        `;

        const marker = new Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .addTo(map);

        campusMarkersRef.current.push(marker);
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {/* Floating Map Controls Strip */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setFollowBus(true);
            if (busPosition && mapRef.current) {
              mapRef.current.easeTo({
                center: [busPosition.lng, busPosition.lat],
                zoom: 15,
                duration: 800,
              });
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all ${
            followBus
              ? 'bg-[#6558E8] text-white dark:bg-[#06B6D4] dark:text-[#070A11]'
              : 'bg-white/95 dark:bg-[#0D1527]/95 text-[#202442] dark:text-slate-200 border border-[#E2E6F2] dark:border-[#1E2D4A] hover:bg-[#EEF1FC]'
          }`}
          title="Keep map centered on bus"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Follow Bus</span>
        </button>

        <button
          type="button"
          onClick={fitRouteBounds}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/95 dark:bg-[#0D1527]/95 text-[#202442] dark:text-slate-200 border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-md hover:bg-[#EEF1FC] transition-all"
          title="Fit full route in view"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Fit Route</span>
        </button>

        {onLocateViewer && (
          <button
            type="button"
            onClick={onLocateViewer}
            disabled={isLocatingViewer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
              viewerLocation
                ? 'bg-blue-600 text-white shadow-blue-500/20'
                : 'bg-white/95 dark:bg-[#0D1527]/95 text-[#202442] dark:text-slate-200 border border-[#E2E6F2] dark:border-[#1E2D4A] hover:bg-[#EEF1FC]'
            }`}
            title="Show your current device location on the map"
          >
            <MapPin className={`w-3.5 h-3.5 ${isLocatingViewer ? 'animate-bounce text-blue-500' : ''}`} />
            <span>{isLocatingViewer ? 'Locating...' : viewerLocation ? 'My Location ✓' : 'My Location'}</span>
          </button>
        )}
      </div>

      {/* Full View Toggle on Map Canvas */}
      {onToggleFullView && (
        <button
          type="button"
          onClick={onToggleFullView}
          className="absolute top-3 right-14 z-10 p-2 rounded-xl bg-white/95 dark:bg-[#0D1527]/95 text-[#202442] dark:text-slate-200 border border-[#E2E6F2] dark:border-[#1E2D4A] shadow-md hover:bg-[#EEF1FC] transition-all"
          title={isFullView ? 'Exit Full Screen' : 'Full Screen View'}
        >
          {isFullView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
