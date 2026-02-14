"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ── SVG Icons (hand-crafted, no emoji) ─────────────────── */
function IconTap() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="14" r="6" stroke="#0CCEA9" strokeWidth="1.5" fill="none" />
      <path d="M20 20v8M16 24l4 4 4-4" stroke="#0CCEA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="4" width="24" height="32" rx="4" stroke="#0CCEA9" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="28" width="6" height="8" rx="1" fill="#0CCEA9" opacity="0.3" />
      <rect x="14" y="20" width="6" height="16" rx="1" fill="#0CCEA9" opacity="0.5" />
      <rect x="22" y="14" width="6" height="22" rx="1" fill="#0CCEA9" opacity="0.7" />
      <rect x="30" y="8" width="6" height="28" rx="1" fill="#0CCEA9" />
      <path d="M6 8l8 6 8-4 12-4" stroke="#0CCEA9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4L6 10v10c0 9.33 5.97 18.05 14 20 8.03-1.95 14-10.67 14-20V10L20 4z" stroke="#0CCEA9" strokeWidth="1.5" fill="none" />
      <path d="M15 20l3 3 7-7" stroke="#0CCEA9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Marquee Items ──────────────────────────────────────── */
const marqueeItems = [
  "One-Tap Logging",
  "Doctor Dashboard",
  "Risk Scoring",
  "Streak Tracking",
  "Smart Alerts",
  "Built for Malaysia",
  "Hospital to Home",
  "Real-Time Monitoring",
];

/* ── Timeline Steps ─────────────────────────────────────── */
const steps = [
  {
    num: "01",
    title: "Admin Registers & Assigns",
    desc: "The hospital admin registers patients and doctors in the system, then assigns each patient to their treating doctor.",
  },
  {
    num: "02",
    title: "Doctor Keys In Prescriptions",
    desc: "Doctors enter the patient's medication schedule via the Prescribe form. The system generates daily dose cards automatically.",
  },
  {
    num: "03",
    title: "Patient Logs Daily",
    desc: "Each day, the patient sees their dose schedule and taps Taken or Skipped. It takes seconds — no typing, no friction.",
  },
  {
    num: "04",
    title: "Doctor Monitors Compliance",
    desc: "The dashboard flags high-risk non-adherence patterns. Doctors can act before a missed dose becomes a hospital readmission.",
  },
];

