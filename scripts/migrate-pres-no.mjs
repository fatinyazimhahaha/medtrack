/**
 * Migration: Add pres_no to medication_plans and start_date/end_date to medications
 *
 * This script tries to add the columns via the Supabase pg-meta API.
 * If that fails, it prints the SQL for manual execution in the Supabase Dashboard.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  // Try reading from .env.local
  const fs = await import("fs");
  const path = await import("path");
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};
  for (const line of envContent.split("\n")) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) envVars[key.trim()] = vals.join("=").trim();
  }
  if (!SUPABASE_URL) var url = envVars.NEXT_PUBLIC_SUPABASE_URL;
  if (!SERVICE_ROLE_KEY) var key = envVars.SUPABASE_SERVICE_ROLE_KEY;
  var SUPA_URL = url || SUPABASE_URL;
  var SUPA_KEY = key || SERVICE_ROLE_KEY;
} else {
  var SUPA_URL = SUPABASE_URL;
  var SUPA_KEY = SERVICE_ROLE_KEY;
}

const SQL = `
-- Add pres_no column to medication_plans
ALTER TABLE medication_plans ADD COLUMN IF NOT EXISTS pres_no TEXT;

-- Add start_date and end_date columns to medications table
ALTER TABLE medications ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE medications ADD COLUMN IF NOT EXISTS end_date TEXT;

-- Create unique index on pres_no
CREATE UNIQUE INDEX IF NOT EXISTS idx_medication_plans_pres_no ON medication_plans(pres_no) WHERE pres_no IS NOT NULL;
`;

console.log("=== MedTrack Prescription Migration ===\n");

// Try pg-meta endpoint
async function tryPgMeta() {
  const endpoints = [
    `${SUPA_URL}/pg/query`,
    `${SUPA_URL}/rest/v1/rpc/exec_sql`,
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}...`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPA_KEY}`,
          apikey: SUPA_KEY,
        },
        body: JSON.stringify({ query: SQL }),
      });
      if (res.ok) {
        console.log("Migration executed successfully!");
        return true;
      }
      const text = await res.text();
      console.log(`  Response ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
  return false;
}

const success = await tryPgMeta();

if (!success) {
  console.log("\n=============================================");
  console.log("Could not auto-execute migration.");
  console.log("Please run the following SQL in your Supabase Dashboard:");
  console.log("  Go to: https://supabase.com/dashboard → SQL Editor");
  console.log("=============================================\n");
  console.log(SQL);
  console.log("=============================================\n");
}
