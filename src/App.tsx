import { useEffect, useMemo, useState } from 'react';
import { fetchPfControlFlights } from './lib/pfcontrol';
import { mockFlights } from './data/mockFlights';
import type { PfFlight } from './types';

function App() {
  const [flights, setFlights] = useState<PfFlight[]>(mockFlights);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(mockFlights[0].id);

  const selectedFlight = useMemo(
    () => flights.find((f) => f.id === selectedId) ?? flights[0] ?? mockFlights[0],
    [flights, selectedId],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await fetchPfControlFlights();
        setFlights(payload);
        setIsConnected(payload !== mockFlights || true);
        setSelectedId((current) => current || payload[0]?.id || mockFlights[0].id);
      } catch {
        setFlights(mockFlights);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const stats = [
    { label: 'Active', value: flights.filter((f) => f.status === 'Active').length },
    { label: 'Holding', value: flights.filter((f) => f.status === 'Holding').length },
    { label: 'Delayed', value: flights.filter((f) => f.status === 'Delayed').length },
    { label: 'Pending', value: flights.filter((f) => f.status === 'Pending').length },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">PF</div>
          <div>
            <p className="eyebrow">Project Flight</p>
            <h1>Network Tracker</h1>
          </div>
        </div>

        <nav className="nav-panel">
          <button className="nav-selected">Overview</button>
          <button>Scope</button>
          <button>Flights</button>
          <button>Routes</button>
          <button>Control</button>
        </nav>

        <div className="panel system-panel">
          <div className="panel-header">
            <span>Network</span>
            <span className={`status-dot ${isConnected ? 'connected' : 'offline'}`} />
          </div>
          <div className="network-row">
            <span>PFControl</span>
            <strong>{isLoading ? 'Syncing...' : isConnected ? 'Connected' : 'Fallback'}</strong>
          </div>
          <div className="network-row">
            <span>Latency</span>
            <strong>42ms</strong>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ops Board</p>
            <h2>ATC / Flight Scope</h2>
          </div>
          <div className="toolbar-actions">
            <button className="ghost">Live Feed</button>
            <button className="primary">Refresh Data</button>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <div className="radar-panel panel">
            <div className="panel-header">
              <span>Scope Display</span>
              <span className="tag">LIVE</span>
            </div>

            <div className="radar-screen">
              <div className="radar-ring ring-1" />
              <div className="radar-ring ring-2" />
              <div className="radar-ring ring-3" />
              <div className="radar-crosshair" />

              {flights.map((flight) => (
                <div
                  key={flight.id}
                  className={`blip ${flight.status.toLowerCase()} ${selectedFlight.id === flight.id ? 'selected' : ''}`}
                  style={{
                    left: `${((flight.longitude + 120) / 24) * 100}%`,
                    top: `${((50 - flight.latitude) / 30) * 100}%`,
                  }}
                  onClick={() => setSelectedId(flight.id)}
                  title={`${flight.callsign} • ${flight.route}`}
                />
              ))}
            </div>
          </div>

          <div className="flight-panel panel">
            <div className="panel-header">
              <span>Flight List</span>
              <span className="tag">{flights.length}</span>
            </div>

            <div className="flight-list">
              {flights.map((flight) => (
                <button
                  key={flight.id}
                  className={`flight-row ${selectedFlight.id === flight.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(flight.id)}
                >
                  <div>
                    <strong>{flight.callsign}</strong>
                    <span>{flight.route}</span>
                  </div>
                  <div className="flight-meta">
                    <span className={`status-pill ${flight.status.toLowerCase()}`}>{flight.status}</span>
                    <small>{flight.altitude}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="details-grid">
          <article className="panel detail-panel">
            <div className="panel-header">
              <span>Selected Flight</span>
              <span className="tag">{selectedFlight.callsign}</span>
            </div>

            <div className="detail-grid">
              <div>
                <label>Aircraft</label>
                <strong>{selectedFlight.aircraft}</strong>
              </div>
              <div>
                <label>Squawk</label>
                <strong>{selectedFlight.squawk}</strong>
              </div>
              <div>
                <label>Departure</label>
                <strong>{selectedFlight.departure}</strong>
              </div>
              <div>
                <label>Destination</label>
                <strong>{selectedFlight.destination}</strong>
              </div>
              <div>
                <label>Altitude</label>
                <strong>{selectedFlight.altitude}</strong>
              </div>
              <div>
                <label>Speed</label>
                <strong>{selectedFlight.speed}</strong>
              </div>
            </div>
          </article>

          <article className="panel route-panel">
            <div className="panel-header">
              <span>Route Summary</span>
            </div>

            <div className="route-card">
              <div className="route-stop">
                <span className="code">{selectedFlight.departure}</span>
                <small>{selectedFlight.pilot}</small>
              </div>
              <div className="route-line" />
              <div className="route-stop">
                <span className="code">{selectedFlight.destination}</span>
                <small>{selectedFlight.eta}</small>
              </div>
            </div>

            <ul className="route-facts">
              <li><span>Heading</span><strong>{selectedFlight.heading}°</strong></li>
              <li><span>Frequency</span><strong>{selectedFlight.frequency}</strong></li>
              <li><span>Status</span><strong>{selectedFlight.status}</strong></li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

export default App;
