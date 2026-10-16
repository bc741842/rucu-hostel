"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { navItems } from "../../lib/nav-config";
import DashboardShell from "../../components/layout/DashboardShell";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Role guard: find the nav entry that owns this URL and, if it is
  // restricted, only let the matching roles see it.
  const roleKey = user ? (user.type === "student" ? "student" : user.role) : null;
  const owner = [...navItems]
    .filter((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const forbidden =
    !!user &&
    !!owner?.allow &&
    !owner.allow.includes(roleKey as (typeof owner.allow)[number]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && forbidden) {
      router.replace("/dashboard");
    }
  }, [loading, forbidden, router]);

  if (loading || !user || forbidden) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
