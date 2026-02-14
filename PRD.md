# Product Requirements Document (PRD) – MedTrack MY

## 1. Executive Summary

**MedTrack MY** is a medication compliance web application tailored for Malaysian healthcare. It supports the full clinic flow: front desk registers patients and assigns them to doctors, doctors prescribe and monitor adherence, and patients log daily doses with one tap.

**Primary Goal:** Reduce hospital readmissions caused by medication non-compliance through a simple logging interface for patients and a risk-stratified dashboard for clinicians.

---

## 2. User Roles & Personas

| Role | Persona | Responsibilities |
|------|---------|------------------|
| **Admin** | *Hospital Admin* | Registers staff (Doctors, Front Desk, Admins). Full access to user management and overview stats. |
| **Frontdesk** | *Receptionist / Front Desk* | Registers patients, links patients to doctors. Handles onboarding before prescriptions. |
| **Doctor** | *Dr. Sarah (Cardiologist)* | Views linked patients, prescribes medications, monitors risk scores, sends nudges, imports discharge meds. |
| **Patient** | *Pak Cik Ali (65, Post-AMI)* | Views daily med schedule, logs doses (Taken/Skipped), views adherence history and streaks. |

---

## 3. End-to-End Workflow

1. **Setup (Admin)**
   - Admin creates Doctor and Front Desk accounts via **Register Staff**.
   - Admin can optionally register patients and link them to doctors.

2. **Patient Onboarding (Frontdesk)**
   - Front desk logs in and goes to Front Desk Dashboard.
   - Registers new patient (name, username, password, MRN, phone, DOB).
   - Assigns patient to a doctor via **Assign Patient to Doctor**.
   - Patient receives username and password (e.g., `patient1` / `medtrack123`).

3. **Prescription (Doctor)**
   - Doctor logs in and selects a linked patient.
   - Uses **Prescribe** to add discharge medications (name, dose, route, frequency, times, critical).
   - System creates a medication plan and scheduled doses for the next 7 days (or plan duration).
   - Doctor can also use **Import** for bulk JSON import from legacy systems.

4. **Adherence (Patient)**
   - Patient logs in with username and password.
   - Sees **Today’s Schedule** grouped by time (Morning, Afternoon, Night).
   - Taps **Taken** or **Skipped** for each dose.
   - Auto-missed logic marks doses not acted on within 2 hours as missed (via cron).

5. **Monitoring (Doctor)**
   - Doctor dashboard shows linked patients sorted by risk.
   - Risk badges: RED / YELLOW / GREEN.
   - Doctor opens patient detail to see timeline and history.
   - Doctor can send a **Nudge** (intervention note) for non-compliant patients.

---

## 4. Authentication & Security

### 4.1. Auth Method

- **Username + Password**: Users log in with a username (e.g., `adminnew`, `patient1`). The system maps this to `username@medtrack.local` for Supabase Auth.
- **Email as fallback**: If the user enters a full email (contains `@`), it is used as-is.
- **Session**: Cookie-based via `@supabase/ssr`; middleware refreshes the session on each request.

### 4.2. Role-Based Access Control (RBAC)

| Route | Allowed Role | Redirect if Unauthorized |
|-------|--------------|--------------------------|
| `/admin/*` | Admin | → `/doctor`, `/frontdesk`, `/patient`, or `/` |
| `/frontdesk/*` | Frontdesk | → `/admin`, `/doctor`, `/patient`, or `/` |
| `/doctor/*` | Doctor | → `/admin`, `/frontdesk`, `/patient`, or `/` |
| `/patient/*` | Patient | → `/admin`, `/doctor`, `/frontdesk`, or `/` |
| `/` | Public | — |
| `/login` | Public | — |

**Role resolution:**  
If the `profiles` table query fails (e.g., RLS), role is taken from `auth.users.raw_user_meta_data.role` so protected routes still work.

### 4.3. Row Level Security (RLS)

- **Patients**: Can only view/update their own profile, plans, and dose logs.
- **Doctors**: Can only view and act on patients linked via `patient_doctor`.
- **Frontdesk**: Can view all profiles and create/delete patient–doctor links.
- **Admins**: Full read/write across all tables (profiles, links, plans, meds, doses, nudges).

