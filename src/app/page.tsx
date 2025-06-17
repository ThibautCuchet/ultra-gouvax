import HomeClient from "./HomeClient";
import { getData } from "@/lib/dataParser";

export default async function Home() {
  const { waypoints, steps, trackpoints, liveTrackConfig } = await getData();

  return (
    <HomeClient
      waypoints={waypoints}
      steps={steps}
      trackpoints={trackpoints}
      liveTrackConfig={liveTrackConfig}
    />
  );
}
