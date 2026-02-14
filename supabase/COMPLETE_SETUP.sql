-- ============================================================
-- MEDTRACK MY - COMPLETE DATABASE SETUP
-- ============================================================
-- This script does everything in one go:
-- 1. Creates all tables and relationships
-- 2. Sets up Row Level Security (RLS) policies
-- 3. Creates triggers for auto-profile creation
-- 4. Adds frontdesk role
-- 5. Creates admin user (adminnew / demo1234)
--
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run"
-- 4. Login with username: adminnew, password: demo1234
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PART 1: DROP EXISTING OBJECTS (Clean slate)
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Doctors can view linked patients" ON public.profiles;
DROP POLICY IF EXISTS "Doctors see own links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Patients see own links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Doctors can insert links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Patients see own plans" ON public.medication_plans;
DROP POLICY IF EXISTS "Doctors see linked patient plans" ON public.medication_plans;
DROP POLICY IF EXISTS "Doctors can insert plans" ON public.medication_plans;
DROP POLICY IF EXISTS "Patients see own medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors see linked medications" ON public.medications;
DROP POLICY IF EXISTS "Doctors can insert medications" ON public.medications;
DROP POLICY IF EXISTS "Patients see own doses" ON public.scheduled_doses;
DROP POLICY IF EXISTS "Patients update own doses" ON public.scheduled_doses;
DROP POLICY IF EXISTS "Doctors see linked doses" ON public.scheduled_doses;
DROP POLICY IF EXISTS "Doctors can insert doses" ON public.scheduled_doses;
DROP POLICY IF EXISTS "Doctors insert nudges for linked patients" ON public.nudge_logs;
DROP POLICY IF EXISTS "Doctors see own nudges" ON public.nudge_logs;
DROP POLICY IF EXISTS "Patients see nudges sent to them" ON public.nudge_logs;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins see all links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Admins can insert links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Admins can delete links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Admins see all plans" ON public.medication_plans;
DROP POLICY IF EXISTS "Admins see all doses" ON public.scheduled_doses;
DROP POLICY IF EXISTS "Admins see all medications" ON public.medications;
DROP POLICY IF EXISTS "Admins see all nudges" ON public.nudge_logs;
DROP POLICY IF EXISTS "Frontdesk can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Frontdesk see all links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Frontdesk can insert links" ON public.patient_doctor;
DROP POLICY IF EXISTS "Frontdesk can delete links" ON public.patient_doctor;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing tables (cascade to remove dependent objects)
DROP TABLE IF EXISTS public.nudge_logs CASCADE;
DROP TABLE IF EXISTS public.scheduled_doses CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.medication_plans CASCADE;
DROP TABLE IF EXISTS public.patient_doctor CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================
-- PART 2: CREATE TABLES
-- ============================================================

-- Profiles table (mirrors auth.users, stores app-level fields)
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL CHECK (role IN ('patient','doctor','frontdesk','admin')) DEFAULT 'patient',
  mrn        TEXT,
  phone      TEXT,
  dob        DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patient-Doctor linking table (many-to-many)
CREATE TABLE public.patient_doctor (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, doctor_id)
);

-- Medication plans
CREATE TABLE public.medication_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pres_no    TEXT,
  start_date DATE NOT NULL,
  end_date   DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medications
CREATE TABLE public.medications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID NOT NULL REFERENCES public.medication_plans(id) ON DELETE CASCADE,
  med_name   TEXT NOT NULL,
  dose       TEXT NOT NULL,
  route      TEXT NOT NULL DEFAULT 'PO',
  times      TEXT[] NOT NULL DEFAULT '{}',
  freq       TEXT NOT NULL DEFAULT 'OD',
  critical   BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE,
  end_date   DATE
);

-- Scheduled doses
CREATE TABLE public.scheduled_doses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  patient_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('pending','taken','skipped','missed')) DEFAULT 'pending',
  note          TEXT,
  acted_at      TIMESTAMPTZ
);

CREATE INDEX idx_doses_patient_status ON public.scheduled_doses(patient_id, status);
CREATE INDEX idx_doses_scheduled ON public.scheduled_doses(scheduled_at);

-- Nudge logs
CREATE TABLE public.nudge_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_doctor   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_doses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_logs       ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Doctors can view linked patients"
  ON public.profiles FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = profiles.id AND pd.doctor_id = auth.uid()
    )
  );

-- Patient-Doctor policies
CREATE POLICY "Doctors see own links"
  ON public.patient_doctor FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Patients see own links"
  ON public.patient_doctor FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors can insert links"
  ON public.patient_doctor FOR INSERT WITH CHECK (doctor_id = auth.uid());

