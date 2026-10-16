"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DoorOpen, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface Hostel {
  id: string;
  name: string;
}

interface Room {
  id: string;
  number: string;
  floor: number | null;
  price: string;
  hostel: { id: string; name: string };
  beds: { id: string }[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelFilter, setHostelFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ hostelId: "", number: "", floor: "", price: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    loadRooms();
  }, [hostelFilter]);

  async function loadHostels() {
    try {
      const res = await api.get("/hostels");
      setHostels(res.data);
    } catch {
      // hostels dropdown ni ya ziada; usikatize ukurasa
    }
  }

  async function loadRooms() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/rooms", {
        params: hostelFilter ? { hostelId: hostelFilter } : undefined,
      });
      setRooms(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ hostelId: hostels[0]?.id ?? "", number: "", floor: "", price: "" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setForm({
      hostelId: room.hostel.id,
      number: room.number,
      floor: room.floor?.toString() ?? "",
      price: room.price,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      const payload: any = {
        number: form.number,
        price: Number(form.price),
      };
      if (form.floor) payload.floor = Number(form.floor);

      if (editing) {
        const res = await api.patch(`/rooms/${editing.id}`, payload);
        setRooms((prev) =>
          prev.map((r) => (r.id === editing.id ? { ...r, ...res.data } : r)),
        );
      } else {
        payload.hostelId = form.hostelId;
        const res = await api.post("/rooms", payload);
        await loadRooms();
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
      await api.delete(`/rooms/${deleteTarget.id}`);
      setRooms((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to delete room.");
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
            Rooms
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-light">
            Add, edit, or remove rooms and their pricing.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={hostels.length === 0}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
        >
          <Plus size={16} /> Add Room
        </button>
      </div>

      {/* Filter */}
      {hostels.length > 0 && (
        <div className="mt-5">
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
          >
            <option value="">All hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && rooms.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No rooms found.
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-cream">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">Room</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">Hostel</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">Floor</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">Price</th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">Beds</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-light">Action</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{room.number}</td>
                  <td className="px-5 py-3 text-ink-light">{room.hostel.name}</td>
                  <td className="px-5 py-3 text-ink-light">{room.floor ?? "-"}</td>
                  <td className="px-5 py-3 font-semibold text-navy-900">
                    TZS {Number(room.price).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-ink-light">{room.beds.length}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(room)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-navy-50 hover:text-navy-900"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(room)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  {editing ? "Edit Room" : "Add Room"}
                </h3>
                <button
                  onClick={() => !saving && setModalOpen(false)}
                  className="text-ink-light hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {!editing && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                      Hostel
                    </label>
                    <select
                      value={form.hostelId}
                      onChange={(e) => setForm((f) => ({ ...f, hostelId: e.target.value }))}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                    >
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Room Number
                  </label>
                  <input
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="e.g. G-31"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                      Floor
                    </label>
                    <input
                      type="number"
                      value={form.floor}
                      onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                      placeholder="1"
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                      Price (TZS)
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="300000"
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <p className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {formError}
                </p>
              )}

              <button
                onClick={save}
                disabled={saving || !form.number || !form.price}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Room"}
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
                Delete Room {deleteTarget.number}?
              </h3>
              <p className="mt-2 text-sm text-ink-light">
                This cannot be undone. Rooms with existing beds cannot be
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
