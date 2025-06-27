import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type Waypoint,
  type Trackpoint,
  Step,
} from "../src/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, serviceKey);

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

// Function to calculate distance between two points
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

// Function to convert time string to full timestamp (Brussels timezone)
function convertTimeToTimestamp(departureTime: string): string {
  // Race starts on June 27, 2025 at 19:00 Brussels time (UTC+2 in summer)
  const raceStartDate = new Date("2025-06-27T17:00:00.000Z"); // 19h Brussels = 17h UTC
  const [hours, minutes] = departureTime.split(":").map(Number);

  // Create the departure date based on the race start date
  const departureDate = new Date(raceStartDate);

  // If time is early morning (like 01:30), it's probably the next day
  if (hours < 12) {
    departureDate.setDate(departureDate.getDate() + 1);
  }

  // Set the time in Brussels timezone (convert to UTC)
  const brusselsHours = hours;
  const utcHours = brusselsHours - 2; // Brussels is UTC+2 in summer
  departureDate.setUTCHours(utcHours, minutes, 0, 0);

  return departureDate.toISOString();
}

// Function to calculate ETA based on distance and average speed
function calculateEta(startTimestamp: string, waypointKm: number): string {
  const startDate = new Date(startTimestamp);

  // Vitesse moyenne : 7:45 min/km = 7.75 minutes par km
  const avgSpeedMinPerKm = 7.75;
  const estimatedTimeMinutes = waypointKm * avgSpeedMinPerKm;

  // Calculer l'ETA en ajoutant le temps estimé
  const etaDate = new Date(
    startDate.getTime() + estimatedTimeMinutes * 60 * 1000
  );

  return etaDate.toISOString();
}

