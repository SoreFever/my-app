export type Run = {
  id: string
  user_id: string
  created_at: string
  distance_km: number
  duration_seconds: number
  title?: string
  photo_url?: string
  profiles?: {
    username: string | null
    avatar_url: string | null
  } | null
}