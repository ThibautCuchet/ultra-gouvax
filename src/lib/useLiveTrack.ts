import { useQuery } from "@tanstack/react-query";

export interface FitnessPointData {
  totalDurationSecs: number;
  speedMetersPerSec: number;
  totalDistanceMeters: number;
  activityType: string;
  cadenceCyclesPerMin: number;
  distanceMeters: number;
  durationSecs: number;
  elevationGainMeters: number;
  elevationSource: string | null;
  elevation: number;
  eventTypes: string[];
  heartRateBeatsPerMin: number;
  pointStatus: string;
  powerWatts: number | null;
}

export interface TrackPoint {
  position: {
    lat: number;
    lon: number;
  };
  dateTime: string;
  speed: number;
  fitnessPointData: FitnessPointData;
}

interface LiveTrackData {
  trackPoints: TrackPoint[];
  sessionId: string;
}

interface LiveTrackParams {
  sessionId: string;
  token: string;
}

const GARMIN_GRAPHQL_URL = "https://livetrack.garmin.com/apollo/graphql";

const TRACKPOINTS_QUERY = `
  query getTrackPoints($sessionId: String!, $token: String!, $disablePolling: Boolean) {
    trackPointsBySessionId(
      sessionId: $sessionId
      token: $token
      limit: 3000
      disablePolling: $disablePolling
    ) {
      trackPoints {
        fitnessPointData {
          totalDurationSecs
          speedMetersPerSec
          totalDistanceMeters
          activityType
          cadenceCyclesPerMin
          distanceMeters
          durationSecs
          elevationGainMeters
          elevationSource
          elevation
          eventTypes
          heartRateBeatsPerMin
          pointStatus
          powerWatts
        }
        position {
          lat
          lon
        }
        dateTime
        speed
      }
      sessionId
    }
  }
`;

export function parseLiveTrackUrl(url: string): LiveTrackParams | null {
  try {
    const regex = /\/session\/([^\/]+)\/token\/([^\/\?]+)/;
    const match = url.match(regex);

    if (match) {
      return {
        sessionId: match[1],
        token: match[2],
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing LiveTrack URL:", error);
    return null;
  }
}

// Fonction pour récupérer les données LiveTrack
async function fetchLiveTrackData(
  params: LiveTrackParams
): Promise<LiveTrackData> {
  const response = await fetch(GARMIN_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: TRACKPOINTS_QUERY,
      variables: {
        sessionId: params.sessionId,
        token: params.token,
        disablePolling: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const liveTrackData = result.data?.trackPointsBySessionId;
  if (!liveTrackData) {
    throw new Error("No trackpoints data received");
  }

  return liveTrackData;
}

export function useLiveTrack(liveTrackUrl: string | null) {
  // Parser l'URL pour extraire les paramètres
  const params = liveTrackUrl ? parseLiveTrackUrl(liveTrackUrl) : null;

  const { data, error, isLoading, isError, refetch, isFetching, isSuccess } =
    useQuery({
      queryKey: ["livetrack", params?.sessionId, params?.token],
      queryFn: () => fetchLiveTrackData(params!),
      enabled: !!params, // Seulement si on a des paramètres valides
      refetchInterval: 10000, // Refetch toutes les 10 secondes
      refetchIntervalInBackground: true,
      staleTime: 5000, // Données considérées comme fraîches pendant 5 secondes
      gcTime: 5 * 60 * 1000, // Cache pendant 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

  return {
    data: data || null,
    loading: isLoading,
    error: error?.message || null,
    isConnected: isSuccess && !isError,
    isFetching,
    refresh: refetch,
  };
}
