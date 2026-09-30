"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BedDouble, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

interface Hostel {
  id: string;
  name: string;
}
interface Room {
  id: string;
  number: string;
  hostel: { id: string; name: string };
}
interface Bed {
  id: string;
  number: string;
  status: string;
  room: { id: string; number: string; hostel: { id: string; name: string } };
}

const STATUS_STYLES: Record<string, string> = {
  free: "bg-success-50 text-success-600",
  held: "bg-warning-50 text-warning-600",
  occupied: "bg-navy-50 text-navy-700",
  maintenance: "bg-danger-50 text-danger-600",
};

export default function BedsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.type === "admin" && user.role === "super_admin";

  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [hostelFilter, setHostelFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bed | null>(null);
  const [form, setForm] = useState({ roomId: "", number: "", status: "free" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Bed | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadHostelsAndRooms();
  }, []);

  useEffect(() => {
    loadBeds();
  }, [roomFilter]);

  async function loadHostelsAndRooms() {
    try {
      const [hostelsRes, roomsRes] = await Promise.all([
        api.get("/hostels"),
        api.get("/rooms"),
      ]);
      setHostels(hostelsRes.data);
      setRooms(roomsRes.data);
    } catch {
      // dropdowns ni za ziada; usikatize ukurasa
    }
  }

  async function loadBeds() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/beds", {
        params: roomFilter ? { roomId: roomFilter } : undefined,
      });
      setBeds(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load beds.");
    } finally {
      setLoading(false);
    }
  }

  const roomsForHostel = useMemo(
    () => (hostelFilter ? rooms.filter((r) => r.hostel.id === hostelFilter) : rooms),
    [hostelFilter, rooms],
  );

  function openCreate() {
    setEditing(null);
    setForm({ roomId: rooms[0]?.id ?? "", number: "", status: "free" });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(bed: Bed) {
    setEditing(bed);
    setForm({ roomId: bed.room.id, number: bed.number, status: bed.status });
    setFormError("");
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const payload: any = { number: form.number };
        if (isSuperAdmin || user?.role === "warden") payload.status = form.status;
        const res = await api.patch(`/beds/${editing.id}`, payload);
        setBeds((prev) => prev.map((b) => (b.id === editing.id ? { ...b, ...res.data } : b)));
      } else {
        await api.post("/beds", { roomId: form.roomId, number: form.number });
        await loadBeds();
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
      await api.delete(`/beds/${deleteTarget.id}`);
      setBeds((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Failed to delete bed.");
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
            Beds
          </h2>
          <p className="mt-2 max-w-lg text-sm text-ink-light">
            {isSuperAdmin
              ? "Add, edit, or remove beds and update their status."
              : "Update bed status (e.g. mark for maintenance)."}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            disabled={rooms.length === 0}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
          >
            <Plus size={16} /> Add Bed
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-3">
        <select
          value={hostelFilter}
          onChange={(e) => {
            setHostelFilter(e.target.value);
            setRoomFilter("");
          }}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
        >
          <option value="">All hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
        >
          <option value="">All rooms</option>
          {roomsForHostel.map((r) => (
            <option key={r.id} value={r.id}>
              {r.hostel.name} · {r.number}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading beds...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && beds.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No beds found for this filter.
        </div>
      )}

      {!loading && !error && beds.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {beds.map((bed) => (
            <div key={bed.id} className="rounded-card border border-line bg-white p-4">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <BedDouble size={16} />
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(bed)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-navy-50 hover:text-navy-900"
                  >
                    <Pencil size={12} />
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setDeleteTarget(bed)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-light transition-colors hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 font-display text-base font-semibold text-ink">
                {bed.number}
              </p>
              <p className="text-xs text-ink-light">
                {bed.room.hostel.name} · Room {bed.room.number}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                  STATUS_STYLES[bed.status] ?? "bg-cream-100 text-ink-light"
                }`}
              >
                {bed.status}
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
                  {editing ? "Edit Bed" : "Add Bed"}
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
                      Room
                    </label>
                    <select
                      value={form.roomId}
                      onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.hostel.name} · {r.number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Bed Number
                  </label>
                  <input
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="e.g. G-31-A"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                  />
                </div>
                {editing && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                    >
                      <option value="free">Free</option>
                      <option value="held">Held</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                )}
              </div>

              {formError && (
                <p className="mt-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {formError}
                </p>
              )}

              <button
                onClick={save}
                disabled={saving || !form.number}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Bed"}
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
                Delete Bed {deleteTarget.number}?
              </h3>
              <p className="mt-2 text-sm text-ink-light">
                This cannot be undone. Beds with an active booking cannot be
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
