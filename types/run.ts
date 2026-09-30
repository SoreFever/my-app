export type Run = {
  id: string;
  user_id: string;
  created_at: string;
  distance_km: number;
  duration_seconds: number;
  title: string | null;
  notes: string | null;
  photo_url: string | null;
  route_polyline: string | null;
  avg_heartrate: number | null;
  calories: number | null;
  elevation_gain: number | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};
