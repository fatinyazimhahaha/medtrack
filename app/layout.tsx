import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { getProfile } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedTrack MY – Medication Compliance Tracker",
  description:
    "A two-sided medication compliance system for patients and doctors in Malaysia.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedTrack MY",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile = null;
  try {
    profile = await getProfile();
  } catch {
    // Not authenticated or Supabase unreachable — render without nav state
  }

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="font-body min-h-screen antialiased">
        <Nav role={profile?.role ?? null} fullName={profile?.full_name} />
        <main className="mx-auto w-full max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
