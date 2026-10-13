"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">Loading interactive map...</div>
  ),
});

export default function MapLoader(props) {
  return <MapView {...props} />;
}