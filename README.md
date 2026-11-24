# QueueCheck – Smart Hospital Queue Tracking Platform (Chennai, Tamil Nadu)

> **Tagline:** *"Check the Queue. Plan Your Visit."* / *"வரிசையை சரிபாருங்கள். உங்கள் வருகையை திட்டமிடுங்கள்."*  
> **Target Market:** Chennai, Tamil Nadu, India (Architected for expansion across India).  
> **Platform:** Responsive Web Application (Optimized for Android Mobile Chrome, Safari, Tablets, and Desktop Browsers).

QueueCheck is a data-integrated hospital and clinic queue management web platform designed to help patients check live hospital queues and estimated doctor waiting times before leaving home, reducing congestion in crowded waiting halls and empowering patients to plan their outpatient visits.

---

## 🛡️ Zero-Fabrication & Data Transparency Policy

QueueCheck strictly adheres to real-world healthcare data integrity:
- **No Fabricated Patients or Fake Queues:** We never invent patient counts, simulated doctors, or deceptive live queue counters for unpartnered public hospitals.
- **Queue Freshness States:**
  - `LIVE`: Live queue actively managed and updated by authorized hospital reception staff (e.g. Apollo Hospitals Greams Road, Kauvery Hospital Alwarpet pilot desks).
  - `RECENTLY_UPDATED`: Actual queue data was received recently from authorized clinic staff, but real-time connection is currently idle.
  - `UNAVAILABLE`: For unpartnered public hospitals, the system explicitly displays: **"Live queue information is currently unavailable."**
  - `DEMO`: Explicitly labelled sample queues for training or development.

---

## 🌟 Real-World Data Integration

### 1. Genuine Chennai Healthcare Institutions
Pre-seeded and verified with real addresses, geocoordinates, official phone numbers, emergency helplines, websites, and clinical departments:
- **Apollo Hospitals (Greams Road)** – *Authorized Partner Pilot Desk*
- **Kauvery Hospital (Alwarpet)** – *Authorized Partner Pilot Desk*
- **Rajiv Gandhi Government General Hospital (RGGGH)** – *Verified Public Directory (Live queue unavailable)*
- **Fortis Malar Hospital (Adyar)** – *Verified Public Directory*
- **MIOT International (Manapakkam)** – *Verified Public Directory*
- **Government Stanley Medical College Hospital** – *Verified Public Directory*
- **Sankara Nethralaya Eye Hospital (Nungambakkam)** – *Verified Public Directory*
- **Government Kilpauk Medical College Hospital (KMC)** – *Verified Public Directory*
- **Tamil Nadu Govt. Multi Super Speciality Hospital (Omandurar)** – *Verified Public Directory*
- **Vijaya Hospital (Vadapalani)** – *Verified Public Directory*

### 2. Live OpenStreetMap (Overpass API) Synchronization
- Live queries to the OpenStreetMap Overpass API (`https://overpass-api.de/api/interpreter`) for Chennai bounding box `[12.95, 80.12, 13.20, 80.32]`.
- Automatically extracts `amenity=hospital` and `amenity=clinic` nodes, street addresses, emergency phone numbers, and operating hours.
- Complies with OSM Nominatim / Overpass rate limits (2000ms debounce, custom User-Agent, and local caching).

---

## 👥 Three Core User Experiences

### A. Patient Experience (Bilingual English / தமிழ்)
- **Landing Page (`/`):** Hero search by hospital name, specialty, or Chennai locality (Kilpauk, Alwarpet, Adyar, Vadapalani, T. Nagar), quick token tracker bar, and data transparency guarantee.
- **Clinic Discovery (`/clinics`):**
  - Search by name or department.
  - Filter by area and "Partner Clinics with Live Queues Only".
  - Sort by shortest wait time, distance from Central Chennai, or name.
  - Interactive Leaflet map with color-coded status markers (emerald for live partner desks, slate for public directories).
  - One-click "Query Live from OpenStreetMap" button.
- **Clinic Detail (`/clinics/:id`):**
  - Official reception contact numbers, emergency lines (`108`, `1066`), operating hours, verified department directory, and source registry links.
  - Independent queues per doctor for partner clinics.
  - "Request QueueCheck for this Hospital" for public unpartnered facilities.
- **Live Queue Tracker (`/track?token=A028`):**
  - Patient token number, currently serving token, patients ahead count.
  - Estimated waiting time range and calculation confidence indicator.
  - Visual queue progress indicator.
  - Approaching turn alert chime and banner notifications (when turn is $\le 2$ patients away).
  - Medical triaging disclaimer.
- **Patient Dashboard (`/patient-dashboard`):**
  - View current active waiting token with real-time status.
  - Cancel waiting token with a safe confirmation modal.
  - Consultation history and quick access to book partner tokens.

