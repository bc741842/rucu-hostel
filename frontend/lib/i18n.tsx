"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type Lang = "en" | "sw";

/**
 * English text is the key. If a phrase has no Swahili entry yet, the English
 * text is shown, so a missing translation never breaks a page.
 */
const SW: Record<string, string> = {
  // Navigation
  "Dashboard": "Dashibodi",
  "Book a Bed": "Hifadhi Kitanda",
  "Waiting List": "Orodha ya Kusubiri",
  "Waiting Queue": "Foleni ya Kusubiri",
  "Chat": "Mazungumzo",
  "Monitor Chat": "Simamia Mazungumzo",
  "My QR Code": "QR Code Yangu",
  "QR Check-in": "Kuingia kwa QR",
  "My Roommates": "Wenzangu wa Chumba",
  "Maintenance": "Matengenezo",
  "Manage Maintenance": "Simamia Matengenezo",
  "Reports": "Ripoti",
  "My Bookings": "Uhifadhi Wangu",
  "Announcements": "Matangazo",
  "Manage Announcements": "Simamia Matangazo",
  "Rate My Hostel": "Tathmini Hosteli Yangu",
  "Hostel Ratings": "Tathmini za Hosteli",
  "My Payments": "Malipo Yangu",
  "Academic Years": "Miaka ya Masomo",
  "Hostels": "Hosteli",
  "Rooms": "Vyumba",
  "Beds": "Vitanda",
  "Confirm Payments": "Thibitisha Malipo",
  "Audit Log": "Kumbukumbu za Ukaguzi",
  "Log out": "Toka",

  // Shared branding
  "Ruaha Catholic University": "Chuo Kikuu Katoliki cha Ruaha",
  "Hostel Booking System": "Mfumo wa Uhifadhi wa Hosteli",
  "RUCU Hostel Portal": "Tovuti ya Hosteli ya RUCU",

  // Login
  "Log in to continue": "Ingia ili kuendelea",
  "Students, wardens, and staff all sign in here.":
    "Wanafunzi, walezi na wafanyakazi wote huingia hapa.",
  "Registration Number or Username": "Namba ya Usajili au Jina la Mtumiaji",
  "Password": "Nenosiri",
  "Forgot password?": "Umesahau nenosiri?",
  "Log in": "Ingia",
  "Create an account": "Fungua akaunti",
  "Invalid Reg. No./username or password.":
    "Namba ya usajili/jina la mtumiaji au nenosiri si sahihi.",

  // Register
  "Create your account": "Fungua akaunti yako",
  "Register with your student details to start booking a hostel bed.":
    "Jisajili kwa taarifa zako za mwanafunzi ili uanze kuhifadhi kitanda.",
  "Registration Number (RegNo)": "Namba ya Usajili (RegNo)",
  "Full Name": "Jina Kamili",
  "Gender": "Jinsia",
  "Male": "Kiume",
  "Female": "Kike",
  "Year of Study": "Mwaka wa Masomo",
  "Course": "Kozi",
  "Phone (optional)": "Simu (si lazima)",
  "Email (optional)": "Barua pepe (si lazima)",
  "Create Account": "Fungua Akaunti",
  "Already have an account?": "Tayari una akaunti?",
  "Registration failed. Please check your details.":
    "Usajili haukufanikiwa. Tafadhali angalia taarifa zako.",

  // Dashboard
  "Account Overview": "Muhtasari wa Akaunti",
  "Available Beds": "Vitanda Vilivyopo",
  "My Active Bookings": "Uhifadhi Wangu Hai",
  "Pending Payments": "Malipo Yanayosubiri",
  "Tap to browse and book": "Bofya kuvinjari na kuhifadhi",
  "You have no bed yet": "Bado huna kitanda",
  "Pick a hostel, room and bed to start your booking.":
    "Chagua hosteli, chumba na kitanda ili uanze kuhifadhi.",
  "Book a bed": "Hifadhi kitanda",
  "Complete your payment to keep your bed":
    "Kamilisha malipo ili ubaki na kitanda chako",
  "Go to payment": "Nenda kwenye malipo",
  "Your bed is secured": "Kitanda chako kimehakikishwa",
  "My QR code": "QR code yangu",

  // Book a bed
  "Academic Year": "Mwaka wa Masomo",
  "Choose a hostel, then a room, then a bed. Once booked, it will be held for 24 hours while you complete payment.":
    "Chagua hosteli, kisha chumba, kisha kitanda. Ukishahifadhi, utashikiliwa kwa saa 24 ukikamilisha malipo.",
  "No beds are currently available.": "Hakuna vitanda vilivyopo kwa sasa.",
  "Confirm Booking": "Thibitisha Uhifadhi",
  "Booking Confirmed": "Uhifadhi Umethibitishwa",
  "Hostel": "Hosteli",
  "Room": "Chumba",
  "Bed": "Kitanda",
  "Price": "Bei",
  "Control Number": "Namba ya Malipo",
  "Amount": "Kiasi",
  "Expires": "Unaisha",
  "Done": "Sawa",
  "This bed will be held for you for 24 hours. If payment is not completed within that time, it will be released.":
    "Kitanda hiki kitashikiliwa kwa ajili yako kwa saa 24. Malipo yasipokamilika ndani ya muda huo, kitaachiliwa.",
  "Your bed is held. Use the control number below to make payment.":
    "Kitanda chako kimeshikiliwa. Tumia namba ya malipo hapa chini kulipa.",

  // My bookings / payments
  "Booking History": "Historia ya Uhifadhi",
  "All the bed bookings you have made, past and present.":
    "Uhifadhi wote wa vitanda ulioufanya, wa zamani na wa sasa.",
  "No bookings yet": "Bado hujahifadhi",
  "When you book a bed it will appear here with its payment status.":
    "Ukihifadhi kitanda kitaonekana hapa pamoja na hali ya malipo.",
  "Try again": "Jaribu tena",
  "Cancel Booking": "Ghairi Uhifadhi",
  "Cancel this booking?": "Ghairi uhifadhi huu?",
  "Keep Booking": "Endelea Kuhifadhi",
  "Yes, Cancel": "Ndiyo, Ghairi",
  "Payment History": "Historia ya Malipo",
  "Track the status of your hostel fee payments and control numbers.":
    "Fuatilia hali ya malipo ya ada za hosteli na namba za malipo.",
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (text: string) => string;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rucu_lang");
      if (saved === "sw" || saved === "en") setLangState(saved);
    } catch {
      /* storage can be unavailable; English is the fallback */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("rucu_lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (text: string) => (lang === "sw" ? (SW[text] ?? text) : text),
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
