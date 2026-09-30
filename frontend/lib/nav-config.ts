import {
  LayoutDashboard,
  BedDouble,
  ClipboardList,
  Wallet,
  Building2,
  DoorOpen,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
 
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allow?: Array<"student" | "super_admin" | "accountant" | "warden">;
}
 
export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Book a Bed",
    href: "/dashboard/book",
    icon: BedDouble,
    allow: ["student"],
  },
  {
    label: "My Bookings",
    href: "/dashboard/bookings",
    icon: ClipboardList,
    allow: ["student"],
  },
  {
    label: "My Payments",
    href: "/dashboard/payments",
    icon: Wallet,
    allow: ["student"],
  },
  {
    label: "Hostels",
    href: "/dashboard/hostels",
    icon: Building2,
    allow: ["super_admin"],
  },
  {
    label: "Rooms",
    href: "/dashboard/rooms",
    icon: DoorOpen,
    allow: ["super_admin"],
  },
  {
    label: "Beds",
    href: "/dashboard/beds",
    icon: BedDouble,
    allow: ["super_admin", "warden"],
  },
  {
    label: "Confirm Payments",
    href: "/dashboard/confirm-payments",
    icon: BadgeCheck,
    allow: ["super_admin", "accountant"],
  },
];
 