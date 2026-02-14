"use client";

import { getSupabaseBrowser } from "@/lib/supabaseBrowser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Append @medtrack.local for username login
      // If user typed an email, use it as is
      const isEmail = username.includes("@");
      const email = isEmail ? username : `${username}@medtrack.local`;
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Redirect based on role
      if (data.user) {
        // Try to get role from user metadata first (always available after login)
        let role = data.user.user_metadata?.role;
        
        // If not in metadata, fetch from profiles table
        if (!role) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();
          role = profile?.role;
        }

        // Use window.location for hard redirect (ensures server picks up new session)
        if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "doctor") {
          window.location.href = "/doctor";
        } else if (role === "patient") {
          window.location.href = "/patient";
        } else {
          window.location.href = "/";
        }
        return; // Don't set loading=false, page is navigating
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message === "Invalid login credentials" ? "Invalid username or password" : err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md opacity-0 animate-[fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards]">
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-lg p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="font-heading font-bold text-xl text-[var(--text-primary)]">MedTrack</span>
              <span className="text-sm font-bold font-heading gradient-text">MY</span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Enter your credentials to sign in
            </p>
          </div>

          {/* Demo / Krackathon: Role info & credentials for assessors */}
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-xs text-gray-700">
            <p className="font-semibold text-blue-900 mb-2">Demo / Krackathon — Role & Login</p>
            <ul className="space-y-2">
              <li>
                <span className="font-medium text-blue-800">Admin</span> — Manage users, register patients & staff, assign patients to doctors.
                <br />
                <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">adminnew</code> / <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">demo1234</code>
              </li>
              <li>
                <span className="font-medium text-blue-800">Doctor</span> — View assigned patients, prescribe medications, see adherence.
                <br />
                <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">siti</code> / <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">demo1234</code>
              </li>
              <li>
                <span className="font-medium text-blue-800">Patient</span> — View today&apos;s medications, mark doses Complete or Skipped, see history.
                <br />
                <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">ahmad1234</code> / <code className="text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">demo1234</code>
              </li>
            </ul>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or patient123"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 text-sm transition-all focus:bg-white focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-black/[0.08] bg-black/[0.02] px-4 py-3 text-sm transition-all focus:bg-white focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent)]/10"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Footer / Links */}
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