async function parseWaypoints(filePath: string): Promise<Waypoint[]> {
  const csvContent = await fs.readFile(filePath, "utf-8");
  const lines = csvContent.trim().split("\n");

  let lastDepartureTimestamp: string | null = null;

  return lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const name = values[1];
    const isRavito = name.toLowerCase().includes("ravito");
    const departureTimeRaw = values[5]?.trim();

    // Logic for departure_time and eta_initial
    let departureTimestamp: string | null = null;
    let etaInitial: string | null = null;

    const waypointKm = Number.parseFloat(values[0]);

    if (departureTimeRaw && departureTimeRaw !== "") {
      // departure_time is defined, use it as base time
      departureTimestamp = convertTimeToTimestamp(departureTimeRaw);
      lastDepartureTimestamp = departureTimestamp; // Update last departure time
    }

    // Calculate ETA initial based on race start time (19h Brussels time) + distance and speed
    const raceStartTime = "2025-06-27T17:00:00.000Z"; // 19h Brussels = 17h UTC
    const baseEta = calculateEta(raceStartTime, waypointKm);

    // For ravitos, ETA is arrival time and departure time is calculated
    if (isRavito) {
      const etaDate = new Date(baseEta);
      etaDate.setMinutes(etaDate.getMinutes() - 10);
      etaInitial = etaDate.toISOString();

      // Calculate departure time for ravitos (arrival + 10 min break)
      if (!departureTimestamp) {
        departureTimestamp = baseEta; // baseEta is already arrival + running time
      }
    } else {
      etaInitial = baseEta;
    }

    const waypoint: Waypoint = {
      id: index,
      km: Number.parseFloat(values[0]),
      name: name.replace(/"/g, ""),
      lat: Number.parseFloat(values[2]),
      lng: Number.parseFloat(values[3]),
      is_ravito: isRavito,
      departure_time: departureTimestamp,
      eta_initial: etaInitial,
    };

    return waypoint;
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
): Promise<Trackpoint[]> {
  const gpxContent = await fs.readFile(filePath, "utf-8");
  const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g;
  const eleRegex = /<ele>([^<]+)<\/ele>/g;
  const timeRegex = /<time>([^<]+)<\/time>/g;

  const trackPoints: Trackpoint[] = [];
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

  for (let i = 0; i < coords.length; i++) {
    trackPoints.push({
      id: i,
      lat: coords[i].lat,
      lng: coords[i].lng,
      elevation: elevations[i] || null,
      distance_km: null,
    });
  }

  return trackPoints;
}

async function importWaypoints() {
  const csvPath = path.join("src", "ressources", "coordonnees.csv");
  const waypoints = await parseWaypoints(csvPath);
  const { error } = await supabase.from("waypoints").insert(waypoints);
  if (error) {
    console.error("Error importing waypoints:", error);
  } else {
    console.log(`Imported ${waypoints.length} waypoints`);
  }
}

async function importSteps(stepsData: StepData[]) {
  console.log(`Importing ${stepsData.length} steps from CSV...`);

  for (const stepData of stepsData) {
    // Convert time to full timestamp (race starts June 27, 2025 at 19:00 Brussels time)
    const convertTimeToTimestamp = (
      time: string,
      stepIndex: number
    ): string => {
      const raceStartDate = new Date("2025-06-27T17:00:00.000Z"); // 19h Brussels = 17h UTC
      const [hours, minutes] = time.split(":").map(Number);

      const stepDate = new Date(raceStartDate);

      // If time is early morning (like 01:30), it's probably the next day
      if (hours < 12 && stepIndex > 1) {
        stepDate.setDate(stepDate.getDate() + 1);
      }

      // Set the time in Brussels timezone (convert to UTC)
      const utcHours = hours - 2; // Brussels is UTC+2 in summer
      stepDate.setUTCHours(utcHours, minutes, 0, 0);
      return stepDate.toISOString();
    };

    // Insert step
    const { data: insertedStep, error: stepError } = await supabase
      .from("steps")
      .insert({
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
      })
      .select()
      .single();

    if (stepError) {
      console.error(`Error inserting step ${stepData.index}:`, stepError);
      continue;
    }

    console.log(`Created step ${insertedStep.id} for step ${stepData.index}`);
  }
}

async function importGPX(gpxFilePath: string) {
  console.log(`Importing GPX file: ${gpxFilePath}`);

  // Upload GPX file to Supabase Storage
  const fileName = path.basename(gpxFilePath);
  console.log(`Uploading ${fileName} to Supabase Storage...`);

  const fileBuffer = await fs.readFile(gpxFilePath);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("gpx-files")
    .upload(`track/${fileName}`, fileBuffer, {
      contentType: "application/gpx+xml",
      upsert: true,
    });

  if (uploadError) {
    console.error(`Error uploading ${fileName}:`, uploadError);
    return;
  }

  console.log(`Successfully uploaded ${fileName} to ${uploadData.path}`);

  // Parse GPX trackpoints
  const trackPoints = await parseGPX(gpxFilePath, fileName);

  if (trackPoints.length === 0) {
    console.log(`No trackpoints found in ${fileName}`);
    return;
  }

  // Calculate cumulative distance for each trackpoint
  const trackPointsWithDistance = trackPoints.map((point, index) => {
    let cumulativeDistance = 0;

    // Calculate cumulative distance from start
    if (
      index > 0 &&
      point.lat &&
      point.lng &&
      trackPoints[index - 1].lat &&
      trackPoints[index - 1].lng
    ) {
      for (let i = 1; i <= index; i++) {
        const prev = trackPoints[i - 1];
        const curr = trackPoints[i];
        if (prev.lat && prev.lng && curr.lat && curr.lng) {
          cumulativeDistance += calculateDistance(
            prev.lat,
            prev.lng,
            curr.lat,
            curr.lng
          );
        }
      }
    }

    return {
      ...point,
      distance_km: cumulativeDistance,
    };
  });

  // Insert trackpoints in batches
  const batchSize = 1000;
  for (let i = 0; i < trackPointsWithDistance.length; i += batchSize) {
    const batch = trackPointsWithDistance.slice(i, i + batchSize);
    const { error: trackError } = await supabase
      .from("trackpoints")
      .insert(batch);

    if (trackError) {
      console.error(`Error inserting trackpoints batch ${i}:`, trackError);
    }
  }

  console.log(`Imported ${trackPointsWithDistance.length} trackpoints`);
}

async function main() {
  console.log("Starting data import...");

  // Import waypoints
  await importWaypoints();

  // Parse steps CSV data
  const stepsCSVPath = path.join("src", "ressources", "steps.csv");
  const stepsData = await parseStepsCSV(stepsCSVPath);
  console.log(`Loaded ${stepsData.length} steps from CSV`);

  // Import steps from CSV data
  await importSteps(stepsData);

  // Import the single GPX file
  const gpxFilePath = path.join("src", "ressources", "track.gpx"); // Adjust filename as needed

  try {
    await importGPX(gpxFilePath);
    console.log("Data import completed successfully!");
  } catch (error) {
    console.error("Error during import:", error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
