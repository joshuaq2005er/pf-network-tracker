import { mockFlights } from './data/mockFlights';
import type { PfFlight } from '../types';

const PF_ENDPOINTS = [
  'https://pfcontrol.com/api/flights',
  'https://pfcontrol.com/api/flightplans',
  'https://pfcontrol.com/api/v1/flights',
  'https://pfcontrol.com/api/v1/flightplans',
];

function toFlight(value: any): PfFlight | null {
  if (!value || typeof value !== 'object') return null;

  const callsign =
    value.callsign || value.callsignCode || value.flightId || value.id || 'UNKNOWN';
  const route = value.route || value.flightRoute || value.origin && value.destination
    ? `${value.origin}-${value.destination}`
    : 'N/A';
  const departure = value.departure || value.origin || 'N/A';
  const destination = value.destination || value.arrival || 'N/A';
  const aircraft = value.aircraft || value.aircraftType || value.type || 'UNASSIGNED';
  const status = value.status || 'Pending';
  const latitude = Number(value.latitude ?? value.lat ?? 0);
  const longitude = Number(value.longitude ?? value.lon ?? value.lng ?? 0);

  return {
    id: String(value.id ?? callsign ?? Math.random().toString(16).slice(2)),
    callsign: String(callsign),
    route: String(route),
    aircraft: String(aircraft),
    status: ['Active', 'Holding', 'Delayed', 'Pending'].includes(status)
      ? status
      : 'Pending',
    altitude: value.altitude ? String(value.altitude) : 'N/A',
    speed: value.speed ? String(value.speed) : 'N/A',
    departure: String(departure),
    destination: String(destination),
    eta: value.eta ? String(value.eta) : 'TBD',
    heading: Number(value.heading ?? 0),
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    squawk: value.squawk ? String(value.squawk) : '---',
    pilot: value.pilot || 'Unknown',
    frequency: value.frequency || '---',
  };
}

function normalizeFlights(payload: any): PfFlight[] {
  if (Array.isArray(payload)) {
    return payload
      .map(toFlight)
      .filter(Boolean) as PfFlight[];
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data.map(toFlight).filter(Boolean) as PfFlight[];
  }

  if (payload && Array.isArray(payload.flights)) {
    return payload.flights.map(toFlight).filter(Boolean) as PfFlight[];
  }

  if (payload && payload.flight && Array.isArray(payload.flight)) {
    return payload.flight.map(toFlight).filter(Boolean) as PfFlight[];
  }

  const single = toFlight(payload);
  return single ? [single] : [];
}

export async function fetchPfControlFlights(): Promise<PfFlight[]> {
  for (const endpoint of PF_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) continue;

      const payload = await response.json();
      const flights = normalizeFlights(payload);
      if (flights.length > 0) return flights;
    } catch {
      continue;
    }
  }

  return mockFlights;
}
