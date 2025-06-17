import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { type WayPoint, type TrackPoint } from "../src/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, serviceKey);

interface Step {
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  departure_time?: string;
  distance_km?: number;
  elevation_gain_m?: number;
  estimated_duration_minutes?: number;
  gpx_file_key: string;
}

interface StepData {
  index: number;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  departure_time: string;
  distance_km: number;
  elevation_gain_m: number;
  estimated_duration_minutes: number;
}

interface TrackPointWithStep extends TrackPoint {
  gpx_filename: string;
  step_id?: number;
}

async function parseWaypoints(filePath: string): Promise<WayPoint[]> {
  const csvContent = await fs.readFile(filePath, "utf-8");
  const lines = csvContent.trim().split("\n");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const name = values[1];
    return {
      km: Number.parseFloat(values[0]),
      name: name.replace(/"/g, ""),
      lat: Number.parseFloat(values[2]),
      lng: Number.parseFloat(values[3]),
      is_ravito: name.toLowerCase().includes("ravito"),
    };
  });
}

async function parseStepsCSV(filePath: string): Promise<StepData[]> {
  const csvContent = await fs.readFile(filePath, "utf-8");
  const lines = csvContent.trim().split("\n");
  return lines.slice(1).map((line) => {
    const values = line.split(";");
    return {
      index: parseInt(values[0]),
      start_lat: parseFloat(values[1]),
      start_lng: parseFloat(values[2]),
      end_lat: parseFloat(values[3]),
      end_lng: parseFloat(values[4]),
      departure_time: values[5],
      distance_km: parseFloat(values[6]),
      elevation_gain_m: parseFloat(values[7]),
      estimated_duration_minutes: parseInt(values[8]),
    };
  });
}

