# MedTrack MY

A two-sided medication compliance tracking system built for Malaysia.

## Features

### Admin
- Register patients and staff (doctors)
- Assign patients to doctors
- Filter users by name, username, MRN, or role
- Edit user profiles (name, MRN, phone, DOB, role) and change passwords

### Doctor
- Dashboard with assigned patients, risk levels (RED / YELLOW / GREEN), and Pres No
- Search and filter patients by name, MRN, or Pres No
- Prescribe medications with per-medication start/end date+time
- Generated Pres No (e.g. `RX-20260214-2461`) acts as parent for medications
- Import discharge medications via JSON from hospital/clinic systems
- Medication schedule: Daily, Weekly, or Monthly view
- Status indicators: Complete (check), Skipped, Missed, Pending

### Patient
- Today's medications with time slots (Morning, Afternoon, Evening, etc.)
- One-tap logging: **Complete** or Skipped
- Weekly adherence chart and history
- Mobile-responsive UI with professional icons

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Supabase** (Auth, Postgres)
- **Tailwind CSS**
- **@supabase/ssr** for cookie-based server auth

## Demo / Krackathon Login

| Role   | Username   | Password |
|--------|------------|----------|
| Admin  | adminnew   | demo1234 |
| Doctor | siti       | demo1234 |
| Patient| ahmad1234  | demo1234 |

Use **username** (not email); the app appends `@medtrack.local` internally.

## Key Routes

| Route | Description |
|-------|-------------|
| / | Landing page |
| /login | Username/password login |
| /api-docs | API documentation for clinic integration |
| /admin | Admin dashboard |
| /patient | Patient today view |
| /patient/history | Weekly adherence |
| /doctor | Doctor dashboard |
| /doctor/prescribe | Prescribe medications |
| /doctor/import | Import discharge JSON |
| /doctor/patient/[id] | Patient detail (Daily/Weekly/Monthly schedule) |
| /api/cron/mark-missed | Mark overdue doses as missed |

## API Documentation

Pre-existing clinics can integrate. See API Documentation (/api-docs) for import JSON format, Doctor/Patient workflows, and data schema.

## Prescription Flow

- Each prescription has a unique **Pres No** (e.g. RX-20260214-2461).
- Medications have per-medication **start date/time** and **end date/time**.
- Scheduled doses are generated from each medication date range and times.

## Risk Scoring

| Factor | Points |
|--------|--------|
| Each missed dose (48h) | +10 |
| Each critical med missed | +25 |
| Polypharmacy (5+ meds) | +10 |
| Elderly (60+ years) | +10 |

| Score | Level |
|-------|-------|
| 40+ | RED |
| 20+ | YELLOW |
| under 20 | GREEN |

## Deploy to Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. In the Vercel project **Settings → Environment Variables**, add:

   | Name | Value | Notes |
   |------|--------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Required |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Required |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Required, keep secret |

3. Redeploy after saving env vars.
4. **(Optional)** To mark overdue doses as missed on a schedule, add a [Vercel Cron Job](https://vercel.com/docs/cron-jobs) that calls `GET https://your-app.vercel.app/api/cron/mark-missed` (e.g. every hour). Consider protecting this route with a secret header in production.