-- Medication plans policies
CREATE POLICY "Patients see own plans"
  ON public.medication_plans FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctors see linked patient plans"
  ON public.medication_plans FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = medication_plans.patient_id AND pd.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert plans"
  ON public.medication_plans FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = medication_plans.patient_id AND pd.doctor_id = auth.uid()
    )
  );

-- Medications policies
CREATE POLICY "Patients see own medications"
  ON public.medications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.medication_plans mp
      WHERE mp.id = medications.plan_id AND mp.patient_id = auth.uid()
    )
  );

CREATE POLICY "Doctors see linked medications"
  ON public.medications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.medication_plans mp
      JOIN public.patient_doctor pd ON pd.patient_id = mp.patient_id
      WHERE mp.id = medications.plan_id AND pd.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert medications"
  ON public.medications FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medication_plans mp
      JOIN public.patient_doctor pd ON pd.patient_id = mp.patient_id
      WHERE mp.id = medications.plan_id AND pd.doctor_id = auth.uid()
    )
  );

-- Scheduled doses policies
CREATE POLICY "Patients see own doses"
  ON public.scheduled_doses FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patients update own doses"
  ON public.scheduled_doses FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Doctors see linked doses"
  ON public.scheduled_doses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = scheduled_doses.patient_id AND pd.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can insert doses"
  ON public.scheduled_doses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = scheduled_doses.patient_id AND pd.doctor_id = auth.uid()
    )
  );

-- Nudge logs policies
CREATE POLICY "Doctors insert nudges for linked patients"
  ON public.nudge_logs FOR INSERT WITH CHECK (
    doctor_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.patient_doctor pd
      WHERE pd.patient_id = nudge_logs.patient_id AND pd.doctor_id = auth.uid()
    )
  );

CREATE POLICY "Doctors see own nudges"
  ON public.nudge_logs FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Patients see nudges sent to them"
  ON public.nudge_logs FOR SELECT USING (patient_id = auth.uid());

-- Admin policies (full access)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins see all links"
  ON public.patient_doctor FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert links"
  ON public.patient_doctor FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can delete links"
  ON public.patient_doctor FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins see all plans"
  ON public.medication_plans FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins see all doses"
  ON public.scheduled_doses FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins see all medications"
  ON public.medications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins see all nudges"
  ON public.nudge_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Frontdesk policies
CREATE POLICY "Frontdesk can view all profiles"
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'frontdesk')
  );

CREATE POLICY "Frontdesk see all links"
  ON public.patient_doctor FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'frontdesk')
  );

CREATE POLICY "Frontdesk can insert links"
  ON public.patient_doctor FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'frontdesk')
  );

CREATE POLICY "Frontdesk can delete links"
  ON public.patient_doctor FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'frontdesk')
  );

-- ============================================================
-- PART 4: TRIGGER FOR AUTO-PROFILE CREATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PART 5: CREATE ADMIN USER
-- ============================================================

DO $$
DECLARE
  target_username TEXT := 'adminnew';
  target_password TEXT := 'demo1234';
  target_email TEXT := target_username || '@medtrack.local';
  existing_user_id UUID;
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Check if user exists
  SELECT id INTO existing_user_id 
  FROM auth.users 
  WHERE email = target_email;
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE 'User % already exists. Updating password and role...', target_username;
    
    -- Update password
    UPDATE auth.users
    SET encrypted_password = crypt(target_password, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', 'System Admin', 'role', 'admin')
    WHERE id = existing_user_id;
    
    -- Update profile
    UPDATE public.profiles
    SET role = 'admin', full_name = 'System Admin'
    WHERE id = existing_user_id;
    
    RAISE NOTICE '✓ Admin user updated: % (password: %)', target_username, target_password;
  ELSE
    -- Create new user
    RAISE NOTICE 'Creating new admin user: %', target_username;
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      created_at, 
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      new_user_id, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated',
      target_email,
      crypt(target_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Admin","role":"admin"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Profile will be auto-created by trigger, but ensure it has admin role
    INSERT INTO public.profiles (id, full_name, role, created_at)
    VALUES (new_user_id, 'System Admin', 'admin', NOW())
    ON CONFLICT (id) 
    DO UPDATE SET role = 'admin', full_name = 'System Admin';
    
    RAISE NOTICE '✓ Admin user created: % (password: %)', target_username, target_password;
  END IF;
END $$;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show created admin user
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'adminnew@medtrack.local';

-- ============================================================
-- SETUP COMPLETE!
-- ============================================================
-- 
-- Next steps:
-- 1. Login with username: adminnew, password: demo1234
-- 2. Create frontdesk and doctor users from Admin Dashboard
-- 3. Start using the system!
--
-- ============================================================
