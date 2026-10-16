"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronRight,
  DoorOpen,
  Loader2,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface Bed {
  id: string;
  number: string;
  status: string;
  room: {
    id: string;
    number: string;
    floor: number | null;
    price: string;
    hostel: {
      id: string;
      name: string;
      genderAllowed: string;
    };
  };
}

interface AcademicYear {
  id: string;
  name: string;
}

interface RoomGroup {
  id: string;
  number: string;
  floor: number | null;
  price: string;
  beds: Bed[];
}

interface HostelGroup {
  id: string;
  name: string;
  genderAllowed: string;
  rooms: Record<string, RoomGroup>;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

export default function BookBedPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedHostelId, setSelectedHostelId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [bedsRes, yearsRes] = await Promise.all([
        api.get("/bookings/available-beds"),
        api.get("/academic-years"),
      ]);
      setBeds(bedsRes.data);
      if (yearsRes.data?.length > 0) {
        setAcademicYear(yearsRes.data[0]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load available beds. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const hostelGroups = useMemo(() => {
    const groups: Record<string, HostelGroup> = {};
    for (const bed of beds) {
      const h = bed.room.hostel;
      const r = bed.room;
      if (!groups[h.id]) {
        groups[h.id] = { id: h.id, name: h.name, genderAllowed: h.genderAllowed, rooms: {} };
      }
      if (!groups[h.id].rooms[r.id]) {
        groups[h.id].rooms[r.id] = { id: r.id, number: r.number, floor: r.floor, price: r.price, beds: [] };
      }
      groups[h.id].rooms[r.id].beds.push(bed);
    }
    return groups;
  }, [beds]);

  const hostelList = Object.values(hostelGroups);
  const currentHostel = selectedHostelId ? hostelGroups[selectedHostelId] : null;
  const roomList = currentHostel ? Object.values(currentHostel.rooms) : [];
  const currentRoom = currentHostel && selectedRoomId ? currentHostel.rooms[selectedRoomId] : null;

  async function confirmBooking() {
    if (!selectedBed || !academicYear) return;
    setBooking(true);
    setBookingError("");
    try {
      const res = await api.post("/bookings", {
        bedId: selectedBed.id,
        academicYearId: academicYear.id,
      });
      setBookingResult(res.data);
      setBeds((prev) => prev.filter((b) => b.id !== selectedBed.id));
    } catch (err: any) {
      setBookingError(
        err?.response?.data?.message ||
          "Booking failed. This bed may no longer be available.",
      );
    } finally {
      setBooking(false);
    }
  }

  function closeModal() {
    setSelectedBed(null);
    setBookingResult(null);
    setBookingError("");
  }

  function goToHostels() {
    setSelectedHostelId(null);
    setSelectedRoomId(null);
  }

  function goToRooms() {
    setSelectedRoomId(null);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {academicYear ? academicYear.name : "Academic Year"}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Book a Bed
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Choose a hostel, then a room, then a bed. Once booked, it will be held
        for 24 hours while you complete payment.
      </p>

      {!loading && !error && hostelList.length > 0 && (
        <div className="mt-5 flex items-center gap-1.5 text-sm">
          <button
            onClick={goToHostels}
            className={`font-medium ${
              !selectedHostelId ? "text-navy-900" : "text-ink-light hover:text-navy-900"
            }`}
          >
            Hostels
          </button>
          {currentHostel && (
            <>
              <ChevronRight size={14} className="text-ink-light" />
              <button
                onClick={goToRooms}
                className={`font-medium ${
                  !selectedRoomId ? "text-navy-900" : "text-ink-light hover:text-navy-900"
                }`}
              >
                {currentHostel.name}
              </button>
            </>
          )}
          {currentRoom && (
            <>
              <ChevronRight size={14} className="text-ink-light" />
              <span className="font-medium text-navy-900">
                Room {currentRoom.number}
              </span>
            </>
          )}
        </div>
      )}

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && hostelList.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No beds are currently available.
        </div>
      )}

      {/* LEVEL 1: Hostel cards */}
      {!loading && !currentHostel && hostelList.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {hostelList.map((hostel) => {
            const bedCount = Object.values(hostel.rooms).reduce(
              (sum, r) => sum + r.beds.length,
              0,
            );
            const roomCount = Object.keys(hostel.rooms).length;
            return (
              <motion.button
                key={hostel.id}
                variants={itemVariants}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedHostelId(hostel.id)}
                className="group flex flex-col items-start rounded-card border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-navy-500 hover:shadow-md"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                  <Building2 size={20} />
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-ink">
                  {hostel.name}
                </p>
                <p className="text-xs capitalize text-ink-light">
                  {hostel.genderAllowed} hostel
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-navy-50 px-2.5 py-1 font-medium text-navy-700">
                    {roomCount} rooms
                  </span>
                  <span className="rounded-full bg-gold-500/15 px-2.5 py-1 font-medium text-gold-700">
                    {bedCount} beds free
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* LEVEL 2: Room cards */}
      {!loading && currentHostel && !currentRoom && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {roomList.map((room) => (
            <motion.button
              key={room.id}
              variants={itemVariants}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedRoomId(room.id)}
              className="group flex flex-col items-start rounded-card border border-line bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-navy-500 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                <DoorOpen size={18} />
              </span>
              <p className="mt-3 font-display text-base font-semibold text-ink">
                Room {room.number}
              </p>
              <p className="text-xs text-ink-light">
                Floor {room.floor ?? "-"}
              </p>
              <p className="mt-2 text-sm font-semibold text-navy-900">
                TZS {Number(room.price).toLocaleString()}
              </p>
              <span className="mt-3 rounded-full bg-gold-500/15 px-2.5 py-1 text-xs font-medium text-gold-700">
                {room.beds.length} beds free
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* LEVEL 3: Bed cards */}
      {!loading && currentRoom && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {currentRoom.beds.map((bed) => (
            <motion.button
              key={bed.id}
              variants={itemVariants}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedBed(bed)}
              className="group flex flex-col rounded-card border border-line bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-navy-500 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                <BedDouble size={16} />
              </span>
              <p className="mt-3 font-display text-base font-semibold text-ink">
                {bed.number}
              </p>
              <p className="mt-1 text-sm font-semibold text-navy-900">
                TZS {Number(bed.room.price).toLocaleString()}
              </p>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Booking modal */}
      <AnimatePresence>
        {selectedBed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4"
            onClick={closeModal}
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
                  {bookingResult ? "Booking Confirmed" : "Confirm Booking"}
                </h3>
                <button onClick={closeModal} className="text-ink-light hover:text-ink">
                  <X size={18} />
                </button>
              </div>

              {!bookingResult ? (
                <>
                  <div className="mt-4 space-y-2 rounded-lg bg-cream p-4 text-sm">
                    <Row label="Hostel" value={selectedBed.room.hostel.name} />
                    <Row label="Room" value={selectedBed.room.number} />
                    <Row label="Bed" value={selectedBed.number} />
                    <Row
                      label="Price"
                      value={`TZS ${Number(selectedBed.room.price).toLocaleString()}`}
                    />
                  </div>

                  <p className="mt-3 text-xs text-ink-light">
                    This bed will be held for you for 24 hours. If payment is
                    not completed within that time, it will be released.
                  </p>

                  {bookingError && (
                    <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                      {bookingError}
                    </p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={confirmBooking}
                    disabled={booking}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
                  >
                    {booking && <Loader2 size={16} className="animate-spin" />}
                    Confirm Booking
                  </motion.button>
                </>
              ) : (
                <>
                  <div className="mt-4 flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <CheckCircle2 size={40} className="text-success-600" />
                    </motion.div>
                    <p className="mt-3 text-sm text-ink-light">
                      Your bed is held. Use the control number below to make
                      payment.
                    </p>
                  </div>
                  <div className="mt-4 space-y-2 rounded-lg bg-cream p-4 text-sm">
                    <Row
                      label="Control Number"
                      value={bookingResult.payment?.controlNumber ?? "-"}
                      emphasize
                    />
                    <Row
                      label="Amount"
                      value={`TZS ${Number(bookingResult.payment?.amount ?? 0).toLocaleString()}`}
                    />
                    <Row
                      label="Expires"
                      value={new Date(bookingResult.expiresAt).toLocaleString()}
                    />
                  </div>
                  <button
                    onClick={closeModal}
                    className="mt-5 w-full rounded-lg border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    Done
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-light">{label}</span>
      <span
        className={
          emphasize
            ? "font-display text-base font-semibold text-navy-900"
            : "font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}
