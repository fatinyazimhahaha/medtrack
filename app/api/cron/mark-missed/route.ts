import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * Mark overdue doses as "missed".
 * A dose is missed if:
 *   - status is "pending"
 *   - scheduled_at is more than 2 hours in the past
 *
 * Call manually: GET /api/cron/mark-missed
 * Or set up a Vercel/Supabase cron to call this periodically.
 */
export async function GET() {
  try {
    const admin = getSupabaseAdmin();

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data, error } = await admin
      .from("scheduled_doses")
      .update({ status: "missed" })
      .eq("status", "pending")
      .lt("scheduled_at", twoHoursAgo)
      .select("id");

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data?.length ?? 0,
      message: `Marked ${data?.length ?? 0} dose(s) as missed.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
