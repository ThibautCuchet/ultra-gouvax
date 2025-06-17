import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { TrackPoint } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const gpxPath = path.join(
      process.cwd(),
      "src/ressources",
      decodeURIComponent(filename)
    );
    const gpxContent = await fs.readFile(gpxPath, "utf-8");

    // Simple regex to extract trackpoints from GPX
    const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g;
    const eleRegex = /<ele>([^<]+)<\/ele>/g;
    const timeRegex = /<time>([^<]+)<\/time>/g;

    const trackPoints: TrackPoint[] = [];

    // Extract lat/lng
    let match: RegExpExecArray | null;
    const coordinates: Array<{ lat: number; lng: number }> = [];

    match = trkptRegex.exec(gpxContent);
    while (match !== null) {
      coordinates.push({
        lat: Number.parseFloat(match[1]),
        lng: Number.parseFloat(match[2]),
      });
      match = trkptRegex.exec(gpxContent);
    }

    // Extract elevations
    const elevations: number[] = [];
    match = eleRegex.exec(gpxContent);
    while (match !== null) {
      elevations.push(Number.parseFloat(match[1]));
      match = eleRegex.exec(gpxContent);
    }

    // Extract times
    const times: Date[] = [];
    match = timeRegex.exec(gpxContent);
    while (match !== null) {
      times.push(new Date(match[1]));
      match = timeRegex.exec(gpxContent);
    }

    // Combine data
    for (let i = 0; i < coordinates.length; i++) {
      trackPoints.push({
        lat: coordinates[i].lat,
        lng: coordinates[i].lng,
        elevation: elevations[i] || undefined,
        time: times[i] || undefined,
      });
    }

    return NextResponse.json(trackPoints);
  } catch (error) {
    console.error("Error reading GPX file:", error);
    return NextResponse.json(
      { error: "Failed to read GPX data" },
      { status: 500 }
    );
  }
}
