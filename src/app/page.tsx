import HomeClient from './HomeClient';
import { getWaypoints } from '@/lib/dataParser';

export default async function Home() {
  const waypoints = await getWaypoints();
  return <HomeClient waypoints={waypoints} />;
}
