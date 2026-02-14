import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Create Supabase Admin Client
const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdmin() {
  const email = "admin@medtrack.my";
  const password = "admin123";

  console.log(`Creating admin user: ${email}...`);

  // 1. Delete existing user if any (to ensure clean slate)
  const { data: listData } = await admin.auth.admin.listUsers();
  const existing = listData.users.find((u) => u.email === email);
  
  if (existing) {
    console.log("User exists, deleting...");
    await admin.auth.admin.deleteUser(existing.id);
  }

  // 2. Create new user via Admin API
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "System Admin",
      role: "admin",
    },
  });

  if (error) {
    console.error("Error creating user:", error.message);
    return;
  }

  const userId = data.user.id;
  console.log(`User created (ID: ${userId}).`);

  // 3. Ensure profile has admin role
  // (The trigger handle_new_user should create it, but we update to be sure)
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "admin", full_name: "System Admin" })
    .eq("id", userId);

  if (profileError) {
    console.error("Error updating profile:", profileError.message);
  } else {
    console.log("Profile updated with admin role.");
    console.log("Done! You can now log in.");
  }
}

createAdmin();
