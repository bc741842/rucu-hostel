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

  // Remaining pages
  "Communication":
    "Mawasiliano",
  "Post a notice to every student, or target just one hostel. You can optionally attach a PDF document (forms, rules, official letters).":
    "Tuma tangazo kwa kila mwanafunzi, au kwa hosteli moja tu. Unaweza pia kuambatisha hati ya PDF (fomu, kanuni, barua rasmi).",
  "New Announcement":
    "Tangazo Jipya",
  "All Hostels (everyone)":
    "Hosteli Zote (kila mtu)",
  "Attach a PDF document (optional)":
    "Ambatisha hati ya PDF (si lazima)",
  "All Announcements":
    "Matangazo Yote",
  "No announcements have been posted yet.":
    "Bado hakuna tangazo lililotumwa.",
  "Title":
    "Kichwa",
  "Message":
    "Ujumbe",
  "Document title (e.g. Hostel Rules 2026/27)":
    "Kichwa cha hati (mfano: Kanuni za Hosteli 2026/27)",
  "RUCU Hostel":
    "Hosteli ya RUCU",
  "Important updates and notices from the hostel administration.":
    "Taarifa na matangazo muhimu kutoka kwa utawala wa hosteli.",
  "There are no announcements right now.":
    "Hakuna matangazo kwa sasa.",
  "All Hostels":
    "Hosteli Zote",
  "Super Admin":
    "Msimamizi Mkuu",
  "A record of sensitive actions taken by staff — payment confirmations, maintenance status changes, announcements, and other data changes.":
    "Kumbukumbu za vitendo nyeti vilivyofanywa na wafanyakazi: uthibitisho wa malipo, mabadiliko ya matengenezo, matangazo na mabadiliko mengine ya data.",
  "Staff member":
    "Mfanyakazi",
  "All staff":
    "Wafanyakazi wote",
  "Action contains":
    "Kitendo kina",
  "From":
    "Kuanzia",
  "Apply":
    "Tumia",
  "Clear":
    "Futa",
  "Loading...":
    "Inapakia...",
  "No audit log entries match these filters.":
    "Hakuna kumbukumbu zinazolingana na vichujio hivi.",
  "Before":
    "Kabla",
  "After":
    "Baada",
  "e.g. payment, maintenance":
    "mfano: malipo, matengenezo",
  "Manage":
    "Simamia",
  "All hostels":
    "Hosteli zote",
  "All rooms":
    "Vyumba vyote",
  "No beds found for this filter.":
    "Hakuna vitanda vinavyolingana na kichujio hiki.",
  "Bed Number":
    "Namba ya Kitanda",
  "Status":
    "Hali",
  "Free":
    "Wazi",
  "Held":
    "Kimeshikiliwa",
  "Occupied":
    "Kimekaliwa",
  "This cannot be undone. Beds with an active booking cannot be deleted.":
    "Hili haliwezi kutenduliwa. Vitanda vyenye uhifadhi hai haviwezi kufutwa.",
  "Cancel":
    "Ghairi",
  "Community":
    "Jamii",
  "Read-only view of hostel group chats, including shared photos, audio, video and other files. Remove any message that breaks the rules.":
    "Mwonekano wa kusoma tu wa mazungumzo ya vikundi vya hosteli, ikiwemo picha, sauti, video na faili zilizotumwa. Ondoa ujumbe wowote unaovunja kanuni.",
  "All Hostels (global group)":
    "Hosteli Zote (kundi la wote)",
  "Loading chat...":
    "Inapakia mazungumzo...",
  "No messages in this group yet.":
    "Bado hakuna ujumbe kwenye kundi hili.",
  "Download":
    "Pakua",
  "Delete message":
    "Futa ujumbe",
  "Talk with your hostel mates, or with everyone across the hostels.":
    "Zungumza na wenzako wa hosteli, au na kila mtu katika hosteli zote.",
  "My Hostel":
    "Hosteli Yangu",
  "No messages yet in your hostel group.":
    "Bado hakuna ujumbe kwenye kundi la hosteli yako.",
  "You need an active bed booking to join this chat.":
    "Unahitaji uhifadhi hai wa kitanda ili ujiunge na mazungumzo haya.",
  "No messages yet. Say hello!":
    "Bado hakuna ujumbe. Anza kwa salamu!",
  "Emoji":
    "Emoji",
  "Attach a file (up to 10MB)":
    "Ambatisha faili (hadi 10MB)",
  "Hostel Operations":
    "Uendeshaji wa Hosteli",
  "Scan a student's QR code at the gate, or enter their code manually.":
    "Changanua QR code ya mwanafunzi getini, au andika namba yake mwenyewe.",
  "Camera scanner":
    "Kichanganuzi cha kamera",
  "Start":
    "Anza",
  "Stop":
    "Simamisha",
  "Camera preview appears here once started.":
    "Picha ya kamera itaonekana hapa ukishaanza.",
  "Enter code manually":
    "Andika namba mwenyewe",
  "Use this if the camera isn't available.":
    "Tumia hii kamera isipopatikana.",
  "Paste or type the QR code":
    "Bandika au andika namba ya QR",
  "Accounts":
    "Hesabu",
  "No pending payments right now.":
    "Hakuna malipo yanayosubiri kwa sasa.",
  "Control No.":
    "Namba ya Malipo",
  "Student":
    "Mwanafunzi",
  "Action":
    "Kitendo",
  "Confirm":
    "Thibitisha",
  "Confirm Payment":
    "Thibitisha Malipo",
  "Only confirm after verifying this control number was actually paid at the bank/payment channel.":
    "Thibitisha tu baada ya kuhakiki kuwa namba hii ya malipo imelipwa kweli benki au kwenye njia ya malipo.",
  "Add, edit, or remove hostels available for booking.":
    "Ongeza, hariri au ondoa hosteli zinazopatikana kwa uhifadhi.",
  "Add Hostel":
    "Ongeza Hosteli",
  "Name":
    "Jina",
  "Gender Allowed":
    "Jinsia Inayoruhusiwa",
  "Location (optional)":
    "Eneo (si lazima)",
  "This cannot be undone. Hostels with existing rooms cannot be deleted.":
    "Hili haliwezi kutenduliwa. Hosteli zenye vyumba haziwezi kufutwa.",
  "Manage Maintenance Requests":
    "Simamia Maombi ya Matengenezo",
  "Track and resolve issues reported by students.":
    "Fuatilia na tatua matatizo yaliyoripotiwa na wanafunzi.",
  "All statuses":
    "Hali zote",
  "Open":
    "Wazi",
  "In Progress":
    "Inashughulikiwa",
  "Resolved":
    "Imetatuliwa",
  "No maintenance requests match this filter.":
    "Hakuna maombi ya matengenezo yanayolingana na kichujio hiki.",
  "Optional note for the student (e.g. what was fixed)":
    "Maelezo kwa mwanafunzi (si lazima, mfano: kilichorekebishwa)",
  "Support":
    "Msaada",
  "Maintenance Requests":
    "Maombi ya Matengenezo",
  "Report a problem with your room or any common area in your hostel.":
    "Ripoti tatizo kwenye chumba chako au eneo lolote la pamoja katika hosteli yako.",
  "Report a new issue":
    "Ripoti tatizo jipya",
  "Location":
    "Mahali",
  "Describe the problem":
    "Elezea tatizo",
  "Report submitted.":
    "Ripoti imetumwa.",
  "My reports":
    "Ripoti zangu",
  "You haven't reported anything yet.":
    "Bado hujaripoti chochote.",
  "e.g. My room (Room 12, Bed B) or 2nd floor common bathroom":
    "mfano: Chumba changu (Chumba 12, Kitanda B) au bafu la pamoja ghorofa ya 2",
  "What's wrong and since when?":
    "Tatizo ni nini na tangu lini?",
  "Notifications":
    "Arifa",
  "Mark all as read":
    "Weka zote kuwa zimesomwa",
  "No notifications yet":
    "Bado hakuna arifa",
  "Check-in":
    "Kuingia",
  "My Check-in QR Code":
    "QR Code Yangu ya Kuingia",
  "Show this code to the warden or admin at the hostel gate to check in.":
    "Onyesha namba hii kwa mlezi au msimamizi getini mwa hosteli ili uingie.",
  "You're already checked in":
    "Tayari umeshaingia",
  "Scan at the hostel gate":
    "Changanua getini mwa hosteli",
  "Feedback":
    "Maoni",
  "What students think of their hostels.":
    "Wanafunzi wanavyoona hosteli zao.",
  "No ratings submitted yet.":
    "Bado hakuna tathmini zilizotumwa.",
  "Recent feedback":
    "Maoni ya hivi karibuni",
  "No written feedback yet.":
    "Bado hakuna maoni yaliyoandikwa.",
  "Rate Your Hostel":
    "Tathmini Hosteli Yako",
  "Tell us how your stay has been. You can update this anytime.":
    "Tuambie makazi yako yamekuwaje. Unaweza kubadilisha wakati wowote.",
  "Thank you for your feedback!":
    "Asante kwa maoni yako!",
  "Anything you'd like to share? (optional)":
    "Kuna unachotaka kushiriki? (si lazima)",
  "Insights":
    "Uchambuzi",
  "Reports Dashboard":
    "Dashibodi ya Ripoti",
  "Occupancy, revenue, check-ins and maintenance at a glance.":
    "Ukaaji, mapato, walioingia na matengenezo kwa muhtasari.",
  "Occupancy by hostel":
    "Ukaaji kwa hosteli",
  "No hostels found.":
    "Hakuna hosteli zilizopatikana.",
  "Revenue by month":
    "Mapato kwa mwezi",
  "No paid payments recorded yet for this academic year.":
    "Bado hakuna malipo yaliyorekodiwa kwa mwaka huu wa masomo.",
  "Maintenance requests":
    "Maombi ya matengenezo",
  "Waiting list by hostel":
    "Orodha ya kusubiri kwa hosteli",
  "No one is currently waiting.":
    "Hakuna anayesubiri kwa sasa.",
  "Occupancy":
    "Ukaaji",
  "Revenue":
    "Mapato",
  "Checked In":
    "Walioingia",
  "Open Issues":
    "Matatizo Yaliyo Wazi",
  "Students who share your room for this academic year.":
    "Wanafunzi wanaoshiriki chumba chako mwaka huu wa masomo.",
  "No one else has booked into your room yet.":
    "Bado hakuna mwingine aliyehifadhi kwenye chumba chako.",
  "Add, edit, or remove rooms and their pricing.":
    "Ongeza, hariri au ondoa vyumba na bei zake.",
  "Add Room":
    "Ongeza Chumba",
  "No rooms found.":
    "Hakuna vyumba vilivyopatikana.",
  "Floor":
    "Ghorofa",
  "Room Number":
    "Namba ya Chumba",
  "Price (TZS)":
    "Bei (TZS)",
  "This cannot be undone. Rooms with existing beds cannot be deleted.":
    "Hili haliwezi kutenduliwa. Vyumba vyenye vitanda haviwezi kufutwa.",
  "Bed Waiting List":
    "Orodha ya Kusubiri Kitanda",
  "Join a Waiting List":
    "Jiunge na Orodha ya Kusubiri",
  "You are already on the waiting list for every available hostel.":
    "Tayari uko kwenye orodha ya kusubiri ya kila hosteli iliyopo.",
  "My Waiting List Entries":
    "Orodha Zangu za Kusubiri",
  "A bed is becoming available — please check back soon.":
    "Kitanda kinakaribia kupatikana. Tafadhali rudi hivi karibuni.",
  "Bed Waiting Queue":
    "Foleni ya Kusubiri Kitanda",
  "A FIFO list of students waiting for a bed, by hostel. Contact them in this order as beds become available.":
    "Orodha ya wanafunzi wanaosubiri kitanda kwa hosteli, aliyetangulia anahudumiwa kwanza. Wasiliana nao kwa mpangilio huu vitanda vinapopatikana.",
  "No students are currently waiting.":
    "Hakuna wanafunzi wanaosubiri kwa sasa.",
  "Reset your password":
    "Weka nenosiri jipya",
  "Use a different Reg. No.":
    "Tumia namba nyingine ya usajili",
  "Your password has been changed successfully.":
    "Nenosiri lako limebadilishwa kikamilifu.",
  "6-digit OTP":
    "OTP ya tarakimu 6",
  "New Password":
    "Nenosiri Jipya",
  "Confirm New Password":
    "Thibitisha Nenosiri Jipya",
  "Search...":
    "Tafuta...",
  "of":
    "kati ya",
  "Previous page":
    "Ukurasa uliopita",
  "Next page":
    "Ukurasa unaofuata",
  "No results match your search.":
    "Hakuna matokeo yanayolingana na utafutaji wako.",
  "Export CSV":
    "Pakua CSV",
  "Search student, control number...":
    "Tafuta mwanafunzi, namba ya malipo...",
  "Search room number...":
    "Tafuta namba ya chumba...",
  "Search bed number...":
    "Tafuta namba ya kitanda...",
  "Search description, student...":
    "Tafuta maelezo, mwanafunzi...",
  "Print / Save PDF":
    "Chapisha / Hifadhi PDF",
  "Available":
    "Kipo",
  "Taken":
    "Kimeshachukuliwa",
  "Unavailable":
    "Hakipatikani",
  "Switch to dark mode":
    "Tumia hali ya giza",
  "Switch to light mode":
    "Tumia hali ya mwanga",
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
