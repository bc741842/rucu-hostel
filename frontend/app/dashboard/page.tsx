"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  QrCode,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { api } from "../../lib/api";
import { useLang } from "../../lib/i18n";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import Skeleton from "../../components/ui/Skeleton";

const ACTIVE_BOOKING_STATUSES = ["Pending", "Paid", "Confirmed", "CheckedIn"];

interface MyBooking {
  id: string;
  status: string;
  expiresAt: string;
  bed: { number: string; room: { number: string; hostel: { name: string } } };
  payment: { controlNumber: string; amount: string; status: string } | null;
}

export default function DashboardPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();

  const roleLabel =
    user?.type === "admin" ? user.role?.replace("_", " ") : "Student";
  const displayName =
    user?.type === "admin" ? user.name : (user?.regNo ?? "Student");

  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({
    availableBeds: 0,
    myBookings: 0,
    pendingPayments: 0,
  });
  const [activeBooking, setActiveBooking] = useState<MyBooking | null>(null);
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
        const active: MyBooking[] = bookingsRes.data.filter((b: MyBooking) =>
          ACTIVE_BOOKING_STATUSES.includes(b.status),
        );
        setActiveBooking(active[0] ?? null);
        setStudentStats({
          availableBeds: bedsRes.data.length,
          myBookings: active.length,
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
      // stats are a bonus; the page stays usable if they fail to load
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={roleLabel}
        title={t("Account Overview")}
        description={
          lang === "sw"
            ? `Karibu, ${displayName}. Hii ni hali ya sasa ya uhifadhi na malipo yako.`
            : `Welcome, ${displayName}. Here is your current hostel booking and payment status.`
        }
      />

      {user?.type === "student" ? (
        <>
          <NextStep loading={loading} booking={activeBooking} />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={BedDouble}
              label={t("Available Beds")}
              value={studentStats.availableBeds}
              loading={loading}
              href="/dashboard/book"
              hint={t("Tap to browse and book")}
            />
            <StatCard
              icon={ClipboardList}
              label={t("My Active Bookings")}
              value={studentStats.myBookings}
              loading={loading}
              href="/dashboard/bookings"
            />
            <StatCard
              icon={Wallet}
              label={t("Pending Payments")}
              value={studentStats.pendingPayments}
              loading={loading}
              href="/dashboard/payments"
            />
          </div>
        </>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={Building2}
            label={t("Hostels")}
            value={adminStats.hostels}
            loading={loading}
            href="/dashboard/hostels"
          />
          <StatCard
            icon={DoorOpen}
            label={t("Rooms")}
            value={adminStats.rooms}
            loading={loading}
            href="/dashboard/rooms"
          />
          <StatCard
            icon={BedDouble}
            label={t("Available Beds")}
            value={adminStats.availableBeds}
            loading={loading}
            href="/dashboard/beds"
          />
        </div>
      )}
    </div>
  );
}

/** Tells the student exactly what to do next, based on their booking. */
function NextStep({
  loading,
  booking,
}: {
  loading: boolean;
  booking: MyBooking | null;
}) {
  const { t, lang } = useLang();
  if (loading) return <Skeleton className="mt-8 h-28 w-full" />;

  if (!booking) {
    return (
      <Banner
        tone="info"
        icon={<BedDouble size={20} />}
        title={t("You have no bed yet")}
        text={t("Pick a hostel, room and bed to start your booking.")}
        href="/dashboard/book"
        cta={t("Book a bed")}
      />
    );
  }

  const where = `${booking.bed.room.hostel.name} · Room ${booking.bed.room.number} · Bed ${booking.bed.number}`;

  if (booking.status === "Pending") {
    const hoursLeft = Math.max(
      0,
      Math.round((new Date(booking.expiresAt).getTime() - Date.now()) / 36e5),
    );
    return (
      <Banner
        tone="warning"
        icon={<AlertTriangle size={20} />}
        title={t("Complete your payment to keep your bed")}
        text={
          lang === "sw"
            ? `${where} umeshikiliwa kwa ajili yako kwa takriban saa ${hoursLeft} zaidi.${
                booking.payment
                  ? ` Namba ya malipo: ${booking.payment.controlNumber}.`
                  : ""
              }`
            : `${where} is held for you for about ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"}.${
                booking.payment
                  ? ` Control number: ${booking.payment.controlNumber}.`
                  : ""
              }`
        }
        href="/dashboard/payments"
        cta={t("Go to payment")}
        badge={<Badge status="Pending" />}
      />
    );
  }

  return (
    <Banner
      tone="success"
      icon={<CheckCircle2 size={20} />}
      title={t("Your bed is secured")}
      text={
        lang === "sw"
          ? `${where}. Onyesha QR code yako hosteli ili uingie.`
          : `${where}. Show your QR code at the hostel to check in.`
      }
      href="/dashboard/qr-code"
      cta={t("My QR code")}
      ctaIcon={<QrCode size={16} />}
      badge={<Badge status={booking.status} />}
    />
  );
}

function Banner({
  tone,
  icon,
  title,
  text,
  href,
  cta,
  ctaIcon,
  badge,
}: {
  tone: "info" | "warning" | "success";
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
  cta: string;
  ctaIcon?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const tones = {
    info: "border-navy-500/20 bg-navy-50 text-navy-700",
    warning: "border-warning-600/30 bg-warning-50 text-warning-600",
    success: "border-success-600/30 bg-success-50 text-success-600",
  };
  return (
    <div
      className={`mt-8 flex flex-wrap items-center gap-4 rounded-card border p-5 ${tones[tone]}`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold text-ink">
          {title} {badge}
        </p>
        <p className="mt-0.5 text-sm text-ink-light">{text}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        {ctaIcon}
        {cta}
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
