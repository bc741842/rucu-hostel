"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BedDouble,
  Wallet,
  LogIn,
  Wrench,
  Hourglass,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useLang } from "../../../lib/i18n";
import Button from "../../../components/ui/Button";
import { downloadCsv } from "../../../lib/csv";
import { Download, Printer } from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
  status: string;
}

interface Dashboard {
  occupancy: {
    hostelId: string;
    hostel: string;
    totalBeds: number;
    occupiedBeds: number;
    freeBeds: number;
    occupancyRate: number;
  }[];
  overall: {
    totalBeds: number;
    occupiedBeds: number;
    occupancyRate: number;
  };
  revenue: {
    total: number;
    trend: { month: string; amount: number }[];
  };
  checkIns: { checkedIn: number; paidNotCheckedIn: number };
  maintenance: { Open: number; InProgress: number; Resolved: number };
  waitingList: { hostelId: string; hostel: string; count: number }[];
}

function formatTsh(n: number) {
  return "TSh " + n.toLocaleString();
}

export default function ReportsPage() {
  const { t } = useLang();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [yearId, setYearId] = useState("");
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/academic-years").then((res) => {
      setYears(res.data);
      const active = res.data.find((y: AcademicYear) => y.status === "active");
      setYearId(active?.id || res.data[0]?.id || "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (yearId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/reports/dashboard", {
        params: { academicYearId: yearId },
      });
      setData(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Could not load the dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  function exportReport() {
    if (!data) return;
    const year = years.find((y) => y.id === yearId)?.name ?? "";
    downloadCsv(`rucu-report-${year.replace("/", "-")}.csv`, [
      ["RUCU Hostel Report", year],
      [],
      ["Overall occupancy", "Occupied beds", "Total beds", "Rate %"],
      ["", data.overall.occupiedBeds, data.overall.totalBeds, data.overall.occupancyRate],
      [],
      ["Hostel", "Total beds", "Occupied", "Free", "Occupancy %"],
      ...data.occupancy.map((o) => [o.hostel, o.totalBeds, o.occupiedBeds, o.freeBeds, o.occupancyRate]),
      [],
      ["Month", "Revenue (TZS)"],
      ...data.revenue.trend.map((r) => [r.month, r.amount]),
      ["Total revenue", data.revenue.total],
      [],
      ["Checked in", data.checkIns.checkedIn],
      ["Paid, not checked in", data.checkIns.paidNotCheckedIn],
      [],
      ["Maintenance", "Count"],
      ["Open", data.maintenance.Open],
      ["In progress", data.maintenance.InProgress],
      ["Resolved", data.maintenance.Resolved],
      [],
      ["Waiting list by hostel", "Students"],
      ...data.waitingList.map((w) => [w.hostel, w.count]),
    ]);
  }

  const maxRevenue = data
    ? Math.max(...data.revenue.trend.map((t) => t.amount), 1)
    : 1;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Insights")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Reports Dashboard")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("Occupancy, revenue, check-ins and maintenance at a glance.")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 print:hidden">
        <select
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name} {y.status === "active" ? "(active)" : ""}
            </option>
          ))}
        </select>
        {data && !loading && !error && (
          <>
            <Button variant="secondary" icon={<Download size={16} />} onClick={exportReport}>
              {t("Export CSV")}
            </Button>
            <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
              {t("Print / Save PDF")}
            </Button>
          </>
        )}
      </div>

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="mt-6 max-w-4xl space-y-6">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={BedDouble}
              label={t("Occupancy")}
              value={`${data.overall.occupancyRate}%`}
              sub={`${data.overall.occupiedBeds}/${data.overall.totalBeds} beds`}
              color="navy"
            />
            <StatTile
              icon={Wallet}
              label={t("Revenue")}
              value={formatTsh(data.revenue.total)}
              sub="Paid this year"
              color="gold"
            />
            <StatTile
              icon={LogIn}
              label={t("Checked In")}
              value={String(data.checkIns.checkedIn)}
              sub={`${data.checkIns.paidNotCheckedIn} paid, not yet in`}
              color="success"
            />
            <StatTile
              icon={Wrench}
              label={t("Open Issues")}
              value={String(data.maintenance.Open + data.maintenance.InProgress)}
              sub={`${data.maintenance.Resolved} resolved`}
              color="danger"
            />
          </div>

          {/* Occupancy per hostel */}
          <section className="rounded-card border border-line bg-white p-5">
            <p className="text-sm font-semibold text-ink">
              {t("Occupancy by hostel")}
            </p>
            <div className="mt-4 space-y-3">
              {data.occupancy.map((o, i) => (
                <motion.div
                  key={o.hostelId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{o.hostel}</span>
                    <span className="text-ink-light">
                      {o.occupiedBeds}/{o.totalBeds} beds &middot;{" "}
                      {o.occupancyRate}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-navy-900"
                      style={{ width: `${o.occupancyRate}%` }}
                    />
                  </div>
                </motion.div>
              ))}
              {data.occupancy.length === 0 && (
                <p className="text-xs text-ink-light">{t("No hostels found.")}</p>
              )}
            </div>
          </section>

          {/* Revenue trend */}
          <section className="rounded-card border border-line bg-white p-5">
            <p className="text-sm font-semibold text-ink">
              {t("Revenue by month")}
            </p>
            {data.revenue.trend.length === 0 ? (
              <p className="mt-3 text-xs text-ink-light">
                {t("No paid payments recorded yet for this academic year.")}
              </p>
            ) : (
              <div className="mt-4 flex items-end gap-3" style={{ height: 140 }}>
                {data.revenue.trend.map((t, i) => (
                  <div
                    key={t.month}
                    className="flex flex-1 flex-col items-center gap-1.5"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(t.amount / maxRevenue) * 100}px`,
                      }}
                      transition={{ delay: i * 0.05 }}
                      className="w-full max-w-[40px] rounded-t-md bg-gold-500"
                      title={formatTsh(t.amount)}
                    />
                    <span className="text-[10px] text-ink-light">
                      {t.month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Maintenance + Waiting list side by side */}
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-card border border-line bg-white p-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Wrench size={14} /> {t("Maintenance requests")}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <MaintRow label={t("Open")} value={data.maintenance.Open} color="danger" />
                <MaintRow
                  label={t("In Progress")}
                  value={data.maintenance.InProgress}
                  color="gold"
                />
                <MaintRow
                  label={t("Resolved")}
                  value={data.maintenance.Resolved}
                  color="success"
                />
              </div>
            </section>

            <section className="rounded-card border border-line bg-white p-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Hourglass size={14} /> {t("Waiting list by hostel")}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                {data.waitingList.length === 0 ? (
                  <p className="text-xs text-ink-light">
                    {t("No one is currently waiting.")}
                  </p>
                ) : (
                  data.waitingList.map((w) => (
                    <div
                      key={w.hostelId}
                      className="flex items-center justify-between text-ink-light"
                    >
                      <span>{w.hostel}</span>
                      <span className="font-semibold text-ink">
                        {w.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  sub: string;
  color: "navy" | "gold" | "success" | "danger";
}) {
  const colorMap: Record<string, string> = {
    navy: "bg-navy-50 text-navy-700",
    gold: "bg-gold-500/15 text-gold-700",
    success: "bg-success-50 text-success-600",
    danger: "bg-danger-50 text-danger-600",
  };
  return (
    <div className="rounded-card border border-line bg-white p-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${colorMap[color]}`}
      >
        <Icon size={15} />
      </div>
      <p className="mt-3 font-display text-xl font-semibold text-ink">
        {value}
      </p>
      <p className="text-xs text-ink-light">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-light">{sub}</p>
    </div>
  );
}

function MaintRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "danger" | "gold" | "success";
}) {
  const colorMap: Record<string, string> = {
    danger: "text-danger-600",
    gold: "text-gold-700",
    success: "text-success-600",
  };
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-light">{label}</span>
      <span className={`font-semibold ${colorMap[color]}`}>{value}</span>
    </div>
  );
}