---

## 5. Functional Requirements

### 5.1. Admin Dashboard (`/admin`)

- **Overview**: Stats (Patients, Doctors, Front Desk, Admins) and tables of users and assignments.
- **Register Patient**: Create patient (name, username, password, MRN, phone, DOB), optionally assign to a doctor.
- **Register Staff**: Create Doctor, Front Desk, or Admin (name, username, password, role).
- **Assign Patient to Doctor**: Link or unlink patients and doctors.

### 5.2. Frontdesk Dashboard (`/frontdesk`)

- **Register Patient**: Same fields as admin; optionally assign to doctor.
- **Assign Patient to Doctor**: Select patient and doctor, create link.
- **Current Assignments**: List of links; can remove a link.

### 5.3. Doctor Dashboard (`/doctor`)

- **Dashboard**: Linked patients sorted by risk; risk badges (RED/YELLOW/GREEN).
- **Prescribe** (`/doctor/prescribe`): Form to add medications with name, dose, route, frequency, times, critical flag.
- **Import** (`/doctor/import`): Bulk import from JSON (legacy discharge format).
- **Patient Detail** (`/doctor/patient/[id]`): History, timeline, medication list, Nudge button.
- **Nudge**: Record an intervention message for the patient.

### 5.4. Patient Dashboard (`/patient`)

- **Today’s View**: Medications scheduled for today, grouped by time.
- **Actionable Cards**: Taken / Skipped buttons.
- **History** (`/patient/history`): Weekly adherence chart and streak counter.

---

## 6. Risk Scoring Logic

**Formula:**

```
Score = (MissedLast48h × 10) + (CriticalMissed × 25) + PolypharmacyModifier + ElderlyModifier
```

| Factor | Points |
|--------|--------|
| Each missed dose (last 48h) | +10 |
| Each critical med missed | +25 |
| Polypharmacy (≥5 meds) | +10 |
| Elderly (≥60 years) | +10 |

| Score | Level |
|-------|-------|
| ≥ 40 | RED |
| ≥ 20 | YELLOW |
| < 20 | GREEN |

---

## 7. Data Model

| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| `profiles` | User identity (role, name, MRN, phone, DOB). | 1:1 with `auth.users` |
| `patient_doctor` | Links patients to doctors. | Many-to-many |
| `medication_plans` | Groups medications (e.g. “Discharge Feb 2026”). | Belongs to patient |
| `medications` | Drug details (name, dose, route, times, freq, critical). | Belongs to plan |
| `scheduled_doses` | Individual dose entries per time. | Belongs to medication & patient |
| `nudge_logs` | Doctor intervention audit. | Linked to doctor & patient |

**Profile role values:** `patient`, `doctor`, `frontdesk`, `admin`

---

## 8. Key Routes

| Route | Description | Role |
|-------|-------------|------|
| `/` | Landing page | Public |
| `/login` | Username + password login | Public |
| `/admin` | Admin dashboard | Admin |
| `/frontdesk` | Front desk dashboard | Frontdesk |
| `/doctor` | Doctor dashboard | Doctor |
| `/doctor/prescribe` | Prescribe medications | Doctor |
| `/doctor/import` | Import discharge meds | Doctor |
| `/doctor/patient/[id]` | Patient detail + nudge | Doctor |
| `/patient` | Today’s medications | Patient |
| `/patient/history` | Weekly adherence | Patient |
| `/api/cron/mark-missed` | Mark overdue doses as missed | Cron |

---

## 9. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Styling | Tailwind CSS |
| Data Fetching | React Server Components + Server Actions |
| Timezone | Asia/Kuala_Lumpur |

---

## 10. Database Setup

1. Run `supabase/COMPLETE_SETUP.sql` – schema, RLS, triggers, frontdesk role, admin user.
2. If profile role is null, run `supabase/INSERT_ADMIN_PROFILE.sql` to fix admin profile.
3. Default admin: username `adminnew`, password `demo1234`.

---

## 11. Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02 | 2.0 | Added Frontdesk role; username-based login; admin Register Staff; frontdesk dashboard |
| — | 1.0 | Initial PRD; Admin, Doctor, Patient; Magic Link auth; Nurse role (removed) |
