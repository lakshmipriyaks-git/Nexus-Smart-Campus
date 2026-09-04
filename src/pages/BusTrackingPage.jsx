import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Clock, Phone, RefreshCw, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBuses, updateBusLocation, seedCampusData } from '../services/campusUtilitiesService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const STATUS_STYLES = {
  'On Time': 'bg-green-100 text-green-700 border border-green-200',
  'Delayed':  'bg-red-100 text-red-600 border border-red-200',
};

const ROUTE_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
];

function getRouteColor(routeNumber) {
  const index = (parseInt(routeNumber, 10) || 0) % ROUTE_COLORS.length;
  return ROUTE_COLORS[index];
}

export default function BusTrackingPage() {
  const [buses, setBuses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBuses = async () => {
    setLoading(true);
    try {
      const data = await getBuses();
      setBuses(data);
      setFiltered(data);
    } catch (err) {
      toast.error('Failed to load bus routes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFiltered(buses);
    } else {
      const q = searchQuery.toLowerCase();
      setFiltered(
        buses.filter(
          (b) =>
            b.routeNumber?.toString().toLowerCase().includes(q) ||
            b.routeName?.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery, buses]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedCampusData();
      toast.success('Demo data seeded successfully!');
      await fetchBuses();
    } catch (err) {
      toast.error('Failed to seed demo data');
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 backdrop-blur-sm ring-1 ring-indigo-400/30">
            <Bus className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bus Tracking</h1>
            <p className="text-sm text-slate-400">KSSEM Campus Routes — Live Status</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBuses}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200"
          >
            <Database className={`h-4 w-4 ${seeding ? 'animate-pulse' : ''}`} />
            Seed Demo Data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by route number or name…"
        />
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bus}
          title="No Routes Found"
          description={
            searchQuery
              ? `No routes match "${searchQuery}". Try a different search.`
              : 'Click Seed Demo Data to load sample KSSEM routes'
          }
          action={
            !searchQuery && (
              <Button
                onClick={handleSeed}
                disabled={seeding}
                className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                <Database className="h-4 w-4" />
                {seeding ? 'Seeding…' : 'Seed Demo Data'}
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Route Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bus) => (
              <div
                key={bus.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/30 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* Card Top Strip */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-60 transition-opacity group-hover:opacity-100" />

                <div className="p-5">
                  {/* Route Number + Status Badge */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg ${getRouteColor(bus.routeNumber)}`}
                      >
                        {bus.routeNumber}
                      </div>
                      <div>
                        <h2 className="font-semibold text-white leading-tight">
                          {bus.routeName}
                        </h2>
                        <p className="text-xs text-slate-400">Route #{bus.routeNumber}</p>
                      </div>
                    </div>

                    <span
                      className={`ml-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${
                        STATUS_STYLES[bus.status] ?? 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5">
                    {/* Driver */}
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Phone className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                      <span className="truncate">
                        {bus.driverName}
                        {bus.driverPhone && (
                          <span className="ml-1 text-slate-400">· {bus.driverPhone}</span>
                        )}
                      </span>
                    </div>

                    {/* Next Stop */}
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      <span className="truncate">
                        <span className="text-slate-400">Next: </span>
                        {bus.nextStop ?? '—'}
                      </span>
                    </div>

                    {/* ETA */}
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Clock className="h-4 w-4 flex-shrink-0 text-amber-400" />
                      <span>
                        <span className="text-slate-400">ETA: </span>
                        {bus.etaMinutes != null ? (
                          <span className="font-semibold text-white">
                            {bus.etaMinutes} min
                          </span>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simulated Map Section */}
          <div className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
              <MapPin className="h-5 w-5 text-emerald-400" />
              Campus Route Map
            </h2>
            {/* TODO: Integrate Leaflet for real-time bus map */}
            <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-green-100 to-blue-100 shadow-lg ring-1 ring-white/10">
              {/* Decorative map-like grid lines */}
              <svg
                className="absolute inset-0 h-full w-full opacity-20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Decorative road lines */}
              <div className="absolute left-1/4 top-0 h-full w-1 bg-white/40 rounded" />
              <div className="absolute left-2/4 top-0 h-full w-1 bg-white/30 rounded" />
              <div className="absolute left-3/4 top-0 h-full w-0.5 bg-white/20 rounded" />
              <div className="absolute top-1/3 left-0 h-0.5 w-full bg-white/40 rounded" />
              <div className="absolute top-2/3 left-0 h-0.5 w-full bg-white/30 rounded" />

              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/30 backdrop-blur-[2px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm">
                  <MapPin className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-lg font-semibold text-slate-800">Interactive Map Coming Soon</p>
                <p className="text-sm text-slate-600">Real-time bus positions will appear here</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
