import {
  Hourglass, ListOrdered,
  Megaphone,
  MessageCircle,
  Eye,
  QrCode,
  ScanLine,
  Users,
  Wrench,
  BarChart3,
  Star,
  ShieldAlert,
  KeyRound,
  /* ...icons zako zilizopo tayari... */
} from "lucide-react";
import {
  LayoutDashboard,
  BedDouble,
  ClipboardList,
  Wallet,
  Building2,
  DoorOpen,
  BadgeCheck,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
 
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group?: string;
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
  label: "Waiting List",
  href: "/dashboard/waiting-list",
  icon: Hourglass,
},
{
  label: "Waiting Queue",
  href: "/dashboard/waiting-queue",
  icon: ListOrdered,
  allow: ["super_admin", "warden"],
},
   {
     label: "Chat",
     href: "/dashboard/chat",
     icon: MessageCircle, // import kutoka lucide-react
     allow: ["student"],
   },
   {
     label: "Monitor Chat",
     href: "/dashboard/chat-manage",
     icon: Eye, // au icon yoyote unayopenda
     allow: ["super_admin", "warden", "accountant"],
   },
      {
     label: "My QR Code",
     href: "/dashboard/qr-code",
     icon: QrCode, // kutoka lucide-react
     allow: ["student"],
   },
   {
     label: "QR Check-in",
     href: "/dashboard/checkin",
     icon: ScanLine, // kutoka lucide-react
     allow: ["super_admin", "warden"],
   },
      {
     label: "My Roommates",
     href: "/dashboard/roommates",
     icon: Users, // kutoka lucide-react
     allow: ["student"],
   },
      {
     label: "Maintenance",
     href: "/dashboard/maintenance",
     icon: Wrench,
     allow: ["student"],
   },
   {
     label: "Manage Maintenance",
     href: "/dashboard/maintenance-manage",
     icon: Wrench,
     allow: ["super_admin", "warden"],
   },
      {
     label: "Reports",
     href: "/dashboard/reports",
     icon: BarChart3, // kutoka lucide-react
     allow: ["super_admin", "warden", "accountant"],
   },
 
  {
    label: "My Bookings",
    href: "/dashboard/bookings",
    icon: ClipboardList,
    allow: ["student"],
  },
  {
  label: "Announcements",
  href: "/dashboard/announcements",
  icon: Megaphone,
},
{
  label: "Manage Announcements",
  href: "/dashboard/announcements-manage",
  icon: Megaphone,
  allow: ["super_admin", "warden", "accountant"],
},
   {
     label: "Rate My Hostel",
     href: "/dashboard/ratings",
     icon: Star,
     allow: ["student"],
   },
   {
     label: "Hostel Ratings",
     href: "/dashboard/ratings-summary",
     icon: Star,
     allow: ["super_admin", "warden", "accountant"],
   },
  {
    label: "My Payments",
    href: "/dashboard/payments",
    icon: Wallet,
    allow: ["student"],
  },
  {
    label: "Academic Years",
    href: "/dashboard/academic-years",
    icon: CalendarDays,
    allow: ["super_admin"],
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
  {
    label: "Student Passwords",
    href: "/dashboard/students",
    icon: KeyRound,
    allow: ["super_admin", "warden"],
  },
  {
    label: "Change Password",
    href: "/dashboard/change-password",
    icon: KeyRound,
    allow: ["student"],
  },
  {
    label: "Audit Log",
    href: "/dashboard/audit-log",
    icon: ShieldAlert,
    allow: ["super_admin"],
  },
];
 
const GROUPS: Record<string, string> = {
  Dashboard: "Main",
  "Book a Bed": "Hostel",
  "My Bookings": "Hostel",
  "My Roommates": "Hostel",
  "My QR Code": "Hostel",
  "My Payments": "Finance",
  "Confirm Payments": "Finance",
  "Waiting List": "Hostel",
  "Waiting Queue": "Hostel",
  "QR Check-in": "Hostel",
  Hostels: "Setup",
  Rooms: "Setup",
  Beds: "Setup",
  "Academic Years": "Setup",
  Chat: "Community",
  "Monitor Chat": "Community",
  Announcements: "Community",
  "Manage Announcements": "Community",
  "Rate My Hostel": "Community",
  "Hostel Ratings": "Community",
  Maintenance: "Support",
  "Manage Maintenance": "Support",
  Reports: "Insights",
  "Audit Log": "Insights",
  "Student Passwords": "Setup",
  "Change Password": "Main",
};
const ORDER = ["Main", "Hostel", "Finance", "Community", "Support", "Setup", "Insights"];
for (const item of navItems) item.group = GROUPS[item.label] ?? "Main";
navItems.sort((a, b) => ORDER.indexOf(a.group!) - ORDER.indexOf(b.group!));
