export interface Stage {
  id: number;
  name: string;
  start: string;
  end: string;
  distance: number;
  elevation: number;
  startTime: string;
  startCoords: [number, number];
  gpxFile: string;
  description?: string;
}

export interface WayPoint {
  km: number;
  name: string;
  lat: number;
  lng: number;
  is_ravito: boolean;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  elevation?: number;
  time?: Date;
}

export interface LivePosition {
  lat: number;
  lng: number;
  timestamp: Date;
  speed?: number;
  elevation?: number;
}

export interface ETACalculation {
  waypoint: WayPoint;
  eta: Date;
  distance: number;
  progress: number;
}

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "Étape 1",
    start: "Hoeilaart",
    end: "Écurie Picaute",
    distance: 23,
    elevation: 320,
    startTime: "19:00",
    startCoords: [50.76637, 4.49777],
    gpxFile: "2025-04-26_2192019609_Hoeilaart-Gouvy_ étape 1.gpx",
    description: "80% de piste cyclables",
  },
  {
    id: 2,
    name: "Étape 2",
    start: "Écurie Picaute",
    end: "Château de Fernelmont",
    distance: 25,
    elevation: 140,
    startTime: "22:10",
    startCoords: [50.66419, 4.73711],
    gpxFile: "2025-04-26_2192036286_Hoeilaart-Gouvy _ étape 2.gpx",
    description: "Très plat, 50% de piste cyclables",
  },
  {
    id: 3,
    name: "Étape 3",
    start: "Château de Fernelmont",
    end: "Château de Hodoumont",
    distance: 24.8,
    elevation: 290,
    startTime: "01:30",
    startCoords: [50.54546, 4.98677],
    gpxFile: "2025-04-26_2192076126_Hoeilaart-Gouvy _ étape 3.gpx",
  },
  {
    id: 4,
    name: "Étape 4",
    start: "Château de Hodoumont",
    end: "Chapelle Petit-Han",
    distance: 25.5,
    elevation: 390,
    startTime: "04:50",
    startCoords: [50.43677, 5.19983],
    gpxFile: "2025-04-26_2192129450_Hoeilaart-Gouvy _ étape 4.gpx",
    description: "Moins praticable à vélo",
  },
  {
    id: 5,
    name: "Étape 5",
    start: "Chapelle Petit-Han",
    end: "Odeigne",
    distance: 24.4,
    elevation: 540,
    startTime: "08:14",
    startCoords: [50.3326, 5.44444],
    gpxFile: "2025-04-26_2192173152_Hoeilaart-Gouvy_ étape 5.gpx",
    description: "Très vallonné",
  },
  {
    id: 6,
    name: "Étape 6",
    start: "Odeigne",
    end: "Gouvy",
    distance: 27.6,
    elevation: 350,
    startTime: "11:42",
    startCoords: [50.25689, 5.68017],
    gpxFile: "2025-04-26_2192193203_Hoeilaart-Gouvy _ étape 6.gpx",
    description: "Last 10 à 2 avec Orsi",
  },
];
