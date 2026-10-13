"use client";

import { useCallback, useEffect, useState } from "react";
import MapLoader from "../components/MapLoader";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function Home() {
  const [locations, setLocations] = useState([]);
  const [geoJSON, setGeoJSON] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [route, setRoute] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLocations = useCallback(async (search = "") => {
    try {
      const url = new URL(`${API}/locations`);
      if (search.trim()) url.searchParams.set("q", search.trim());

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not load locations");
      }

      setLocations(result.data);
    } catch (err) {
      setError(err.message || "Could not connect to the map API");
    }
  }, []);

  useEffect(() => {
    loadLocations();

    fetch(`${API}/map/geojson`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load map boundary");
        return res.json();
      })
      .then(setGeoJSON)
      .catch((err) => setError(err.message));
  }, [loadLocations]);

  // Search saved locations
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLocations(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, loadLocations]);

  const chooseLocation = (item) => {
    setSelectedLocation(item);
    setError("");
  };

  const calculateRoute = async (event) => {
    event.preventDefault();
    setError("");
    setRoute(null);

    const from = locations.find((item) => item._id === start);
    const to = locations.find((item) => item._id === end);

    if (!from || !to) {
      setError("Please select both starting and destination locations.");
      return;
    }

    if (from._id === to._id) {
      setError("Start and destination must be different.");
      return;
    }

    const [fromLng, fromLat] = from.location.coordinates;
    const [toLng, toLat] = to.location.coordinates;

    setLoading(true);

    try {
      const params = new URLSearchParams({
        fromLng: String(fromLng),
        fromLat: String(fromLat),
        toLng: String(toLng),
        toLat: String(toLat),
      });

      const response = await fetch(`${API}/route?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Route calculation failed");
      }

      setRoute({
        coordinates: result.geometry.coordinates,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
      });
      setSelectedLocation(null);
    } catch (err) {
      setError(err.message || "Could not calculate route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand">
            Geo<span>Explorer</span>
          </div>
          <p>Explore places and plan your route</p>
        </div>
        <span className="status-pill">Interactive Map</span>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <h1>Explore your map</h1>
          <p className="muted">
            Search places, choose a destination, and see the road route.
          </p>

          <label className="field-label" htmlFor="location-search">
            Search locations
          </label>
          <input
            id="location-search"
            className="text-input"
            placeholder="Try Shahbag or Lalbagh..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {/* <div className="location-list">
            {locations.map((item) => (
              <button
                key={item._id}
                className={`location-item ${
                  selectedLocation?._id === item._id ? "active" : ""
                }`}
                onClick={() => chooseLocation(item)}
              >
                <span className="pin-dot" />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.address}</small>
                </span>
              </button>
            ))}

            {locations.length === 0 && (
              <p className="muted">No matching locations found.</p>
            )}
          </div> */}

          <hr className="separator" />

          <h2>Plan a route</h2>
          <form className="route-form" onSubmit={calculateRoute}>
            <label className="field-label" htmlFor="start">
              Starting point
            </label>
            <select
              id="start"
              className="text-input"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              required
            >
              <option value="">Choose starting location</option>
              {locations.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="end">
              Destination
            </label>
            <select
              id="end"
              className="text-input"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              required
            >
              <option value="">Choose destination</option>
              {locations.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>

            <button className="primary-button" disabled={loading}>
              {loading ? "Finding route..." : "Find route"}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}

          {route && (
            <div className="route-summary">
              <span className="summary-label">Route summary</span>
              <div className="summary-values">
                <div>
                  <strong>{(route.distanceMeters / 1000).toFixed(2)} km</strong>
                  <small>Distance</small>
                </div>
                <div>
                  <strong>{Math.round(route.durationSeconds / 60)} min</strong>
                  <small>Estimated driving time</small>
                </div>
              </div>
              <p className="muted">Estimate only; traffic is not included.</p>
            </div>
          )}
        </aside>

        <section className="map-panel" aria-label="Interactive map">
          <MapLoader
            locations={locations}
            geoJSON={geoJSON}
            selectedLocation={selectedLocation}
            route={route}
            onSelectLocation={chooseLocation}
            onLocationSaved={async () => {
              await loadLocations(query);
            }}
          />
          <div className="map-legend">
            <span className="legend-dot" />
            Saved locations
            <span className="legend-line" />
            Selected route
          </div>
        </section>
      </section>

      <footer className="footer">
        Map tiles © OpenStreetMap contributors · Custom boundary GeoJSON
      </footer>
    </main>
  );
}
