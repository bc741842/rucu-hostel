"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  Hourglass,
  Megaphone,
  Percent,
  QrCode,
  Wallet,
  Wrench,
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

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  hostel: { name: string } | null;
}

interface ReportData {
  occupancy: {
    hostelId: string;
    hostel: string;
    totalBeds: number;
    occupiedBeds: number;
    freeBeds: number;
    occupancyRate: number;
  }[];
  overall: { totalBeds: number; occupiedBeds: number; occupancyRate: number };
  revenue: { total: number };
  checkIns: { checkedIn: number; paidNotCheckedIn: number };
  maintenance: { Open: number; InProgress: number; Resolved: number };
  waitingList: { hostelId: string; hostel: string; count: number }[];
}

const ok = <T,>(r: PromiseSettledResult<T>) =>
  r.status === "fulfilled" ? r.value : null;

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLang();

  const roleLabel =
    user?.type === "admin" ? user.role?.replace("_", " ") : "Student";
  const displayName =
    user?.type === "admin" ? user.name : (user?.regNo ?? "Student");

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // ----- student -----
  const [studentStats, setStudentStats] = useState({
    availableBeds: 0,
    myBookings: 0,
    pendingPayments: 0,
    unread: 0,
    openIssues: 0,
  });
  const [activeBooking, setActiveBooking] = useState<MyBooking | null>(null);
  const [news, setNews] = useState<Announcement[]>([]);

  // ----- admin -----
  const [admin, setAdmin] = useState({
    hostels: 0,
    rooms: 0,
    pendingConfirm: null as number | null,
    yearName: "",
    noYear: false,
  });
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      if (user?.type === "student") await loadStudent();
      else await loadAdmin();
    } finally {
      setLoading(false);
    }
  }

  async function loadStudent() {
    const [beds, bookings, payments, unread, mine, announcements] =
      await Promise.allSettled([
        api.get("/bookings/available-beds"),
        api.get("/bookings/my"),
        api.get("/payments/my"),
        api.get("/notifications/my/unread-count"),
        api.get("/maintenance/my"),
        api.get("/announcements/my"),
      ]);
    const b = ok(bookings)?.data ?? [];
    const active: MyBooking[] = b.filter((x: MyBooking) =>
      ACTIVE_BOOKING_STATUSES.includes(x.status),
    );
    setActiveBooking(active[0] ?? null);
    const unreadData = ok(unread)?.data;
    setStudentStats({
      availableBeds: (ok(beds)?.data ?? []).length,
      myBookings: active.length,
      pendingPayments: (ok(payments)?.data ?? []).filter(
        (p: { status: string }) => p.status === "pending",
      ).length,
      unread:
        typeof unreadData === "number" ? unreadData : (unreadData?.count ?? 0),
      openIssues: (ok(mine)?.data ?? []).filter(
        (m: { status: string }) => m.status !== "Resolved",
      ).length,
    });
    setNews((ok(announcements)?.data ?? []).slice(0, 3));
    setFailed([beds, bookings, payments].every((r) => r.status === "rejected"));
  }

  async function loadAdmin() {
    const isFinance =
      user?.role === "super_admin" || user?.role === "accountant";
    const [hostels, rooms, years, pending] = await Promise.allSettled([
      api.get("/hostels"),
      api.get("/rooms"),
      api.get("/academic-years"),
      isFinance
        ? api.get("/payments", { params: { status: "pending" } })
        : Promise.reject(new Error("not allowed")),
    ]);
    const yearList = ok(years)?.data ?? [];
    const year =
      yearList.find((y: { status: string }) => y.status === "active") ??
      yearList[0];

    let rep: ReportData | null = null;
    if (year) {
      try {
        rep = (
          await api.get("/reports/dashboard", {
            params: { academicYearId: year.id },
          })
        ).data;
      } catch {
        rep = null;
      }
    }
    setReport(rep);
    setAdmin({
      hostels: (ok(hostels)?.data ?? []).length,
      rooms: (ok(rooms)?.data ?? []).length,
      pendingConfirm: ok(pending) ? ok(pending)!.data.length : null,
      yearName: year?.name ?? "",
      noYear: !year,
    });
    setFailed([hostels, rooms, years].every((r) => r.status === "rejected"));
  }

  const welcome =
    lang === "sw"
      ? `Karibu, ${displayName}. Hii ni hali ya sasa ya uhifadhi na malipo yako.`
      : `Welcome, ${displayName}. Here is your current hostel booking and payment status.`;
  const adminWelcome =
    lang === "sw"
      ? `Karibu, ${displayName}. Hii ndiyo hali ya hosteli kwa sasa${admin.yearName ? ` (${admin.yearName})` : ""}.`
      : `Welcome, ${displayName}. Here is how the hostels are doing right now${admin.yearName ? ` (${admin.yearName})` : ""}.`;

  return (
    <div>
      <PageHeader
        eyebrow={roleLabel}
        title="Account Overview"
        description={user?.type === "student" ? welcome : adminWelcome}
      />

      {failed && !loading && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
          <span>{t("Could not load your overview. Please try again.")}</span>
          <button
            onClick={load}
            className="rounded-lg border border-danger-600/30 px-3 py-1.5 font-semibold hover:bg-white/40"
          >
            {t("Try again")}
          </button>
        </div>
      )}

      {user?.type === "student" ? (
        <>
          <NextStep loading={loading} booking={activeBooking} />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard
              icon={BedDouble}
              label="Available Beds"
              value={studentStats.availableBeds}
              loading={loading}
              href="/dashboard/book"
              hint={t("Tap to browse and book")}
            />
            <StatCard
              icon={ClipboardList}
              label="My Active Bookings"
              value={studentStats.myBookings}
              loading={loading}
              href="/dashboard/bookings"
            />
            <StatCard
              icon={Wallet}
              label="Pending Payments"
              value={studentStats.pendingPayments}
              loading={loading}
              href="/dashboard/payments"
            />
            <StatCard
              icon={Bell}
              label="Unread Notifications"
              value={studentStats.unread}
              loading={loading}
              href="/dashboard/notifications"
            />
            <StatCard
              icon={Wrench}
              label="Open Maintenance Requests"
              value={studentStats.openIssues}
              loading={loading}
              href="/dashboard/maintenance"
            />
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-ink">
                {t("Latest Announcements")}
              </h3>
              <Link
                href="/dashboard/announcements"
                className="text-sm font-medium text-navy-700 hover:underline"
              >
                {t("View all")}
              </Link>
            </div>
            {loading ? (
              <Skeleton className="mt-3 h-24 w-full" />
            ) : news.length === 0 ? (
              <p className="mt-3 rounded-card border border-dashed border-line bg-white p-5 text-sm text-ink-light">
                {t("There are no announcements right now.")}
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {news.map((a) => (
                  <Link
                    key={a.id}
                    href="/dashboard/announcements"
                    className="flex items-start gap-3 rounded-card border border-line bg-white p-4 transition-shadow hover:shadow-[0_6px_20px_rgba(20,40,75,0.10)]"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                      <Megaphone size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{a.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-light">
                        {a.message}
                      </p>
                      <p className="mt-1 text-xs text-ink-light">
                        {new Date(a.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {a.hostel ? ` · ${a.hostel.name}` : ""}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <AdminOverview
          loading={loading}
          admin={admin}
          report={report}
          role={user?.role}
        />
      )}
    </div>
  );
}

function AdminOverview({
  loading,
  admin,
  report,
  role,
}: {
  loading: boolean;
  admin: {
    hostels: number;
    rooms: number;
    pendingConfirm: number | null;
    yearName: string;
    noYear: boolean;
  };
  report: ReportData | null;
  role?: string;
}) {
  const { t } = useLang();
  const waiting = report?.waitingList.reduce((s, w) => s + w.count, 0) ?? 0;
  const openIssues =
    (report?.maintenance.Open ?? 0) + (report?.maintenance.InProgress ?? 0);
  const showFinance = role === "super_admin" || role === "accountant";

  // Things that need a person to act, shown first and only when non-zero.
  const todo = [
    admin.pendingConfirm
      ? {
          icon: BadgeCheck,
          text: `${admin.pendingConfirm} ${t("payments waiting to be confirmed")}`,
          href: "/dashboard/confirm-payments",
        }
      : null,
    openIssues > 0 && (role === "super_admin" || role === "warden")
      ? {
          icon: Wrench,
          text: `${openIssues} ${t("open maintenance requests")}`,
          href: "/dashboard/maintenance-manage",
        }
      : null,
    report && report.checkIns.paidNotCheckedIn > 0 && role !== "accountant"
      ? {
          icon: QrCode,
          text: `${report.checkIns.paidNotCheckedIn} ${t("students paid but not checked in")}`,
          href: "/dashboard/checkin",
        }
      : null,
    waiting > 0 && (role === "super_admin" || role === "warden")
      ? {
          icon: Hourglass,
          text: `${waiting} ${t("students on the waiting list")}`,
          href: "/dashboard/waiting-queue",
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof Wrench;
    text: string;
    href: string;
  }[];

  return (
    <>
      {!loading && admin.noYear && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card border border-warning-600/30 bg-warning-50 p-4 text-sm text-warning-600">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="flex-1">
            {t("No academic year is set up, so students cannot book yet.")}
          </span>
          {role === "super_admin" && (
            <Link
              href="/dashboard/academic-years"
              className="inline-flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 font-semibold text-white hover:bg-navy-700"
            >
              <CalendarDays size={14} /> {t("Academic Years")}
            </Link>
          )}
        </div>
      )}

      {(loading || todo.length > 0) && (
        <section className="mt-6">
          <h3 className="font-display text-lg font-semibold text-ink">
            {t("Needs your attention")}
          </h3>
          {loading ? (
            <Skeleton className="mt-3 h-20 w-full" />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {todo.map((x) => (
                <Link
                  key={x.href}
                  href={x.href}
                  className="flex items-center gap-3 rounded-card border border-warning-600/30 bg-warning-50 p-4 text-sm font-medium text-ink transition-shadow hover:shadow-md"
                >
                  <x.icon size={18} className="shrink-0 text-warning-600" />
                  <span className="flex-1">{x.text}</span>
                  <ArrowRight size={16} className="shrink-0 text-ink-light" />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Hostels"
          value={admin.hostels}
          loading={loading}
          href="/dashboard/hostels"
        />
        <StatCard
          icon={DoorOpen}
          label="Rooms"
          value={admin.rooms}
          loading={loading}
          href="/dashboard/rooms"
        />
        <StatCard
          icon={BedDouble}
          label="Total Beds"
          value={report?.overall.totalBeds ?? 0}
          loading={loading}
          href="/dashboard/beds"
        />
        <StatCard
          icon={CheckCircle2}
          label="Free Beds"
          value={
            report ? report.overall.totalBeds - report.overall.occupiedBeds : 0
          }
          loading={loading}
          href="/dashboard/beds"
        />
        <StatCard
          icon={Percent}
          label="Occupancy"
          value={`${report?.overall.occupancyRate ?? 0}%`}
          loading={loading}
          href="/dashboard/reports"
        />
        {showFinance && (
          <StatCard
            icon={Wallet}
            label="Revenue"
            value={`TZS ${(report?.revenue.total ?? 0).toLocaleString()}`}
            loading={loading}
            href="/dashboard/reports"
          />
        )}
        <StatCard
          icon={QrCode}
          label="Checked In"
          value={report?.checkIns.checkedIn ?? 0}
          loading={loading}
          href="/dashboard/checkin"
        />
        <StatCard
          icon={Wrench}
          label="Open Issues"
          value={openIssues}
          loading={loading}
          href="/dashboard/maintenance-manage"
        />
      </div>

      {!loading && report && report.occupancy.length > 0 && (
        <section className="mt-8 rounded-card border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-ink">
              {t("Occupancy by hostel")}
            </h3>
            <Link
              href="/dashboard/reports"
              className="text-sm font-medium text-navy-700 hover:underline"
            >
              {t("Reports")}
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {report.occupancy.map((o) => (
              <div key={o.hostelId}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink">{o.hostel}</span>
                  <span className="text-ink-light">
                    {o.occupiedBeds}/{o.totalBeds} · {o.occupancyRate}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
                  <div
                    className="h-full rounded-full bg-navy-900"
                    style={{ width: `${o.occupancyRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
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