### B. Receptionist / Clinic Staff Dashboard (`/receptionist`)
- **Multi-Hospital & Doctor Selector:** Grouped into authorized partner desks vs public directory facilities.
- **Public Directory Safeguard:** Prevents accidental token generation for unpartnered public hospitals.
- **Walk-in Patient Registration:** Issues sequential daily tokens (`A029`, `B015`, `C010`) with patient name, optional mobile number, and category (`general`, `followup`, `emergency`, `senior`).
- **Live Queue Orchestration:**
  - `Call Next`: Advances queue, sets current token to consulting, alerts tracking patient.
  - `Complete`: Marks consultation finished, logging duration for prediction calculation.
  - `Skip Patient`: Postpones non-responsive patients with confirmation modal.
  - `Mark No-Show`: Logs no-shows with audit entry.
  - `Pause Queue / Resume Queue`: Pauses line for doctor breaks or emergencies, broadcasting an alert to patients.

### C. Platform Admin Dashboard (`/admin`)
- **Health Centers Directory:** Add new clinics with latitude/longitude; approve, deactivate, or activate accounts.
- **Data Sources & Verification Matrix:**
  - Audit information sources (OpenStreetMap, Official Hospital Websites, Partner Reception Desks).
  - Toggle Partner Live Queue Desk authorization on any facility.
  - Toggle Verification Status (`verified`, `unverified`, `pending`).
  - Trigger on-demand OpenStreetMap Overpass synchronization.
- **Live Queue Event Audit Log:** Real-time stream of all events (`registered`, `called`, `completed`, `cancelled`, `skipped`, `no_show`, `paused`, `resumed`) with timestamps, token numbers, and notes.
- **Database-Backed Usage Analytics:** Token distribution per clinic and token lifecycle status breakdown bars.
- **System Health Monitor:** Displays Supabase PostgreSQL / Realtime connectivity status or Reactive Local Store status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, React Router v7 |
| **Maps** | OpenStreetMap with Leaflet (Color-coded live status pins) |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Realtime, Supabase Auth |
| **Data Resiliency** | Dual-mode: Connects to Supabase when configured; automatically runs a cross-tab reactive `BroadcastChannel` + `localStorage` event-driven architecture offline |
| **AI Wait Prediction** | Transparent rule-based wait time engine (TypeScript) + Python FastAPI / Scikit-Learn microservice |
| **Audio Synthesizer** | In-browser Web Audio API synthesizer for patient turn alerts |

---

## 🗄️ PostgreSQL Database Schema (`schema.sql`)

The database script in `schema.sql` establishes 11 normalized tables:
1. `profiles`: Role-based authentication (`patient`, `receptionist`, `admin`).
2. `hospitals`: Healthcare facilities, coordinates, contact, operating hours, data source, and partner queue flag.
3. `hospital_sources`: Source provenance, URLs, verification status, and license (e.g. ODbL).
4. `departments`: Clinical departments and consultation room details.
5. `doctors`: Medical staff, qualifications, specialties, and consultation baseline times.
6. `hospital_staff`: Staff assignments linking users to hospitals.
7. `patients`: Patient profiles and contact records.
8. `queues`: Daily doctor consultation queues with status (`active`, `paused`, `closed`).
9. `tokens`: Sequential daily patient tokens with status lifecycle (`waiting`, `consulting`, `completed`, `skipped`, `no_show`, `cancelled`).
10. `queue_events`: Immutable audit trail for all queue mutations.
11. `predictions`: AI waiting time calculations with uncertainty bounds and confidence levels.

---

## 🧠 Transparent Waiting-Time Estimation Engine

Estimated waiting time is calculated using actual queue dynamics:

$$\text{Estimated Wait Time} = \sum_{i=1}^{\text{Patients Ahead}} \text{Average Duration}_i + \text{Remaining Time of Current Consultation} + \text{Queue Pause Buffer}$$

- **Dynamic Rolling Average:** Uses actual completed consultation durations $(t_{\text{completed}} - t_{\text{called}})$ for the attending doctor today.
- **Current Patient Offset:** Deducts elapsed consultation time for the patient currently in the chamber.
- **Pause & Break Buffer:** Accounts for paused queues or emergency interruptions.
- **Transparent Confidence Levels:**
  - **High:** $\ge 8$ completed consultations today with consistent durations.
  - **Moderate:** $3 - 7$ completed consultations.
  - **Preliminary:** $< 3$ completed consultations or queue paused.

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or yarn

### 2. Run the Web Application
```bash
# Navigate to project directory
cd C:\Users\S2\Desktop\queuecheck

# Start development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

### 3. Production Build
```bash
npm run build
```
Generates production-optimized static assets in `/dist`.

---

## 🔑 1-Click Role Switcher (Top Banner)

Test all roles instantly using the top banner or `/login`:
- **Patient:** S. Lakshmi (Tracking active Token `A028` at Apollo Greams Road).
- **Apollo Receptionist:** V. Sumathi (Managing Apollo Greams Road OPD Desk 2).
- **Kauvery Receptionist:** K. Gomathi (Managing Kauvery Hospital Alwarpet OPD Desk).
- **Platform Administrator:** Chennai Operations Admin (Auditing sources, verifying listings, viewing audit logs).

---

## 🌐 Supabase Realtime Setup (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL statements from [`schema.sql`](file:///C:/Users/S2/Desktop/queuecheck/schema.sql) in the Supabase SQL Editor.
3. Configure your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart Vite. The application will connect directly to Supabase PostgreSQL and subscribe to live token and queue events.
