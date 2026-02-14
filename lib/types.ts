// ============================================================
// MedTrack MY – Shared TypeScript types
// ============================================================

export type UserRole = "patient" | "doctor" | "frontdesk" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  mrn: string | null;
  phone: string | null;
  dob: string | null; // ISO date string
  created_at: string;
}

export interface PatientDoctor {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
}

export interface MedicationPlan {
  id: string;
  patient_id: string;
  pres_no: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface Medication {
  id: string;
  plan_id: string;
  med_name: string;
  dose: string;
  route: string;
  times: string[];
  freq: string;
  critical: boolean;
  start_date: string | null;
  end_date: string | null;
}

export interface ScheduledDose {
  id: string;
  medication_id: string;
  patient_id: string;
  scheduled_at: string;
  status: "pending" | "taken" | "skipped" | "missed";
  note: string | null;
  acted_at: string | null;
}

export interface NudgeLog {
  id: string;
  doctor_id: string;
  patient_id: string;
  message: string;
  created_at: string;
}

// Joined types for UI
export interface DoseWithMedication extends ScheduledDose {
  medications: Medication;
}

export interface PatientWithRisk extends Profile {
  risk_score: number;
  risk_level: "RED" | "YELLOW" | "GREEN";
  missed_last_48h: number;
  critical_missed: number;
  meds_count: number;
  pres_nos: string[];
}

// Import JSON shape
export interface ImportPayload {
  patient: {
    full_name: string;
    mrn: string;
    phone: string;
    dob: string;
  };
  plan: {
    start_date: string;
    end_date: string | null;
  };
  meds: {
    med_name: string;
    dose: string;
    route: string;
    times: string[];
    freq: string;
    critical: boolean;
  }[];
}

export type RiskLevel = "RED" | "YELLOW" | "GREEN";
