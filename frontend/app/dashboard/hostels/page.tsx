"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";

interface Hostel {
  id: string;
  name: string;
  genderAllowed: string;
  location: string | null;
  rooms: { id: string }[];
}

export default function HostelsPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hostel | null>(null);
  const [form, setForm] = useState({ name: "", genderAllowed: "male", location: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Hostel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/hostels");
      setHostels(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load hostels.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", genderAllowed: "male", location: "" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(hostel: Hostel) {
    setEditing(hostel);
    setForm({
      name: hostel.name,
      genderAllowed: hostel.genderAllowed,
      location: hostel.location ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const res = await api.patch(`/hostels/${editing.id}`, form);
        setHostels((prev) =>
          prev.map((h) => (h.id === editing.id ? { ...h, ...res.data } : h)),
        );
      } else {
        const res = await api.post("/hostels", form);
        setHostels((prev) => [...prev, { ...res.data, rooms: [] }]);
      }
      setModalOpen(false);
    } catch (err: any) {
      const messages = err?.response?.data?.message;
      setFormError(
        Array.isArray(messages) ? messages.join(", ") : messages || "Save failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/hostels/${deleteTarget.id}`);
      setHostels((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to delete hostel.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
            Manage
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
            Hostels
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-light">
            Add, edit, or remove hostels available for booking.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          <Plus size={16} /> Add Hostel
        </button>
      </div>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading hostels...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && hostels.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No hostels yet. Click &quot;Add Hostel&quot; to create one.
        </div>
      )}

      {!loading && !error && hostels.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((hostel) => (
            <div
              key={hostel.id}
              className="rounded-card border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Building2 size={18} />
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(hostel)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-navy-50 hover:text-navy-900"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(hostel)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-3 font-display text-lg font-semibold text-ink">
                {hostel.name}
              </p>
              <p className="text-xs capitalize text-ink-light">
                {hostel.genderAllowed} hostel
                {hostel.location ? ` · ${hostel.location}` : ""}
              </p>
              <span className="mt-3 inline-block rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                {hostel.rooms.length} rooms
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4"
            onClick={() => !saving && setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-card border border-line bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {editing ? "Edit Hostel" : "Add Hostel"}
                </h3>
                <button
                  onClick={() => !saving && setModalOpen(false)}
                  className="text-ink-light hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. NKEMBO"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Gender Allowed
                  </label>
                  <select
                    value={form.genderAllowed}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, genderAllowed: e.target.value }))
                    }
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Location (optional)
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Karibu na Chuo"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                  />
                </div>
              </div>

              {formError && (
                <p className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {formError}
                </p>
              )}

              <button
                onClick={save}
                disabled={saving || !form.name}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Hostel"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-card border border-line bg-white p-6 shadow-xl"
            >
              <h3 className="font-display text-lg font-semibold text-ink">
                Delete &quot;{deleteTarget.name}&quot;?
              </h3>
              <p className="mt-2 text-sm text-ink-light">
                This cannot be undone. Hostels with existing rooms cannot be
                deleted.
              </p>
              {deleteError && (
                <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {deleteError}
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-lg border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-600/90 disabled:opacity-60"
                >
                  {deleting && <Loader2 size={16} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
