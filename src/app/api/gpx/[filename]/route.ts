import { NextResponse } from "next/server";
import type { TrackPoint } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const decoded = decodeURIComponent(filename);
    const { data, error } = await supabase
      .from("trackpoints")
      .select("lat,lng,elevation,time")
      .eq("gpx_filename", decoded)
      .order("id");

    if (error) {
      console.error("Error fetching GPX data:", error);
      return NextResponse.json(
        { error: "Failed to read GPX data" },
        { status: 500 }
      );
    }

    const trackPoints: TrackPoint[] = (data || []).map((row) => ({
      lat: row.lat,
      lng: row.lng,
      elevation: row.elevation ?? undefined,
      time: row.time ? new Date(row.time) : undefined,
    }));

    return NextResponse.json(trackPoints);
  } catch (error) {
    console.error("Error reading GPX file:", error);
    return NextResponse.json(
      { error: "Failed to read GPX data" },
      { status: 500 }
    );
  }
}
