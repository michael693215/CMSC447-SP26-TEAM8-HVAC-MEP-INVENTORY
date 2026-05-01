"use client";

import React, { useState } from 'react';
import Link from 'next/link';

type SortKey = "name" | "company" | "type";
type SortDir = "asc" | "desc";

interface Contact {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: string;
}

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

const CONTACT_TYPES = ["Contractor", "Commercial", "Vendor"];

const SEED_CONTACTS: Contact[] = [
  { id: 1, name: "John Miller", company: "Miller Residential HVAC", email: "john@millerhvac.com", phone: "(555) 123-4567", type: "Contractor" },
  { id: 2, name: "Sarah Chen", company: "City Property Mgmt", email: "schen@citypm.org", phone: "(555) 987-6543", type: "Commercial" },
  { id: 3, name: "Robert Davis", company: "Davis Parts & Supply", email: "orders@davisparts.com", phone: "(555) 444-5566", type: "Vendor" },
];

type ContactFormData = Omit<Contact, "id">;

const EMPTY_CONTACT: ContactFormData = {
  name: "",
  company: "",
  email: "",
  phone: "",
  type: "Contractor",
};

function ContactModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial: ContactFormData;
  onSave: (data: ContactFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactFormData>(initial);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg font-black uppercase tracking-tight mb-5">{title}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Name <span className="text-red-500">*</span>
              </label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" className="input-themed p-2 text-black w-full" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Company / Org <span className="text-red-500">*</span>
              </label>
              <input name="company" value={form.company} onChange={handleChange} placeholder="Company name" className="input-themed p-2 text-black w-full" required />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Email <span className="text-red-500">*</span>
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" className="input-themed p-2 text-black w-full" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className="input-themed p-2 text-black w-full font-mono" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Type <span className="text-red-500">*</span>
              </label>
              <select name="type" value={form.type} onChange={handleChange} className="input-themed p-2 text-black w-full">
                {CONTACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Save Contact</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(SEED_CONTACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function handleAddContact(data: ContactFormData) {
    const newId = Math.max(...contacts.map((c) => c.id)) + 1;
    setContacts((prev) => [...prev, { ...data, id: newId }]);
    setShowAddModal(false);
  }

  function handleEditContact(data: ContactFormData) {
    if (!editContact) return;
    setContacts((prev) => prev.map((c) => c.id === editContact.id ? { ...data, id: c.id } : c));
    setEditContact(null);
  }

  const filtered = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a[sort.key].localeCompare(b[sort.key]);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center, sticky }: { col: SortKey; label: string; center?: boolean; sticky?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none hover:bg-black/5 whitespace-nowrap ${center ? "text-center" : ""} ${sticky ? "sticky left-0 z-20 bg-blue-200" : ""}`}
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
        <ContactModal
          title="Add New Contact"
          initial={EMPTY_CONTACT}
          onSave={handleAddContact}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editContact && (
        <ContactModal
          title="Edit Contact"
          initial={{ name: editContact.name, company: editContact.company, email: editContact.email, phone: editContact.phone, type: editContact.type }}
          onSave={handleEditContact}
          onClose={() => setEditContact(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black uppercase tracking-tight">Contact List</h1>
          <button className="btn-accent px-4 py-2 shrink-0" onClick={() => setShowAddModal(true)}>
          + Add New Contact
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
              placeholder="Search by name or company..."
              className="input-themed block w-full pl-10 pr-3 py-2 leading-5 text-black placeholder-gray-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <Th col="name" label="Contact Name" sticky />
                <Th col="company" label="Company / Org" />
                <th className="p-3 sm:p-4 border-b">Email</th>
                <th className="p-3 sm:p-4 border-b">Phone</th>
                <Th col="type" label="Type" />
                <th className="p-3 sm:p-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((contact) => (
                  <tr key={contact.id} className="hover:bg-blue-50 text-black transition-colors">
                    <td className="p-3 sm:p-4 border-b font-bold whitespace-nowrap sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">{contact.name}</td>
                    <td className="p-3 sm:p-4 border-b text-gray-700">{contact.company}</td>
                    <td className="p-3 sm:p-4 border-b text-blue-600 underline">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </td>
                    <td className="p-3 sm:p-4 border-b font-mono text-sm whitespace-nowrap">{contact.phone}</td>
                    <td className="p-3 sm:p-4 border-b">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 uppercase whitespace-nowrap">
                        {contact.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 border-b text-center">
                      <button
                        className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold"
                        onClick={() => setEditContact(contact)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No contacts found matching &ldquo;{searchTerm}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
