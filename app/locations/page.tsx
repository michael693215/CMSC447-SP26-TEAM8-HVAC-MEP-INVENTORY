"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Import the Builder, Blueprint, and your new Server Actions!
import { DataTable } from '@/components/ui/DataTable';
import { getLocationColumns, LocationRow } from '@/components/columns/Location';
import { fetchLocations, addLocation, deleteLocation } from './actions';

interface AddressFormData {
  name: string;
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zipcode: string;
}

const EMPTY_FORM: AddressFormData = {
  name: "",
  street_number: "",
  street_name: "",
  city: "",
  state: "",
  zipcode: "",
};

function LocationModal({ onSave, onClose, saving }: { onSave: (data: AddressFormData) => Promise<void>; onClose: () => void; saving: boolean; }) {
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }
  
  async function handleSubmit(e: React.FormEvent) { 
    e.preventDefault(); 
    await onSave(form); 
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg font-black uppercase tracking-tight mb-5">Add New Location</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* New Input for Location Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Location Name <span className="text-red-500">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Main Warehouse" className="input-themed p-2 text-black w-full" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Street Number <span className="text-red-500">*</span></label>
              <input name="street_number" value={form.street_number} onChange={handleChange} placeholder="1000" className="input-themed p-2 text-black w-full" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Street Name <span className="text-red-500">*</span></label>
              <input name="street_name" value={form.street_name} onChange={handleChange} placeholder="Main St" className="input-themed p-2 text-black w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">City <span className="text-red-500">*</span></label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Baltimore" className="input-themed p-2 text-black w-full" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">State <span className="text-red-500">*</span></label>
              <input name="state" value={form.state} onChange={handleChange} placeholder="MD" className="input-themed p-2 text-black w-full" required />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Zipcode <span className="text-red-500">*</span></label>
            <input name="zipcode" value={form.zipcode} onChange={handleChange} placeholder="21201" className="input-themed p-2 text-black w-full" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>{saving ? "Saving…" : "Save Location"}</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ loc, onConfirm, onClose }: { loc: LocationRow; onConfirm: () => void; onClose: () => void; }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-lg font-black uppercase tracking-tight mb-2">Delete Location</h2>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete <span className="font-bold text-black">{loc.name || "this location"}</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition">Delete</button>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    setLoading(true);
    const data = await fetchLocations();
    setLocations(data as any[]);
    setLoading(false);
  }

  async function handleAddLocation(form: AddressFormData) {
    setSaving(true);
    const result = await addLocation(form);
    
    if (result.error) {
      alert(result.error);
    } else {
      setShowAddModal(false);
      await loadLocations();
    }
    setSaving(false);
  }

  async function handleDelete(loc: LocationRow) {
    const result = await deleteLocation(loc.id, loc.address_id);
    
    if (result.error) {
      alert(result.error);
    } else {
      setDeleteTarget(null);
      await loadLocations();
    }
  }

  // Filter the data based on search term
  const filtered = locations.filter((loc) => {
    const a = loc.location_address;
    const addressString = a ? `${a.street_number} ${a.street_name} ${a.city} ${a.state} ${a.zipcode}` : "";
    const combined = `${loc.name} ${addressString}`.toLowerCase();
    return combined.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {showAddModal && <LocationModal onSave={handleAddLocation} onClose={() => setShowAddModal(false)} saving={saving} />}
      {deleteTarget && <ConfirmDeleteModal loc={deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onClose={() => setDeleteTarget(null)} />}

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
              placeholder="Search by name, street, city, state, or zip…"
              className="input-themed block w-full pl-10 pr-3 py-2 leading-5 text-black placeholder-gray-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Builder */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          {loading ? (
            <div className="p-10 text-center text-gray-500 italic">Loading locations…</div>
          ) : (
            <DataTable 
              columns={getLocationColumns(setDeleteTarget)} 
              data={filtered} 
              role={"administrator" as any} 
            />
          )}
        </div>
      </div>
    </div>
  );
}