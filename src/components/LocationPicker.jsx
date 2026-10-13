
"use client";

import { useMapEvents, Marker, Popup } from "react-leaflet";

export default function LocationPicker({
  selectedPosition,
  onPositionSelect,
}) {
  useMapEvents({
    click(event) {
      onPositionSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  if (!selectedPosition) return null;

  return (
    <Marker
      position={[
        selectedPosition.lat,
        selectedPosition.lng,
      ]}
    >
      <Popup>
        <div>
          <strong>Selected location</strong>
          <br />
          Latitude: {selectedPosition.lat.toFixed(6)}
          <br />
          Longitude: {selectedPosition.lng.toFixed(6)}
        </div>
      </Popup>
    </Marker>
  );
}
