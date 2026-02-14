"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

interface NavProps {
  role: "patient" | "doctor" | "frontdesk" | "admin" | null;
  fullName?: string;
}

const isStaff = (role: string | null) => role === "doctor";

export default function Nav({ role, fullName }: NavProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-black/[0.06] shadow-sm"
          : "bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-xl font-heading font-bold text-[var(--text-primary)] tracking-tight">
            MedTrack
          </span>
          <span className="text-sm font-bold font-heading gradient-text">MY</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {role === "patient" && (
            <>
              <Link href="/patient" className="nav-link">
                Today
              </Link>
              <Link href="/patient/history" className="nav-link">
                History
              </Link>
            </>
          )}
          {isStaff(role) && (
            <>
              <Link href="/doctor" className="nav-link">
                Dashboard
              </Link>
              <Link href="/doctor/prescribe" className="nav-link">
                Prescribe
              </Link>
              <Link href="/doctor/import" className="nav-link">
                Import
              </Link>
            </>
          )}
          {role === "admin" && (
            <>
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            </>
          )}

          {!role && (
            <>
              <a href="#features" className="nav-link">Features</a>
              <a href="#impact" className="nav-link">Impact</a>
              <a href="#how-it-works" className="nav-link">How It Works</a>
              <Link href="/api-docs" className="nav-link">API</Link>
            </>
          )}

          <div className="ml-4 pl-4 border-l border-black/[0.08] flex items-center gap-3">
            {role ? (
              <>
                <span className="text-sm text-[var(--text-secondary)]">
                  {fullName || role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="btn-primary text-sm !px-5 !py-2">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[var(--text-primary)] transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-400 ${mobileOpen ? "max-h-80 border-b border-black/[0.06]" : "max-h-0"}`}>
        <div className="px-6 py-4 space-y-3 bg-white/95 backdrop-blur-xl">
          {role === "patient" && (
            <>
              <Link href="/patient" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Today</Link>
              <Link href="/patient/history" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">History</Link>
            </>
          )}
          {isStaff(role) && (
            <>
              <Link href="/doctor" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Dashboard</Link>
              <Link href="/doctor/prescribe" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Prescribe</Link>
              <Link href="/doctor/import" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Import</Link>
            </>
          )}
          {role === "admin" && (
            <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Admin</Link>
          )}
          {!role && (
            <>
              <a href="#features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Features</a>
              <a href="#impact" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">Impact</a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">How It Works</a>
              <Link href="/api-docs" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">API</Link>
            </>
          )}
          {role ? (
            <button onClick={handleLogout} className="text-sm font-medium text-red-400">Logout</button>
          ) : (
            <Link href="/login" className="btn-primary text-sm inline-block">Sign In</Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .nav-link {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius-full);
          transition: all 0.3s ease;
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </nav>
  );
}
