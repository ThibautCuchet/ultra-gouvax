import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import { STAGES, WayPoint, TrackPoint } from '../src/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

async function parseWaypoints(filePath: string): Promise<WayPoint[]> {
  const csvContent = await fs.readFile(filePath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const name = values[1];
    return {
      km: Number.parseFloat(values[0]),
      name: name.replace(/"/g, ''),
      lat: Number.parseFloat(values[2]),
      lng: Number.parseFloat(values[3]),
      isRavito: name.toLowerCase().includes('ravito'),
    };
  });
}

async function parseGPX(filePath: string): Promise<TrackPoint[]> {
  const gpxContent = await fs.readFile(filePath, 'utf-8');
  const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g;
  const eleRegex = /<ele>([^<]+)<\/ele>/g;
  const timeRegex = /<time>([^<]+)<\/time>/g;

  const trackPoints: TrackPoint[] = [];
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
    });
  }

  return trackPoints;
}

async function importWaypoints() {
  const csvPath = path.join('src', 'ressources', 'Coordonn_es_avec_RAVITO_4.csv');
  const waypoints = await parseWaypoints(csvPath);
  await supabase.from('waypoints').insert(waypoints);
}

async function importTracks() {
  const base = path.join('src', 'ressources');
  for (const stage of STAGES) {
    const filePath = path.join(base, stage.gpxFile);
    const points = await parseGPX(filePath);
    const rows = points.map((p) => ({ ...p, gpx_filename: stage.gpxFile }));
    if (rows.length > 0) {
      await supabase.from('trackpoints').insert(rows);
    }
  }
}

async function main() {
  await importWaypoints();
  await importTracks();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