async function parseGPX(
  filePath: string,
  filename: string
): Promise<TrackPointWithStep[]> {
  const gpxContent = await fs.readFile(filePath, "utf-8");
  const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g;
  const eleRegex = /<ele>([^<]+)<\/ele>/g;
  const timeRegex = /<time>([^<]+)<\/time>/g;

  const trackPoints: TrackPointWithStep[] = [];
  let match: RegExpExecArray | null;
  const coords: Array<{ lat: number; lng: number }> = [];

  match = trkptRegex.exec(gpxContent);
  while (match !== null) {
    coords.push({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
    match = trkptRegex.exec(gpxContent);
  }

  const elevations: number[] = [];
  match = eleRegex.exec(gpxContent);
  while (match !== null) {
    elevations.push(parseFloat(match[1]));
    match = eleRegex.exec(gpxContent);
  }

  const times: Date[] = [];
  match = timeRegex.exec(gpxContent);
  while (match !== null) {
    times.push(new Date(match[1]));
    match = timeRegex.exec(gpxContent);
  }

  for (let i = 0; i < coords.length; i++) {
    trackPoints.push({
      lat: coords[i].lat,
      lng: coords[i].lng,
      elevation: elevations[i] || undefined,
      time: times[i] || undefined,
      gpx_filename: filename,
    });
  }

  return trackPoints;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateElevationGain(trackPoints: TrackPointWithStep[]): number {
  let totalGain = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    const prevEle = trackPoints[i - 1].elevation || 0;
    const currEle = trackPoints[i].elevation || 0;
    if (currEle > prevEle) {
      totalGain += currEle - prevEle;
    }
  }
  return totalGain;
}

async function importWaypoints() {
  const csvPath = path.join(
    "src",
    "ressources",
    "Coordonn_es_avec_RAVITO_4.csv"
  );
  const waypoints = await parseWaypoints(csvPath);
  const { error } = await supabase.from("waypoints").insert(waypoints);
  if (error) {
    console.error("Error importing waypoints:", error);
  } else {
    console.log(`Imported ${waypoints.length} waypoints`);
  }
}

async function importGPXData(gpxDirectoryPath: string, stepsData: StepData[]) {
  const files = await fs.readdir(gpxDirectoryPath);
  const gpxFiles = files.filter((file) => file.endsWith(".gpx"));

  console.log(`Found ${gpxFiles.length} GPX files`);
  console.log(`Found ${stepsData.length} steps in CSV`);

  for (const stepData of stepsData) {
    // Look for GPX file matching this step (step_1.gpx for index 1, etc.)
    const expectedGpxFile = `etape_${stepData.index}.gpx`;
    const matchingGpxFile = gpxFiles.find((file) => file === expectedGpxFile);

    if (!matchingGpxFile) {
      console.log(`No GPX file found for step ${stepData.index}, skipping...`);
      continue;
    }

    const filePath = path.join(gpxDirectoryPath, matchingGpxFile);

    // Upload GPX file to Supabase Storage with normalized name
    const normalizedFileName = `step_${stepData.index}.gpx`;
    console.log(
      `Uploading ${matchingGpxFile} as ${normalizedFileName} to Supabase Storage...`
    );
    const fileBuffer = await fs.readFile(filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("gpx-files")
      .upload(`steps/${normalizedFileName}`, fileBuffer, {
        contentType: "application/gpx+xml",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading ${matchingGpxFile}:`, uploadError);
      continue;
    }

    console.log(
      `Successfully uploaded ${matchingGpxFile} as ${normalizedFileName} to ${uploadData.path}`
    );

    const trackPoints = await parseGPX(filePath, normalizedFileName);

    if (trackPoints.length === 0) {
      console.log(`No trackpoints found in ${matchingGpxFile}`);
      continue;
    }

    // Convert time to full timestamp (assuming it's for the race day)
    const convertTimeToTimestamp = (
      time: string,
      stepIndex: number
    ): string => {
      const baseDate = new Date("2025-06-27"); // Race date: 27-28 June 2025
      const [hours, minutes] = time.split(":").map(Number);

      // If time is early morning (like 01:30), it's probably the next day
      if (hours < 12 && stepIndex > 1) {
        baseDate.setDate(baseDate.getDate() + 1);
      }

      baseDate.setHours(hours, minutes, 0, 0);
      return baseDate.toISOString();
    };

    // Create step using CSV data instead of calculating from GPX
    const step: Step = {
      start_lat: stepData.start_lat,
      start_lng: stepData.start_lng,
      end_lat: stepData.end_lat,
      end_lng: stepData.end_lng,
      departure_time: convertTimeToTimestamp(
        stepData.departure_time,
        stepData.index
      ),
      distance_km: stepData.distance_km,
      elevation_gain_m: stepData.elevation_gain_m,
      estimated_duration_minutes: stepData.estimated_duration_minutes,
      gpx_file_key: uploadData.path,
    };

    // Insert step
    const { data: insertedStep, error: stepError } = await supabase
      .from("steps")
      .insert(step)
      .select()
      .single();

    if (stepError) {
      console.error(`Error inserting step ${stepData.index}:`, stepError);
      continue;
    }

    console.log(`Created step ${insertedStep.id} for step ${stepData.index}`);

    // Associate trackpoints with the step
    const trackPointsWithStepId = trackPoints.map((point) => ({
      ...point,
      step_id: insertedStep.id,
    }));

    // Insert trackpoints in batches
    const batchSize = 1000;
    for (let i = 0; i < trackPointsWithStepId.length; i += batchSize) {
      const batch = trackPointsWithStepId.slice(i, i + batchSize);
      const { error: trackError } = await supabase
        .from("trackpoints")
        .insert(batch);

      if (trackError) {
        console.error(
          `Error inserting trackpoints batch ${i} for step ${stepData.index}:`,
          trackError
        );
      }
    }

    console.log(
      `Imported ${trackPointsWithStepId.length} trackpoints for step ${insertedStep.id}`
    );
  }
}

async function main() {
  console.log("Starting data import...");

  // Import waypoints
  await importWaypoints();

  // Parse steps CSV data
  const stepsCSVPath = path.join("src", "ressources", "steps.csv");
  const stepsData = await parseStepsCSV(stepsCSVPath);
  console.log(`Loaded ${stepsData.length} steps from CSV`);

  // Import GPX data using CSV data
  const gpxPath = path.join("src", "ressources", "gpx"); // Adjust this path as needed

  try {
    await importGPXData(gpxPath, stepsData);
    console.log("Data import completed successfully!");
  } catch (error) {
    console.error("Error during GPX import:", error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
