"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type SortKey = "street" | "city" | "state" | "zipcode";
type SortDir = "asc" | "desc";

interface LocationAddress {
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zipcode: string;
}

interface LocationRow {
  id: string;
  address_id: number;
  location_address: LocationAddress | null;
}

interface AddressFormData {
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zipcode: string;
}

const EMPTY_FORM: AddressFormData = {
  street_number: "",
  street_name: "",
  city: "",
  state: "",
  zipcode: "",
};

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 12l5-5 5 5H5z" />
    </svg>
  );
  return dir === "asc" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 12l5-5 5 5H5z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15 8l-5 5-5-5h10z" />
    </svg>
  );
}

function LocationModal({
  onSave,
  onClose,
  saving,
}: {
  onSave: (data: AddressFormData) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg font-black uppercase tracking-tight mb-5">Add New Location</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Street Number <span className="text-red-500">*</span>
              </label>
              <input
                name="street_number"
                value={form.street_number}
                onChange={handleChange}
                placeholder="1000"
                className="input-themed p-2 text-black w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Street Name <span className="text-red-500">*</span>
              </label>
              <input
                name="street_name"
                value={form.street_name}
                onChange={handleChange}
                placeholder="Main St"
                className="input-themed p-2 text-black w-full"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                City <span className="text-red-500">*</span>
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Baltimore"
                className="input-themed p-2 text-black w-full"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                State <span className="text-red-500">*</span>
              </label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="MD"
                className="input-themed p-2 text-black w-full"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Zipcode <span className="text-red-500">*</span>
            </label>
            <input
              name="zipcode"
              value={form.zipcode}
              onChange={handleChange}
              placeholder="21201"
              className="input-themed p-2 text-black w-full"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Saving…" : "Save Location"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getStreet(loc: LocationRow) {
  const a = loc.location_address;
  return a ? `${a.street_number} ${a.street_name}` : "";
}

function ConfirmDeleteModal({
  loc,
  onConfirm,
  onClose,
}: {
  loc: LocationRow;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const a = loc.location_address;
  const address = a
    ? `${a.street_number} ${a.street_name}, ${a.city}, ${a.state} ${a.zipcode}`
    : "this location";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-lg font-black uppercase tracking-tight mb-2">Delete Location</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-bold text-black">{address}</span>?{" "}
          This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Delete
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "city", dir: "asc" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchLocations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLocations() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("location")
      .select("id, address_id, location_address(street_number, street_name, city, state, zipcode)");

    if (error) {
      setError(error.message);
    } else {
      setLocations((data as unknown as LocationRow[]) ?? []);
    }
    setLoading(false);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  async function handleAddLocation(form: AddressFormData) {
    setSaving(true);

    // Duplicate check
    const { data: existing } = await supabase
      .from("location_address")
      .select("address_id")
      .ilike("street_number", form.street_number.trim())
      .ilike("street_name", form.street_name.trim())
      .ilike("city", form.city.trim())
      .ilike("state", form.state.trim())
      .eq("zipcode", form.zipcode.trim())
      .maybeSingle();

    if (existing) {
      alert("A location with this address already exists.");
      setSaving(false);
      return;
    }

    const { data: addrData, error: addrError } = await supabase
      .from("location_address")
      .insert([{
        street_number: form.street_number.trim(),
        street_name: form.street_name.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipcode: form.zipcode.trim(),
      }])
      .select("address_id")
      .single();

    if (addrError || !addrData) {
      alert("Failed to save address: " + (addrError?.message ?? "Unknown error"));
      setSaving(false);
      return;
    }

    const { error: locError } = await supabase
      .from("location")
      .insert([{ address_id: addrData.address_id }]);

    if (locError) {
      alert("Failed to save location: " + locError.message);
    } else {
      setShowAddModal(false);
      await fetchLocations();
    }
    setSaving(false);
  }

  async function handleDelete(loc: LocationRow) {
    const { error: locError } = await supabase
      .from("location")
      .delete()
      .eq("id", loc.id);

    if (locError) {
      alert("Failed to delete location: " + locError.message);
      setDeleteTarget(null);
      return;
    }

    const { error: addrError } = await supabase
      .from("location_address")
      .delete()
      .eq("address_id", loc.address_id);

    if (addrError) {
      alert("Failed to delete address: " + addrError.message);
    }

    setDeleteTarget(null);
    await fetchLocations();
  }

  const getValue = (loc: LocationRow, key: SortKey): string => {
    const a = loc.location_address;
    if (!a) return "";
    if (key === "street") return `${a.street_number} ${a.street_name}`;
    return a[key] ?? "";
  };

  const filtered = locations.filter((loc) => {
    const a = loc.location_address;
    if (!a) return false;
    const combined = `${a.street_number} ${a.street_name} ${a.city} ${a.state} ${a.zipcode}`.toLowerCase();
    return combined.includes(searchTerm.toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const cmp = getValue(a, sort.key).localeCompare(getValue(b, sort.key));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, sticky }: { col: SortKey; label: string; sticky?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none hover:bg-black/5 whitespace-nowrap ${sticky ? "sticky left-0 z-20 bg-blue-200" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortArrow active={sort.key === col} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {showAddModal && (
        <LocationModal
          onSave={handleAddLocation}
          onClose={() => setShowAddModal(false)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          loc={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black uppercase tracking-tight">Locations</h1>
          <button className="btn-accent px-4 py-2 shrink-0" onClick={() => setShowAddModal(true)}>
            + Add New Location
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by street, city, state, or zip…"
              className="input-themed block w-full pl-10 pr-3 py-2 leading-5 text-black placeholder-gray-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          {loading ? (
            <div className="p-10 text-center text-gray-500 italic">Loading locations…</div>
          ) : error ? (
            <div className="p-10 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full min-w-[560px] text-left border-collapse">
              <thead className="table-header-accent">
                <tr>
                  <Th col="street" label="Street" sticky />
                  <Th col="city" label="City" />
                  <Th col="state" label="State" />
                  <Th col="zipcode" label="Zipcode" />
                </tr>
              </thead>
              <tbody>
                {sorted.length > 0 ? (
                  sorted.map((loc) => {
                    const a = loc.location_address;
                    return (
                      <tr key={loc.id} className="hover:bg-blue-50 text-black transition-colors">
                        <td className="p-3 sm:p-4 border-b font-bold whitespace-nowrap sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                          {a ? `${a.street_number} ${a.street_name}` : "—"}
                        </td>
                        <td className="p-3 sm:p-4 border-b text-gray-700">{a?.city ?? "—"}</td>
                        <td className="p-3 sm:p-4 border-b text-gray-700">{a?.state ?? "—"}</td>
                        <td className="p-3 sm:p-4 border-b font-mono text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span>{a?.zipcode ?? "—"}</span>
                            <button
                              onClick={() => setDeleteTarget(loc)}
                              title="Delete location"
                              className="p-1.5 rounded-full bg-red-100 hover:bg-red-600 text-red-500 hover:text-white transition-colors shrink-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-500 italic">
                      {searchTerm
                        ? `No locations found matching "${searchTerm}"`
                        : "No locations added yet. Click \"+ Add New Location\" to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
