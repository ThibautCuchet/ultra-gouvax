import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { WayPoint } from "@/lib/types";

export async function GET() {
  try {
    const csvPath = path.join(
      process.cwd(),
      "src/ressources/Coordonn_es_avec_RAVITO_4.csv"
    );
    const csvContent = await fs.readFile(csvPath, "utf-8");

    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",");

    const waypoints: WayPoint[] = lines.slice(1).map((line) => {
      const values = line.split(",");
      const name = values[1];

      return {
        km: Number.parseFloat(values[0]),
        name: name.replace(/"/g, ""), // Remove quotes
        lat: Number.parseFloat(values[2]),
        lng: Number.parseFloat(values[3]),
        isRavito: name.toLowerCase().includes("ravito"),
      };
    });

    return NextResponse.json(waypoints);
  } catch (error) {
    console.error("Error reading CSV file:", error);
    return NextResponse.json(
      { error: "Failed to read waypoints data" },
      { status: 500 }
    );
  }
}
