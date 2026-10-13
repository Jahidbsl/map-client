
"use client";

import { useState } from "react";

export default function SaveLocationForm({
  selectedPosition,
  onSaved,
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("place");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!selectedPosition) {
      setMessage("First, click a location on the map.");
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter a location name.");
      return;
    }

    setSaving(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api";

      const response = await fetch(`${apiBase}/locations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          category,
          coordinates: [
            selectedPosition.lng,
            selectedPosition.lat,
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Could not save location."
        );
      }

      setMessage("Location saved successfully!");
      setName("");
      setAddress("");
      setCategory("place");

      if (onSaved) {
        await onSaved(result.data);
      }
    } catch (error) {
      setMessage(error.message || "Failed to save location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-base font-semibold">
        Add a new location
      </h3>

      {selectedPosition ? (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-slate-700">
          <p>
            Latitude: {selectedPosition.lat.toFixed(6)}
          </p>
          <p>
            Longitude: {selectedPosition.lng.toFixed(6)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Click anywhere on the map to select coordinates.
        </p>
      )}

      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Location name"
        maxLength={150}
        required
        className="w-full rounded-lg border p-3 text-sm"
      />

      <input
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Address (optional)"
        maxLength={300}
        className="w-full rounded-lg border p-3 text-sm"
      />

      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="w-full rounded-lg border bg-white p-3 text-sm"
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
        disabled={!selectedPosition || saving}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Location"}
      </button>

      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
