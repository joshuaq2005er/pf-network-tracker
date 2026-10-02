import { useEffect, useMemo, useState } from 'react';
import { fetchPfControlFlights } from './lib/pfcontrol';
import { mockFlights } from './data/mockFlights';
import type { PfFlight } from './types';

function App() {
  const [flights, setFlights] = useState<PfFlight[]>(mockFlights);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(mockFlights[0].id);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedFlight = useMemo(
    () => flights.find((f) => f.id === selectedId) ?? flights[0] ?? mockFlights[0],
    [flights, selectedId],
  );

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      const statusMatch = filterStatus === 'All' || flight.status === filterStatus;
      const searchText = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !searchText ||
        flight.callsign.toLowerCase().includes(searchText) ||
        flight.route.toLowerCase().includes(searchText) ||
        flight.aircraft.toLowerCase().includes(searchText);

      return statusMatch && matchesSearch;
    });
  }, [flights, filterStatus, searchQuery]);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await fetchPfControlFlights();
        setFlights(payload);
        setIsConnected(true);
        setSelectedId((current) => current || payload[0]?.id || mockFlights[0].id);
      } catch {
        setFlights(mockFlights);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Active', value: flights.filter((f) => f.status === 'Active').length, icon: '✈️', tone: 'emerald' },
    { label: 'Holding', value: flights.filter((f) => f.status === 'Holding').length, icon: '⏳', tone: 'amber' },
    { label: 'Delayed', value: flights.filter((f) => f.status === 'Delayed').length, icon: '⚠️', tone: 'orange' },
    { label: 'Pending', value: flights.filter((f) => f.status === 'Pending').length, icon: '📡', tone: 'sky' },
  ];

  const statuses = ['All', 'Active', 'Holding', 'Delayed', 'Pending'];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-logo">PF</div>
          <div>
            <p className="eyebrow">Project Flight</p>
            <h1>Network Tracker</h1>
          </div>
        </div>

        <div className="header-actions">
          <div className={`live-pill ${isConnected ? 'online' : 'offline'}`}>
            <span className="dot" />
            {isLoading ? 'Connecting...' : isConnected ? 'LIVE' : 'Fallback'}
          </div>
          <button className="ghost-button">Refresh</button>
        </div>
      </header>

      <main className="content-layout">
        <aside className="sidebar-panel">
          <div className="sidebar-block">
            <div className="panel-header">
              <span>Flight List</span>
              <span className="mini-tag">{filteredFlights.length}</span>
            </div>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search callsign, route..."
              />
            </div>

            <div className="status-filter-row">
              {statuses.map((status) => (
                <button
                  key={status}
                  className={filterStatus === status ? 'filter active' : 'filter'}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flight-list">
              {filteredFlights.map((flight) => (
                <button
                  key={flight.id}
                  className={selectedFlight.id === flight.id ? 'flight-item selected' : 'flight-item'}
                  onClick={() => setSelectedId(flight.id)}
                >
                  <div>
                    <strong>{flight.callsign}</strong>
                    <span>{flight.route}</span>
                  </div>
                  <div className="flight-meta">
                    <span className={`status-badge ${flight.status.toLowerCase()}`}>{flight.status}</span>
                    <small>{flight.altitude}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="main-panel">
          <div className="stats-grid">
            {stats.map((stat) => (
              <article key={stat.label} className={`stat-card ${stat.tone}`}>
                <div className="stat-icon">{stat.icon}</div>
                <div>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="scope-panel panel">
            <div className="panel-header wide">
              <span>ATC Scope</span>
              <span className="mini-tag danger">LIVE</span>
            </div>

            <div className="radar-surface">
              <svg className="radar-grid" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(96, 165, 250, 0.18)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(96, 165, 250, 0.2)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="10" fill="none" stroke="rgba(96, 165, 250, 0.22)" strokeWidth="0.5" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(96, 165, 250, 0.12)" strokeWidth="0.5" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(96, 165, 250, 0.12)" strokeWidth="0.5" />
              </svg>

              {flights.map((flight) => {
                const x = ((flight.longitude + 120) / 24) * 100;
                const y = ((50 - flight.latitude) / 30) * 100;
                const isSelected = selectedFlight.id === flight.id;

                return (
                  <button
                    key={flight.id}
                    className={isSelected ? 'blip selected' : 'blip'}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      ['--status-color' as any]:
                        flight.status === 'Active'
                          ? '#34d399'
                          : flight.status === 'Holding'
                            ? '#fbbf24'
                            : flight.status === 'Delayed'
                              ? '#fb923c'
                              : '#60a5fa',
                    }}
                    onClick={() => setSelectedId(flight.id)}
                    title={`${flight.callsign} • ${flight.route}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="detail-grid">
            <article className="panel detail-card">
              <div className="panel-header wide">
                <span>Selected Flight</span>
                <span className="mini-tag">{selectedFlight.callsign}</span>
              </div>

              <div className="flight-summary">
                <div className="flight-pod">✈</div>
                <div>
                  <h3>{selectedFlight.callsign}</h3>
                  <p>{selectedFlight.aircraft} • {selectedFlight.squawk}</p>
                </div>
              </div>

              <div className="metrics-grid">
                <div>
                  <label>Altitude</label>
                  <strong>{selectedFlight.altitude}</strong>
                </div>
                <div>
                  <label>Speed</label>
                  <strong>{selectedFlight.speed}</strong>
                </div>
                <div>
                  <label>Heading</label>
                  <strong>{selectedFlight.heading}°</strong>
                </div>
                <div>
                  <label>Status</label>
                  <strong>{selectedFlight.status}</strong>
                </div>
              </div>
            </article>

            <article className="panel route-card">
              <div className="panel-header wide">
                <span>Route</span>
              </div>

              <div className="route-visual">
                <div className="route-stop">
                  <span>{selectedFlight.departure}</span>
                  <small>{selectedFlight.pilot}</small>
                </div>
                <div className="route-line" />
                <div className="route-stop right">
                  <span>{selectedFlight.destination}</span>
                  <small>{selectedFlight.eta}</small>
                </div>
              </div>

              <div className="route-list">
                <div><span>Pilot</span><strong>{selectedFlight.pilot}</strong></div>
                <div><span>Frequency</span><strong>{selectedFlight.frequency}</strong></div>
                <div><span>ETA</span><strong>{selectedFlight.eta}</strong></div>
                <div><span>Route</span><strong>{selectedFlight.route}</strong></div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
