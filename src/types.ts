export type FlightStatus = 'Active' | 'Holding' | 'Delayed' | 'Pending';

export interface PfFlight {
  id: string;
  callsign: string;
  route: string;
  aircraft: string;
  status: FlightStatus;
  altitude: string;
  speed: string;
  departure: string;
  destination: string;
  eta: string;
  heading: number;
  latitude: number;
  longitude: number;
  squawk: string;
  pilot: string;
  frequency: string;
}
