
"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const dhakaCenter = [23.75, 90.39];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Automatically move the map to the selected location or route.
function MapUpdater({ selectedLocation, route }) {
  const map = useMap();

  useEffect(() => {
    if (route?.coordinates?.length) {
      const bounds = L.latLngBounds(
        route.coordinates.map(([lng, lat]) => [lat, lng])
      );

      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (selectedLocation?.location?.coordinates) {
      const [lng, lat] =
        selectedLocation.location.coordinates;

      map.flyTo([lat, lng], 15);
    }
  }, [map, selectedLocation, route]);

  return null;
}

// Capture clicks on the map and return coordinates.
function LocationClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

// Form for saving the selected location to MongoDB.
function SaveLocationPanel({
  position,
  onSaved,
  onCancel,
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("place");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!position || !name.trim()) {
      setError(true);
      setMessage("Select a map location and enter its name.");
      return;
    }

    setSaving(true);
    setError(false);
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/locations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
            category,
            coordinates: [position.lng, position.lat],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to save location."
        );
      }

      setMessage("Location saved successfully!");
      setName("");
      setAddress("");
      setCategory("place");

      // Refresh locations in the parent component.
      await onSaved?.(result.data);
    } catch (err) {
      setError(true);
      setMessage(
        err.message || "Could not connect to the server."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="absolute bottom-4 left-4 z-[1000] w-[min(340px,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">
          Save selected location
        </h3>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Close location form"
          className="rounded-md px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
        >
          ×
        </button>
      </div>

      <div className="mb-3 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-slate-700">
        <div>
          <strong>Latitude:</strong>{" "}
          {position.lat.toFixed(6)}
        </div>
        <div>
          <strong>Longitude:</strong>{" "}
          {position.lng.toFixed(6)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Location name"
          maxLength={150}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <input
          value={address}
          onChange={(event) =>
            setAddress(event.target.value)
          }
          placeholder="Address (optional)"
          maxLength={300}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="place">Place</option>
          <option value="landmark">Landmark</option>
          <option value="education">Education</option>
          <option value="restaurant">Restaurant</option>
          <option value="hospital">Hospital</option>
          <option value="shop">Shop</option>
          <option value="office">Office</option>
        </select>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Location"}
        </button>

        {message && (
          <p
            role="status"
            className={`text-sm ${
              error ? "text-red-600" : "text-green-700"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default function MapView({
  locations = [],
  geoJSON,
  selectedLocation,
  route,
  onSelectLocation,
  onLocationSaved,
}) {
  const [pickedPosition, setPickedPosition] =
    useState(null);

  return (
    <div className="relative h-full min-h-[450px] w-full">
      <MapContainer
        center={dhakaCenter}
        zoom={12}
        scrollWheelZoom
        className="map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {geoJSON && (
          <GeoJSON
            key={JSON.stringify(geoJSON)}
            data={geoJSON}
            style={() => ({
              color: "#2563eb",
              weight: 2,
              fillColor: "#60a5fa",
              fillOpacity: 0.12,
            })}
            onEachFeature={(feature, layer) => {
              if (feature.properties?.name) {
                layer.bindPopup(feature.properties.name);
              }
            }}
          />
        )}

        {locations.map((item) => {
          const coords = item.location?.coordinates;

          if (!coords || coords.length !== 2) {
            return null;
          }

          const [lng, lat] = coords;

          return (
            <Marker
              key={item._id || item.name}
              position={[lat, lng]}
              eventHandlers={{
                click: () => onSelectLocation?.(item),
              }}
            >
              <Popup>
                <strong>{item.name}</strong>
                <br />
                {item.address}
              </Popup>
            </Marker>
          );
        })}

        {pickedPosition && (
          <Marker
            position={[
              pickedPosition.lat,
              pickedPosition.lng,
          ]}
          >
            <Popup>
              <strong>New location</strong>
              <br />
              Latitude: {pickedPosition.lat.toFixed(6)}
              <br />
              Longitude: {pickedPosition.lng.toFixed(6)}
            </Popup>
          </Marker>
        )}

        {route?.coordinates && (
          <Polyline
            positions={route.coordinates.map(
              ([lng, lat]) => [lat, lng]
            )}
            pathOptions={{
              color: "#2563eb",
              weight: 6,
              opacity: 0.85,
            }}
          />
        )}

        <LocationClickHandler
          onPick={setPickedPosition}
        />

        <MapUpdater
          selectedLocation={selectedLocation}
          route={route}
        />
      </MapContainer>

      {pickedPosition && (
        <SaveLocationPanel
          position={pickedPosition}
          onCancel={() => setPickedPosition(null)}
          onSaved={async (savedLocation) => {
            await onLocationSaved?.(savedLocation);
            setPickedPosition(null);
          }}
        />
      )}

      <div className="pointer-events-none absolute right-3 top-3 z-[900] rounded-lg bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow">
        Click map to add a location
      </div>
    </div>
  );
}
