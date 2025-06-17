import { NextResponse } from "next/server";
import type { WayPoint } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("waypoints").select("*");
  if (error) {
    console.error("Error fetching waypoints:", error);
    return NextResponse.json(
      { error: "Failed to read waypoints data" },
      { status: 500 }
    );
  }

  return NextResponse.json(data as WayPoint[]);
}
