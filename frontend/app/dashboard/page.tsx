"use client";

import { useEffect, useState } from "react";
import { BedDouble, Building2, ClipboardList, DoorOpen, Wallet } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";

export default function DashboardPage() {
  const { user } = useAuth();

  const roleLabel =
    user?.type === "admin" ? user.role?.replace("_", " ") : "Student";
  const displayName =
    user?.type === "admin" ? user.name : user?.regNo ?? "Student";

  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({
    availableBeds: 0,
    myBookings: 0,
    pendingPayments: 0,
  });
  const [adminStats, setAdminStats] = useState({
    hostels: 0,
    rooms: 0,
    availableBeds: 0,
  });

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  async function loadStats() {
    setLoading(true);
    try {
      if (user?.type === "student") {
        const [bedsRes, bookingsRes, paymentsRes] = await Promise.all([
          api.get("/bookings/available-beds"),
          api.get("/bookings/my"),
          api.get("/payments/my"),
        ]);
        setStudentStats({
          availableBeds: bedsRes.data.length,
          myBookings: bookingsRes.data.length,
          pendingPayments: paymentsRes.data.filter(
            (p: any) => p.status === "pending",
          ).length,
        });
      } else {
        const [hostelsRes, roomsRes, bedsRes] = await Promise.all([
          api.get("/hostels"),
          api.get("/rooms"),
          api.get("/bookings/available-beds"),
        ]);
        setAdminStats({
          hostels: hostelsRes.data.length,
          rooms: roomsRes.data.length,
          availableBeds: bedsRes.data.length,
        });
      }
    } catch {
      // stats ni za ziada tu; ukurasa unabaki kutumika hata zisipopatikana
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {roleLabel}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Account Overview
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Welcome, {displayName}. Here is your current hostel booking and
        payment status.
      </p>

      {user?.type === "student" ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={BedDouble}
            label="Available Beds"
            value={loading ? "—" : studentStats.availableBeds}
          />
          <StatCard
            icon={ClipboardList}
            label="My Bookings"
            value={loading ? "—" : studentStats.myBookings}
          />
          <StatCard
            icon={Wallet}
            label="Pending Payments"
            value={loading ? "—" : studentStats.pendingPayments}
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Building2}
            label="Hostels"
            value={loading ? "—" : adminStats.hostels}
          />
          <StatCard
            icon={DoorOpen}
            label="Rooms"
            value={loading ? "—" : adminStats.rooms}
          />
          <StatCard
            icon={BedDouble}
            label="Available Beds"
            value={loading ? "—" : adminStats.availableBeds}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-light">
          {label}
        </p>
        <Icon size={16} className="text-navy-700" />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-navy-900">
        {value}
      </p>
    </div>
  );
}