/* ── Main Landing Page ──────────────────────────────────── */
export default function LandingPage() {
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function addRef(el: HTMLElement | null) {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* ────────── HERO ────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Background glow */}
        <div className="hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        {/* Overline */}
        <div
          className="opacity-0 animate-[fade-in_0.8s_ease_0.2s_forwards]"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/[0.06] bg-black/[0.03] text-sm text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Built for Malaysian Healthcare
          </span>
        </div>

        {/* Headline */}
        <h1
          className="mt-8 font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] opacity-0 animate-[fade-in-up_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_forwards]"
        >
          Medication
          <br />
          <span className="gradient-text">Compliance</span>
          <br />
          Reimagined.
        </h1>

        {/* Subtitle */}
        <p
          className="mt-6 max-w-lg text-lg text-[var(--text-secondary)] leading-relaxed opacity-0 animate-[fade-in-up_1s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards]"
        >
          Bridge the gap between hospital and home. Patients log doses in
          seconds. Doctors intervene before it&apos;s too late.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-4 opacity-0 animate-[fade-in-up_1s_cubic-bezier(0.16,1,0.3,1)_0.9s_forwards]">
          <Link href="/login" className="btn-primary text-base px-8 py-4">
            Get Started
          </Link>
        </div>

        {/* Scroll indicator */}
        <a
          href="#marquee"
          className="absolute bottom-10 scroll-indicator"
          aria-label="Scroll down"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[var(--text-muted)]"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* ────────── MARQUEE ────────── */}
      <section id="marquee" className="py-8 border-y border-black/[0.06]">
        <div className="marquee-container">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="marquee-item">
                <span className="dot" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── FEATURES ────────── */}
      <section id="features" className="py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div ref={addRef} className="reveal text-center mb-16">
            <span className="text-sm font-semibold tracking-widest uppercase text-[var(--accent)]">
              Features
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Everything you need.
              <br />
              <span className="text-[var(--text-secondary)]">Nothing you don&apos;t.</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: <IconTap />,
                title: "One-Tap Logging",
                desc: "Patients see their daily schedule and tap Taken or Skipped for each dose. It takes seconds, not minutes.",
              },
              {
                icon: <IconChart />,
                title: "Doctor Dashboard",
                desc: "Real-time risk scoring, missed-dose alerts, and early intervention tools — all in one clean view.",
              },
              {
                icon: <IconShield />,
                title: "Built for Malaysia",
                desc: "Malaysia timezone, local medication names, and workflows designed for the Malaysian healthcare system.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                ref={addRef}
                className={`reveal delay-${i + 1} card group cursor-default`}
              >
                <div className="mb-5 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent-dim)] transition-colors duration-300 group-hover:bg-[var(--accent)]/20">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold font-heading text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── IMPACT / STATS (Parallax) ────────── */}
      <section id="impact" className="parallax-section py-28 sm:py-36 px-6">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div ref={addRef} className="reveal">
            <span className="text-sm font-semibold tracking-widest uppercase text-[var(--accent)]">
              Impact
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              The numbers speak
              <br />
              <span className="text-[var(--text-secondary)]">for themselves.</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { value: "50%", label: "of patients don't take meds as prescribed after discharge" },
              { value: "30%", label: "of hospital readmissions caused by non-compliance" },
              { value: "2×", label: "better outcomes with medication tracking systems" },
            ].map((stat, i) => (
              <div
                key={i}
                ref={addRef}
                className={`reveal-scale delay-${i + 1} relative`}
              >
                <div className="stat-glow absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />
                <p className="text-5xl sm:text-6xl font-bold font-heading gradient-text">
                  {stat.value}
                </p>
                <p className="mt-3 text-sm text-[var(--text-secondary)] max-w-[240px] mx-auto leading-relaxed">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── HOW IT WORKS (Timeline) ────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-4xl">
          <div ref={addRef} className="reveal text-center mb-20">
            <span className="text-sm font-semibold tracking-widest uppercase text-[var(--accent)]">
              How It Works
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Three simple steps.
              <br />
              <span className="text-[var(--text-secondary)]">That&apos;s it.</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line (desktop only) */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-black/[0.08] -translate-x-1/2" />

            <div className="space-y-16 md:space-y-24">
              {steps.map((step, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={i}
                    ref={addRef}
                    className={`${isEven ? "reveal-left" : "reveal-right"} delay-${i + 1} relative`}
                  >
                    {/* Mobile layout */}
                    <div className="md:hidden flex gap-5">
                      <div className="timeline-badge flex-shrink-0 mt-1">{step.num}</div>
                      <div>
                        <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">{step.title}</h3>
                        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 md:items-center">
                      {isEven ? (
                        <>
                          <div className="text-right">
                            <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">{step.title}</h3>
                            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                          </div>
                          <div className="timeline-badge">{step.num}</div>
                          <div />
                        </>
                      ) : (
                        <>
                          <div />
                          <div className="timeline-badge">{step.num}</div>
                          <div>
                            <h3 className="text-xl font-bold font-heading text-[var(--text-primary)]">{step.title}</h3>
                            <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ────────── CTA BAND ────────── */}
      <section className="py-20 px-6">
        <div
          ref={addRef}
          className="reveal mx-auto max-w-4xl rounded-3xl border border-black/[0.06] bg-white/80 p-12 sm:p-16 text-center backdrop-blur-sm shadow-sm"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to close the
            <br />
            <span className="gradient-text">compliance gap?</span>
          </h2>
          <p className="mt-4 text-[var(--text-secondary)] max-w-md mx-auto">
            Join MedTrack MY today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/login" className="btn-primary text-base px-8 py-4">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ────────── FOOTER ────────── */}
      <footer className="border-t border-black/[0.06] py-12 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-[var(--text-primary)]">MedTrack</span>
            <span className="text-xs font-bold gradient-text">MY</span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#impact" className="hover:text-[var(--text-primary)] transition-colors">Impact</a>
            <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How It Works</a>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            &copy; 2026 MedTrack MY &middot; Built for Malaysia
          </p>
        </div>
      </footer>
    </div>
  );
}
